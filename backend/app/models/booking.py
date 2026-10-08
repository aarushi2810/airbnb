"""models/booking.py — Booking ORM model.

Key constraint: check_out > check_in (enforced at Python level and DB level).
Overlap detection is done in booking_service.py inside a transaction.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint, Date, DateTime, Enum, ForeignKey,
    Index, Integer, Numeric, String, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _gen_code() -> str:
    """Generate a short booking reference code like HMAB1C2D."""
    return "HM" + uuid.uuid4().hex[:6].upper()


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        # Enforce check_out > check_in at DB level
        CheckConstraint("check_out > check_in", name="ck_checkout_after_checkin"),
        # Index for fast overlap queries: WHERE listing_id=? AND check_in < ? AND check_out > ?
        Index("ix_bookings_listing_dates", "listing_id", "check_in", "check_out"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(
        String(12), unique=True, nullable=False, default=_gen_code
    )
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), nullable=False
    )
    guest_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)

    # Guest composition
    guests_adults: Mapped[int] = mapped_column(Integer, default=1)
    guests_children: Mapped[int] = mapped_column(Integer, default=0)
    guests_infants: Mapped[int] = mapped_column(Integer, default=0)

    # Pricing — stored at booking time (rate may change later)
    nightly_rate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    cleaning_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    service_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0)
    total_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    status: Mapped[str] = mapped_column(
        Enum("confirmed", "cancelled", "completed", name="booking_status"),
        nullable=False,
        default="confirmed",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    listing: Mapped["Listing"] = relationship("Listing", back_populates="bookings")  # type: ignore[name-defined]
    guest: Mapped["User"] = relationship(  # type: ignore[name-defined]
        "User", back_populates="bookings", foreign_keys=[guest_id]
    )
    review: Mapped["Review"] = relationship(  # type: ignore[name-defined]
        "Review", back_populates="booking", uselist=False
    )
