"""Orders placed by buyers against a farmer's product listing."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class OrderStatus(str, Enum):
    """Lifecycle of an order.

    Payment and OTP verification are intentionally out of scope for this
    release (see ``Build.md`` for the planned roadmap).
    """

    pending = "pending"
    accepted = "accepted"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class Order(SQLModel, table=True):
    """A purchase request from a buyer to a farmer.

    Product details are snapshotted so that later edits to a listing do not
    alter the historical order record.
    """

    __tablename__ = "orders"

    id: Optional[int] = Field(default=None, primary_key=True)
    buyer_id: int = Field(foreign_key="users.id", index=True)
    farmer_id: int = Field(foreign_key="users.id", index=True)
    product_id: Optional[int] = Field(default=None, foreign_key="products.id")

    product_name: str
    unit: str = Field(default="kg")
    quantity: float = Field(default=1)
    unit_price: float = Field(default=0)
    total_price: float = Field(default=0)

    status: OrderStatus = Field(default=OrderStatus.pending, index=True)

    delivery_state: Optional[str] = Field(default=None)
    delivery_city: Optional[str] = Field(default=None)
    delivery_address: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
