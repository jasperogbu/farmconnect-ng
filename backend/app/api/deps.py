"""Shared FastAPI dependencies for authentication and authorisation."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import decode_access_token
from app.models import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    """Resolve the authenticated user from the ``Authorization`` header."""
    if credentials is None or not credentials.credentials:
        raise _credentials_error

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise _credentials_error

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise _credentials_error

    user = session.get(User, user_id)
    if user is None:
        raise _credentials_error
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support.",
        )
    return user


def require_roles(*roles: UserRole):
    """Build a dependency that only allows the given roles."""

    def _checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return user

    return _checker


get_current_farmer = require_roles(UserRole.farmer)
get_current_buyer = require_roles(UserRole.buyer)
get_current_admin = require_roles(UserRole.admin)
