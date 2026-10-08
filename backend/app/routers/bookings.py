"""routers/bookings.py — Booking lifecycle endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db, get_required_user
from app.models.booking import Booking
from app.models.listing import Listing, ListingImage
from app.models.user import User
from app.schemas.booking import (
    BookingConfirmation, BookingCreate, BookingOut, ListingSummary,
)
from app.services.booking_service import cancel_booking, create_booking

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _enrich_booking(booking: Booking) -> BookingOut:
    """Attach the listing summary to a BookingOut."""
    cover = booking.listing.images[0].url if booking.listing.images else None
    listing_summary = ListingSummary(
        id=booking.listing.id,
        title=booking.listing.title,
        city=booking.listing.city,
        country=booking.listing.country,
        cover_image=cover,
    )
    out = BookingOut.model_validate(booking)
    out.listing = listing_summary
    return out


from pydantic import BaseModel
from datetime import date
from fastapi import HTTPException
from app.services.pricing_service import compute_price
from app.schemas.booking import PriceBreakdown


class PriceQuoteRequest(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests_count: Optional[int] = None


@router.post("/price", response_model=PriceBreakdown)
def quote_price(
    payload: PriceQuoteRequest,
    db: Session = Depends(get_db),
):
    """Quote price breakdown for a requested date range."""
    listing = db.get(Listing, payload.listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    pricing = compute_price(
        check_in=payload.check_in,
        check_out=payload.check_out,
        nightly_rate=float(listing.price_per_night),
        cleaning_fee=float(listing.cleaning_fee),
    )
    return PriceBreakdown(**pricing)


@router.post("", response_model=BookingConfirmation, status_code=201)
def book(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_required_user),
):
    """Create a booking with atomic overlap check."""
    return create_booking(db, payload, user)


@router.get("/me", response_model=list[BookingOut])
@router.get("/my", response_model=list[BookingOut])
def my_bookings(
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_required_user),
):
    """Return all bookings for the current user, optionally filtered by status."""
    q = (
        select(Booking)
        .options(
            joinedload(Booking.listing).joinedload(Listing.images),
        )
        .where(Booking.guest_id == user.id)
        .order_by(Booking.check_in.desc())
    )
    if status:
        q = q.where(Booking.status == status)
    bookings = db.execute(q).scalars().unique().all()
    return [_enrich_booking(b) for b in bookings]


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_required_user),
):
    booking = db.execute(
        select(Booking)
        .options(joinedload(Booking.listing).joinedload(Listing.images))
        .where(Booking.id == booking_id)
    ).unique().scalar_one_or_none()
    if not booking or (booking.guest_id != user.id and booking.listing.host_id != user.id):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Booking not found")
    return _enrich_booking(booking)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_required_user),
):
    return cancel_booking(db, booking_id, user)
