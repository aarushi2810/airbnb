"""models/user.py — User ORM model."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    # Role determines if the user can create listings
    role: Mapped[str] = mapped_column(
        Enum("guest", "host", name="user_role"), nullable=False, default="guest"
    )
    is_superhost: Mapped[bool] = mapped_column(Boolean, default=False)
    bio: Mapped[Optional[str]] = mapped_column(Text)
    response_rate: Mapped[Optional[int]] = mapped_column()  # percentage 0-100
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationships — back-populated from other models
    listings: Mapped[list["Listing"]] = relationship(  # type: ignore[name-defined]
        "Listing", back_populates="host", cascade="all, delete-orphan"
    )
    bookings: Mapped[list["Booking"]] = relationship(  # type: ignore[name-defined]
        "Booking", back_populates="guest", foreign_keys="Booking.guest_id"
    )
    reviews: Mapped[list["Review"]] = relationship(  # type: ignore[name-defined]
        "Review", back_populates="author"
    )
    wishlist_items: Mapped[list["WishlistItem"]] = relationship(  # type: ignore[name-defined]
        "WishlistItem", back_populates="user", cascade="all, delete-orphan"
    )
