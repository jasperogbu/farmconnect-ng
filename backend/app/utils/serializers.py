"""Helpers that turn database rows into API response objects."""

from typing import Optional

from app.models import Order, Product, User
from app.schemas import OrderRead, ProductRead


def product_to_read(product: Product, farmer: Optional[User] = None) -> ProductRead:
    """Serialise a product, optionally attaching its farmer's public details."""
    data = ProductRead.model_validate(product)
    if farmer is not None:
        data.farmer_name = farmer.full_name
        data.farmer_rating = farmer.rating
    return data


def order_to_read(
    order: Order,
    buyer: Optional[User] = None,
    farmer: Optional[User] = None,
    product: Optional[Product] = None,
    reviewed: bool = False,
) -> OrderRead:
    """Serialise an order with optional joined display fields."""
    data = OrderRead.model_validate(order)
    if buyer is not None:
        data.buyer_name = buyer.full_name
    if farmer is not None:
        data.farmer_name = farmer.full_name
    if product is not None:
        data.product_image = product.image_url
    data.reviewed = reviewed
    return data
