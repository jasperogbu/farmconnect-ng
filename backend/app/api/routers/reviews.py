"""Product and farmer reviews."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, func, select

from app.api.deps import get_current_buyer
from app.core.database import get_session
from app.models import Product, Review, User
from app.schemas import ReviewCreate, ReviewRead

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def _recalculate(session: Session, product: Product) -> None:
    """Recompute average ratings for a product and its farmer."""
    product_rows = session.exec(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.product_id == product.id
        )
    ).one()
    avg, count = product_rows
    product.rating = round(float(avg), 1) if avg is not None else 0.0
    product.total_reviews = int(count or 0)
    session.add(product)

    farmer_rows = session.exec(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.farmer_id == product.farmer_id
        )
    ).one()
    f_avg, f_count = farmer_rows
    farmer = session.get(User, product.farmer_id)
    if farmer is not None:
        farmer.rating = round(float(f_avg), 1) if f_avg is not None else 0.0
        farmer.total_reviews = int(f_count or 0)
        session.add(farmer)


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_buyer),
    session: Session = Depends(get_session),
) -> ReviewRead:
    """A buyer reviews a product. Only one review per product per buyer."""
    product = session.get(Product, payload.product_id)
    if product is None or product.is_removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    existing = session.exec(
        select(Review).where(
            Review.buyer_id == current_user.id,
            Review.product_id == payload.product_id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product.",
        )

    review = Review(
        buyer_id=current_user.id,
        product_id=product.id,
        farmer_id=product.farmer_id,
        rating=payload.rating,
        comment=payload.comment.strip(),
    )
    session.add(review)
    session.flush()

    _recalculate(session, product)
    session.commit()
    session.refresh(review)

    result = ReviewRead.model_validate(review)
    result.buyer_name = current_user.full_name
    return result


@router.get("/mine", response_model=list[ReviewRead])
def my_reviews(
    current_user: User = Depends(get_current_buyer),
    session: Session = Depends(get_session),
) -> list[ReviewRead]:
    reviews = session.exec(
        select(Review)
        .where(Review.buyer_id == current_user.id)
        .order_by(Review.created_at.desc())
    ).all()
    # Buyer's own reviews already carry the buyer's name.
    result = []
    for r in reviews:
        item = ReviewRead.model_validate(r)
        item.buyer_name = current_user.full_name
        result.append(item)
    return result
