"""Conversations, REST message history and the realtime chat WebSocket."""

from datetime import datetime
from typing import Dict, Set

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.database import engine, get_session
from app.core.security import decode_access_token
from app.models import Conversation, Message, User
from app.schemas import ConversationCreate, ConversationRead, MessageCreate, MessageRead, UserPublic

router = APIRouter(tags=["Messaging"])


# ---------------------------------------------------------------------------
# Realtime connection manager
# ---------------------------------------------------------------------------


class ConnectionManager:
    """Tracks live WebSocket connections keyed by user id."""

    def __init__(self) -> None:
        self.active: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.setdefault(user_id, set()).add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        sockets = self.active.get(user_id)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self.active.pop(user_id, None)

    def is_online(self, user_id: int) -> bool:
        return bool(self.active.get(user_id))

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        for websocket in list(self.active.get(user_id, set())):
            try:
                await websocket.send_json(payload)
            except Exception:  # pragma: no cover - socket already closing
                self.disconnect(user_id, websocket)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _other_id(conversation: Conversation, user_id: int) -> int:
    return conversation.user2_id if conversation.user1_id == user_id else conversation.user1_id


def _get_conversation_for_user(
    session: Session, conversation_id: int, user_id: int
) -> Conversation:
    conversation = session.get(Conversation, conversation_id)
    if conversation is None or user_id not in (conversation.user1_id, conversation.user2_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found."
        )
    return conversation


def _conversation_to_read(
    session: Session, conversation: Conversation, user_id: int
) -> ConversationRead:
    other = session.get(User, _other_id(conversation, user_id))
    last = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
    ).first()
    unread = session.exec(
        select(Message).where(
            Message.conversation_id == conversation.id,
            Message.sender_id != user_id,
            Message.is_read == False,  # noqa: E712
        )
    ).all()
    return ConversationRead(
        id=conversation.id,
        other_user=UserPublic.model_validate(other),
        last_message=last.content if last else None,
        last_message_at=last.created_at if last else None,
        unread_count=len(unread),
        updated_at=conversation.updated_at,
    )


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[ConversationRead]:
    conversations = session.exec(
        select(Conversation)
        .where(
            (Conversation.user1_id == current_user.id)
            | (Conversation.user2_id == current_user.id)
        )
        .order_by(Conversation.updated_at.desc())
    ).all()
    return [_conversation_to_read(session, c, current_user.id) for c in conversations]


@router.post("/conversations", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ConversationRead:
    """Find or create the conversation between the current user and another."""
    if payload.other_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot start a conversation with yourself.",
        )
    other = session.get(User, payload.other_user_id)
    if other is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    low, high = sorted((current_user.id, payload.other_user_id))
    conversation = session.exec(
        select(Conversation).where(
            Conversation.user1_id == low, Conversation.user2_id == high
        )
    ).first()
    if conversation is None:
        conversation = Conversation(user1_id=low, user2_id=high)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
    return _conversation_to_read(session, conversation, current_user.id)


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ConversationRead:
    conversation = _get_conversation_for_user(session, conversation_id, current_user.id)
    return _conversation_to_read(session, conversation, current_user.id)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageRead])
def get_messages(
    conversation_id: int,
    limit: int = Query(default=100, le=500),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[MessageRead]:
    _get_conversation_for_user(session, conversation_id, current_user.id)
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
    ).all()
    return [MessageRead.model_validate(m) for m in messages]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageRead,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> MessageRead:
    """REST fallback for sending a message (also broadcasts over WebSocket)."""
    conversation = _get_conversation_for_user(session, conversation_id, current_user.id)
    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=payload.content.strip(),
    )
    conversation.updated_at = datetime.utcnow()
    session.add(message)
    session.add(conversation)
    session.commit()
    session.refresh(message)

    data = MessageRead.model_validate(message)
    await manager.send_to_user(
        _other_id(conversation, current_user.id),
        {"type": "message", "conversation_id": conversation.id, "data": data.model_dump(mode="json")},
    )
    return data


@router.put("/conversations/{conversation_id}/read", response_model=dict)
def mark_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    conversation = _get_conversation_for_user(session, conversation_id, current_user.id)
    unread = session.exec(
        select(Message).where(
            Message.conversation_id == conversation.id,
            Message.sender_id != current_user.id,
            Message.is_read == False,  # noqa: E712
        )
    ).all()
    for message in unread:
        message.is_read = True
        session.add(message)
    session.commit()
    return {"message": "Marked as read.", "count": len(unread)}


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------


@router.websocket("/ws/chat")
async def chat_socket(websocket: WebSocket, token: str = Query(default="")) -> None:
    """Authenticated realtime chat channel.

    Client JSON frames:
      {"type": "message", "conversation_id": 1, "content": "hi"}
      {"type": "typing", "conversation_id": 1, "is_typing": true}
      {"type": "read", "conversation_id": 1}
    """
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=4401)
        return

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        await websocket.close(code=4401)
        return

    with Session(engine) as session:
        user = session.get(User, user_id)
        if user is None or not user.is_active:
            await websocket.close(code=4401)
            return

    await manager.connect(user_id, websocket)

    try:
        while True:
            frame = await websocket.receive_json()
            frame_type = frame.get("type")
            conversation_id = frame.get("conversation_id")

            with Session(engine) as session:
                if not isinstance(conversation_id, int):
                    continue
                conversation = session.get(Conversation, conversation_id)
                if conversation is None or user_id not in (
                    conversation.user1_id,
                    conversation.user2_id,
                ):
                    continue
                recipient = _other_id(conversation, user_id)

                if frame_type == "message":
                    content = str(frame.get("content", "")).strip()
                    if not content:
                        continue
                    message = Message(
                        conversation_id=conversation.id,
                        sender_id=user_id,
                        content=content[:5000],
                    )
                    conversation.updated_at = datetime.utcnow()
                    session.add(message)
                    session.add(conversation)
                    session.commit()
                    session.refresh(message)

                    outgoing = {
                        "type": "message",
                        "conversation_id": conversation.id,
                        "data": MessageRead.model_validate(message).model_dump(mode="json"),
                    }
                    await manager.send_to_user(recipient, outgoing)
                    await manager.send_to_user(user_id, outgoing)

                elif frame_type == "typing":
                    await manager.send_to_user(
                        recipient,
                        {
                            "type": "typing",
                            "conversation_id": conversation.id,
                            "user_id": user_id,
                            "is_typing": bool(frame.get("is_typing", True)),
                        },
                    )

                elif frame_type == "read":
                    unread = session.exec(
                        select(Message).where(
                            Message.conversation_id == conversation.id,
                            Message.sender_id != user_id,
                            Message.is_read == False,  # noqa: E712
                        )
                    ).all()
                    for message in unread:
                        message.is_read = True
                        session.add(message)
                    session.commit()
                    await manager.send_to_user(
                        recipient,
                        {"type": "read", "conversation_id": conversation.id, "user_id": user_id},
                    )

    except WebSocketDisconnect:
        pass
    except Exception:  # pragma: no cover - defensive
        pass
    finally:
        manager.disconnect(user_id, websocket)
