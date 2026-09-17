"""User profile and public farmer endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.api.deps import get_current_user
from app.core.database import get_session
from app.core.security import hash_password
from app.models import Product, Review, User, UserRole
from app.schemas import ProductRead, UserPublic, UserUpdate
from app.utils.serializers import product_to_read

router = APIRouter(tags=["Users & Farmers"])


@router.get("/users/me", response_model=UserPublic)
def read_profile(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic.model_validate(current_user)


@router.put("/users/me", response_model=UserPublic)
def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> UserPublic:
    """Update the authenticated user's own profile."""
    updates = payload.model_dump(exclude_unset=True)
    password = updates.pop("password", None)

    for field, value in updates.items():
        setattr(current_user, field, value)
    if password:
        current_user.hashed_password = hash_password(password)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return UserPublic.model_validate(current_user)


@router.get("/farmers", response_model=list[UserPublic])
def list_farmers(
    q: str | None = Query(default=None, description="Search by name, city or state"),
    state: str | None = Query(default=None),
    limit: int = Query(default=50, le=100),
    session: Session = Depends(get_session),
) -> list[UserPublic]:
    """Public directory of farmers."""
    statement = select(User).where(
        User.role == UserRole.farmer, User.is_active == True  # noqa: E712
    )
    if state:
        statement = statement.where(User.state == state)
    if q:
        like = f"%{q.lower()}%"
        statement = statement.where(
            func.lower(User.full_name).like(like)
            | func.lower(User.city).like(like)
            | func.lower(User.state).like(like)
        )
    statement = statement.order_by(User.rating.desc(), User.full_name).limit(limit)
    farmers = session.exec(statement).all()
    return [UserPublic.model_validate(f) for f in farmers]


@router.get("/farmers/{farmer_id}", response_model=UserPublic)
def get_farmer(farmer_id: int, session: Session = Depends(get_session)) -> UserPublic:
    farmer = session.get(User, farmer_id)
    if farmer is None or farmer.role != UserRole.farmer or not farmer.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer not found.")
    return UserPublic.model_validate(farmer)


@router.get("/farmers/{farmer_id}/products", response_model=list[ProductRead])
def get_farmer_products(
    farmer_id: int,
    session: Session = Depends(get_session),
) -> list[ProductRead]:
    farmer = session.get(User, farmer_id)
    products = session.exec(
        select(Product).where(
            Product.farmer_id == farmer_id,
            Product.is_available == True,  # noqa: E712
            Product.is_removed == False,  # noqa: E712
        )
    ).all()
    return [product_to_read(p, farmer) for p in products]


@router.get("/farmers/{farmer_id}/reviews")
def get_farmer_reviews(
    farmer_id: int,
    session: Session = Depends(get_session),
) -> list[dict]:
    """Reviews received on any product belonging to a farmer."""
    rows = session.exec(select(Review).where(Review.farmer_id == farmer_id)).all()
    buyer_ids = {r.buyer_id for r in rows}
    buyers = {
        u.id: u.full_name
        for u in session.exec(select(User).where(User.id.in_(buyer_ids))).all()
    } if buyer_ids else {}

    product_ids = {r.product_id for r in rows}
    products = {
        p.id: p.name
        for p in session.exec(select(Product).where(Product.id.in_(product_ids))).all()
    } if product_ids else {}

    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
            "buyer_name": buyers.get(r.buyer_id, "Buyer"),
            "product_name": products.get(r.product_id, ""),
        }
        for r in rows
    ]
