"""models/wishlist.py — WishlistItem ORM model.

Composite PK (user_id, listing_id) ensures each user can save
a listing only once. The relationship allows easy retrieval of
all wishlisted listings for a user.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="wishlist_items")  # type: ignore[name-defined]
    listing: Mapped["Listing"] = relationship("Listing", back_populates="wishlist_items")  # type: ignore[name-defined]
