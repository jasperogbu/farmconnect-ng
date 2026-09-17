"""Product and farmer reviews written by buyers."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Review(SQLModel, table=True):
    """A rating (1-5) and comment about a product.

    A buyer may leave at most one review per product; the API enforces this.
    """

    __tablename__ = "reviews"

    id: Optional[int] = Field(default=None, primary_key=True)
    buyer_id: int = Field(foreign_key="users.id", index=True)
    product_id: int = Field(foreign_key="products.id", index=True)
    farmer_id: int = Field(foreign_key="users.id", index=True)
    order_id: Optional[int] = Field(default=None, foreign_key="orders.id")

    rating: int = Field(default=5, ge=1, le=5)
    comment: str = Field(default="")

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
