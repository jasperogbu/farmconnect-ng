"""Agricultural product listings created by farmers."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Product(SQLModel, table=True):
    """A farm produce listing.

    Quantities are stored as floats together with a human-friendly ``unit``
    (e.g. ``kg``, ``bag``, ``tonne``, ``crate``) because Nigerian produce is
    traded in a mix of metric and local units.
    """

    __tablename__ = "products"

    id: Optional[int] = Field(default=None, primary_key=True)
    farmer_id: int = Field(foreign_key="users.id", index=True)

    name: str = Field(index=True)
    category: str = Field(index=True)
    description: str = Field(default="")

    quantity: float = Field(default=0)
    unit: str = Field(default="kg")
    price: float = Field(default=0)  # price per unit, in Naira

    state: Optional[str] = Field(default=None, index=True)
    city: Optional[str] = Field(default=None)
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)

    image_url: Optional[str] = Field(default=None)

    is_available: bool = Field(default=True)
    is_removed: bool = Field(default=False)  # set by an administrator

    rating: float = Field(default=0.0)
    total_reviews: int = Field(default=0)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
