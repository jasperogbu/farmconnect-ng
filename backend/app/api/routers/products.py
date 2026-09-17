"""Product catalogue: browsing, search and farmer management."""

import math
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.api.deps import get_current_farmer
from app.core.database import get_session
from app.models import Product, Review, User, UserRole
from app.schemas import (
    ProductCreate,
    ProductPage,
    ProductRead,
    ProductUpdate,
    ReviewRead,
)
from app.utils.serializers import product_to_read

router = APIRouter(prefix="/products", tags=["Products"])


def _get_product_or_404(session: Session, product_id: int) -> Product:
    product = session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product


@router.get("", response_model=ProductPage)
def list_products(
    q: str | None = Query(default=None, description="Free-text search"),
    category: str | None = Query(default=None),
    state: str | None = Query(default=None),
    city: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort: str = Query(default="newest", pattern="^(newest|price_asc|price_desc|rating)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
    session: Session = Depends(get_session),
) -> ProductPage:
    """Browse the marketplace with search, filters, sorting and pagination."""
    statement = select(Product).where(
        Product.is_available == True,  # noqa: E712
        Product.is_removed == False,  # noqa: E712
    )

    if q:
        like = f"%{q.lower()}%"
        statement = statement.where(
            func.lower(Product.name).like(like)
            | func.lower(Product.description).like(like)
            | func.lower(Product.category).like(like)
        )
    if category:
        statement = statement.where(Product.category == category)
    if state:
        statement = statement.where(Product.state == state)
    if city:
        statement = statement.where(func.lower(Product.city).like(f"%{city.lower()}%"))
    if min_price is not None:
        statement = statement.where(Product.price >= min_price)
    if max_price is not None:
        statement = statement.where(Product.price <= max_price)

    if sort == "price_asc":
        statement = statement.order_by(Product.price.asc())
    elif sort == "price_desc":
        statement = statement.order_by(Product.price.desc())
    elif sort == "rating":
        statement = statement.order_by(Product.rating.desc(), Product.total_reviews.desc())
    else:
        statement = statement.order_by(Product.created_at.desc())

    total = len(session.exec(statement).all())
    pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size
    products = session.exec(statement.offset(offset).limit(page_size)).all()

    farmer_ids = {p.farmer_id for p in products}
    farmers = {
        u.id: u
        for u in session.exec(select(User).where(User.id.in_(farmer_ids))).all()
    } if farmer_ids else {}

    return ProductPage(
        items=[product_to_read(p, farmers.get(p.farmer_id)) for p in products],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/mine", response_model=list[ProductRead])
def my_products(
    current_user: User = Depends(get_current_farmer),
    session: Session = Depends(get_session),
) -> list[ProductRead]:
    products = session.exec(
        select(Product)
        .where(Product.farmer_id == current_user.id)
        .order_by(Product.created_at.desc())
    ).all()
    return [product_to_read(p, current_user) for p in products]


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, session: Session = Depends(get_session)) -> ProductRead:
    product = _get_product_or_404(session, product_id)
    farmer = session.get(User, product.farmer_id)
    return product_to_read(product, farmer)


@router.get("/{product_id}/reviews", response_model=list[ReviewRead])
def get_product_reviews(
    product_id: int, session: Session = Depends(get_session)
) -> list[ReviewRead]:
    _get_product_or_404(session, product_id)
    reviews = session.exec(
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    ).all()
    buyer_ids = {r.buyer_id for r in reviews}
    buyers = {
        u.id: u.full_name
        for u in session.exec(select(User).where(User.id.in_(buyer_ids))).all()
    } if buyer_ids else {}
    result = []
    for r in reviews:
        item = ReviewRead.model_validate(r)
        item.buyer_name = buyers.get(r.buyer_id, "Buyer")
        result.append(item)
    return result


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_farmer),
    session: Session = Depends(get_session),
) -> ProductRead:
    product = Product(
        farmer_id=current_user.id,
        **payload.model_dump(),
    )
    session.add(product)
    session.commit()
    session.refresh(product)
    return product_to_read(product, current_user)


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_farmer),
    session: Session = Depends(get_session),
) -> ProductRead:
    product = _get_product_or_404(session, product_id)
    if product.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own listings.",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    product.updated_at = datetime.utcnow()

    session.add(product)
    session.commit()
    session.refresh(product)
    return product_to_read(product, current_user)


@router.delete("/{product_id}", response_model=dict)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_farmer),
    session: Session = Depends(get_session),
) -> dict:
    product = _get_product_or_404(session, product_id)
    if product.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own listings.",
        )
    # Soft delete so that existing orders keep their reference.
    product.is_available = False
    product.updated_at = datetime.utcnow()
    session.add(product)
    session.commit()
    return {"message": "Listing removed."}
