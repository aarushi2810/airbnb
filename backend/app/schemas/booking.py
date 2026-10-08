"""schemas/booking.py — Pydantic v2 schemas for Booking."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator

from app.schemas.listing import ListingCard
from app.schemas.user import UserOut


# ── Request body ──────────────────────────────────────────────────────────── #
class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests_adults: int = 1
    guests_children: int = 0
    guests_infants: int = 0

    @model_validator(mode="after")
    def validate_dates(self) -> "BookingCreate":
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


# ── Price breakdown ───────────────────────────────────────────────────────── #
class PriceBreakdown(BaseModel):
    nights: int
    nightly_rate: float
    subtotal: float        # nights × rate
    cleaning_fee: float
    service_fee: float     # 14 % of subtotal
    total: float


# ── Nested listing summary used inside booking detail ─────────────────────── #
class ListingSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    city: str
    country: str
    cover_image: Optional[str] = None


# ── Booking output schemas ────────────────────────────────────────────────── #
class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests_adults: int
    guests_children: int
    guests_infants: int
    nightly_rate: float
    cleaning_fee: float
    service_fee: float
    total_price: float
    status: str
    created_at: datetime

    # Nested objects (resolved by service / router)
    listing: Optional[ListingSummary] = None
    guest: Optional[UserOut] = None


class BookingConfirmation(BaseModel):
    """Returned after a successful POST /api/bookings."""
    booking: BookingOut
    price_breakdown: PriceBreakdown
