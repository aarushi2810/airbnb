"""models/review.py — Review ORM model.

Each review is tied to a specific booking (one review per booking).
Rating is 1-5; category sub-ratings are also 1-5.
After insert, the listing's rating_avg and review_count are recomputed
in review_service.py.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint, DateTime, Float, ForeignKey,
    Integer, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        # One review per booking
        UniqueConstraint("booking_id", name="uq_review_booking"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_rating_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    booking_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, unique=True
    )

    # Overall rating
    rating: Mapped[float] = mapped_column(Float, nullable=False)

    # Category sub-ratings (all optional, all 1-5)
    cleanliness: Mapped[Optional[float]] = mapped_column(Float)
    accuracy: Mapped[Optional[float]] = mapped_column(Float)
    communication: Mapped[Optional[float]] = mapped_column(Float)
    location: Mapped[Optional[float]] = mapped_column(Float)
    checkin: Mapped[Optional[float]] = mapped_column(Float)
    value: Mapped[Optional[float]] = mapped_column(Float)

    comment: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    listing: Mapped["Listing"] = relationship("Listing", back_populates="reviews")  # type: ignore[name-defined]
    author: Mapped["User"] = relationship("User", back_populates="reviews")  # type: ignore[name-defined]
    booking: Mapped[Optional["Booking"]] = relationship("Booking", back_populates="review")  # type: ignore[name-defined]
