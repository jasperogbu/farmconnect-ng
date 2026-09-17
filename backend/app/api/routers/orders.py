"""Order placement and lifecycle management."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models import Order, OrderStatus, Product, Review, User, UserRole
from app.schemas import OrderCreate, OrderRead, OrderStatusUpdate
from app.utils.serializers import order_to_read

router = APIRouter(prefix="/orders", tags=["Orders"])


def _serialise(session: Session, order: Order) -> OrderRead:
    buyer = session.get(User, order.buyer_id)
    farmer = session.get(User, order.farmer_id)
    product = session.get(Product, order.product_id) if order.product_id else None
    reviewed = False
    if order.product_id:
        reviewed = (
            session.exec(
                select(Review).where(
                    Review.buyer_id == order.buyer_id,
                    Review.product_id == order.product_id,
                )
            ).first()
            is not None
        )
    return order_to_read(order, buyer, farmer, product, reviewed)


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> OrderRead:
    """A buyer places an order for a product listing."""
    if current_user.role != UserRole.buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can place orders.",
        )

    product = session.get(Product, payload.product_id)
    if product is None or product.is_removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    if not product.is_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This product is no longer available.",
        )
    if payload.quantity > product.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.quantity} {product.unit} available.",
        )

    order = Order(
        buyer_id=current_user.id,
        farmer_id=product.farmer_id,
        product_id=product.id,
        product_name=product.name,
        unit=product.unit,
        quantity=payload.quantity,
        unit_price=product.price,
        total_price=round(payload.quantity * product.price, 2),
        delivery_state=payload.delivery_state or current_user.state,
        delivery_city=payload.delivery_city or current_user.city,
        delivery_address=payload.delivery_address or current_user.address,
        notes=payload.notes,
    )

    # Reserve the requested quantity immediately.
    product.quantity = max(0, product.quantity - payload.quantity)
    if product.quantity == 0:
        product.is_available = False
    product.updated_at = datetime.utcnow()

    session.add(order)
    session.add(product)
    session.commit()
    session.refresh(order)
    return _serialise(session, order)


@router.get("/mine", response_model=list[OrderRead])
def my_orders(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[OrderRead]:
    """Orders relevant to the current user (buyer's or farmer's)."""
    statement = select(Order)
    if current_user.role == UserRole.farmer:
        statement = statement.where(Order.farmer_id == current_user.id)
    else:
        statement = statement.where(Order.buyer_id == current_user.id)
    orders = session.exec(statement.order_by(Order.created_at.desc())).all()
    return [_serialise(session, o) for o in orders]


@router.get("/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> OrderRead:
    order = session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    allowed = (
        current_user.role == UserRole.admin
        or order.buyer_id == current_user.id
        or order.farmer_id == current_user.id
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view this order."
        )
    return _serialise(session, order)


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_status(
    order_id: int,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> OrderRead:
    """A farmer (or administrator) advances or cancels an order."""
    order = session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    is_owner_farmer = current_user.role == UserRole.farmer and order.farmer_id == current_user.id
    if not (is_owner_farmer or current_user.role == UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the farmer can update this order.",
        )

    if order.status == OrderStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A cancelled order cannot be changed.",
        )

    if payload.status == OrderStatus.cancelled:
        _restore_stock(session, order)

    order.status = payload.status
    order.updated_at = datetime.utcnow()
    session.add(order)
    session.commit()
    session.refresh(order)
    return _serialise(session, order)


@router.post("/{order_id}/cancel", response_model=OrderRead)
def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> OrderRead:
    """Buyer or farmer cancels an order that is not yet delivered."""
    order = session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    is_participant = (
        order.buyer_id == current_user.id or order.farmer_id == current_user.id
    )
    if not (is_participant or current_user.role == UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You cannot cancel this order."
        )
    if order.status in (OrderStatus.delivered, OrderStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order can no longer be cancelled.",
        )

    _restore_stock(session, order)
    order.status = OrderStatus.cancelled
    order.updated_at = datetime.utcnow()
    session.add(order)
    session.commit()
    session.refresh(order)
    return _serialise(session, order)


def _restore_stock(session: Session, order: Order) -> None:
    """Return reserved quantity to the product listing."""
    if order.product_id is None:
        return
    product = session.get(Product, order.product_id)
    if product is None:
        return
    product.quantity = product.quantity + order.quantity
    if product.quantity > 0:
        product.is_available = True
    product.updated_at = datetime.utcnow()
    session.add(product)
