"""Role-specific dashboard summaries."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, func, select

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models import Order, OrderStatus, Product, User, UserRole
from app.schemas import BuyerDashboard, FarmerDashboard, ProductRead
from app.utils.serializers import order_to_read, product_to_read

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])


@router.get("/farmer", response_model=FarmerDashboard)
def farmer_dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> FarmerDashboard:
    if current_user.role != UserRole.farmer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Farmers only."
        )

    products = session.exec(
        select(Product).where(Product.farmer_id == current_user.id)
    ).all()
    active = [p for p in products if p.is_available and not p.is_removed]

    orders = session.exec(
        select(Order)
        .where(Order.farmer_id == current_user.id)
        .order_by(Order.created_at.desc())
    ).all()
    pending = [o for o in orders if o.status == OrderStatus.pending]
    delivered = [o for o in orders if o.status == OrderStatus.delivered]
    earnings = round(sum(o.total_price for o in delivered), 2)

    recent = [order_to_read(o, session.get(User, o.buyer_id), current_user) for o in orders[:5]]

    return FarmerDashboard(
        total_products=len(products),
        active_products=len(active),
        total_orders=len(orders),
        pending_orders=len(pending),
        delivered_orders=len(delivered),
        total_earnings=earnings,
        rating=current_user.rating,
        total_reviews=current_user.total_reviews,
        recent_orders=recent,
    )


@router.get("/buyer", response_model=BuyerDashboard)
def buyer_dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> BuyerDashboard:
    if current_user.role != UserRole.buyer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Buyers only."
        )

    orders = session.exec(
        select(Order)
        .where(Order.buyer_id == current_user.id)
        .order_by(Order.created_at.desc())
    ).all()
    pending = [
        o for o in orders if o.status not in (OrderStatus.delivered, OrderStatus.cancelled)
    ]
    delivered = [o for o in orders if o.status == OrderStatus.delivered]

    recent = [
        order_to_read(o, current_user, session.get(User, o.farmer_id))
        for o in orders[:5]
    ]

    recommended_rows = session.exec(
        select(Product)
        .where(Product.is_available == True, Product.is_removed == False)  # noqa: E712
        .order_by(Product.rating.desc(), Product.created_at.desc())
        .limit(6)
    ).all()
    recommended: list[ProductRead] = []
    for product in recommended_rows:
        farmer = session.get(User, product.farmer_id)
        recommended.append(product_to_read(product, farmer))

    return BuyerDashboard(
        total_orders=len(orders),
        pending_orders=len(pending),
        delivered_orders=len(delivered),
        recent_orders=recent,
        recommended_products=recommended,
    )
