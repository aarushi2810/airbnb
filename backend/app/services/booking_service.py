"""services/booking_service.py — Booking creation with transaction-safe overlap check.

OVERLAP RULE (closed-open intervals):
  A new booking [new_in, new_out) conflicts with existing [ex_in, ex_out) if:
      new_in  < ex_out  AND  new_out > ex_in
  This means: check-out day is available for a new check-in.

The check and insert happen inside a single DB transaction so concurrent
requests cannot both see "no conflict" and double-book the same dates.
SQLite's default serialized write ensures this on a single server instance.
"""

from datetime import date
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingConfirmation, BookingOut, PriceBreakdown, ListingSummary
from app.services.pricing_service import compute_price


def _get_cover_image(listing: Listing) -> Optional[str]:
    if listing.images:
        return listing.images[0].url
    return None


def check_overlap(
    db: Session,
    listing_id: int,
    check_in: date,
    check_out: date,
    exclude_booking_id: Optional[int] = None,
) -> bool:
    """Return True if a confirmed booking overlaps the requested dates."""
    q = select(Booking).where(
        and_(
            Booking.listing_id == listing_id,
            Booking.status == "confirmed",
            Booking.check_in < check_out,   # existing starts before new ends
            Booking.check_out > check_in,   # existing ends after new starts
        )
    )
    if exclude_booking_id:
        q = q.where(Booking.id != exclude_booking_id)
    return db.execute(q).first() is not None


def create_booking(
    db: Session,
    payload: BookingCreate,
    guest: User,
) -> BookingConfirmation:
    """
    Validate and create a booking inside a single transaction.
    Raises 409 on date conflict, 400 on business-rule violations.
    """
    # 1. Load listing
    listing = db.get(Listing, payload.listing_id)
    if listing is None or listing.status != "active":
        raise HTTPException(status_code=404, detail="Listing not found or inactive")

    # 2. Guest count validation
    total_guests = payload.guests_adults + payload.guests_children
    if total_guests > listing.max_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Max {listing.max_guests} guests allowed (you requested {total_guests})",
        )

    # 3. Date validation
    if payload.check_in < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="check_in cannot be in the past",
        )

    # 4. Overlap check (inside the same transaction to prevent races)
    if check_overlap(db, payload.listing_id, payload.check_in, payload.check_out):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "These dates are no longer available for this listing.",
                "code": "DATE_CONFLICT",
            },
        )

    # 5. Compute price server-side
    pricing = compute_price(
        check_in=payload.check_in,
        check_out=payload.check_out,
        nightly_rate=float(listing.price_per_night),
        cleaning_fee=float(listing.cleaning_fee),
    )

    # 6. Create and commit the booking
    booking = Booking(
        listing_id=payload.listing_id,
        guest_id=guest.id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests_adults=payload.guests_adults,
        guests_children=payload.guests_children,
        guests_infants=payload.guests_infants,
        nightly_rate=pricing["nightly_rate"],
        cleaning_fee=pricing["cleaning_fee"],
        service_fee=pricing["service_fee"],
        total_price=pricing["total"],
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Build the nested listing summary
    listing_summary = ListingSummary(
        id=listing.id,
        title=listing.title,
        city=listing.city,
        country=listing.country,
        cover_image=_get_cover_image(listing),
    )

    booking_out = BookingOut.model_validate(booking)
    booking_out.listing = listing_summary

    return BookingConfirmation(
        booking=booking_out,
        price_breakdown=PriceBreakdown(**pricing),
    )


def cancel_booking(db: Session, booking_id: int, user: User) -> BookingOut:
    """
    Cancel a booking. Only the guest or the listing host can cancel.
    Cancelled bookings free the dates immediately.
    """
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be cancelled")
    # Authorization: guest who booked or the host of the listing
    if booking.guest_id != user.id and booking.listing.host_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorised to cancel this booking")

    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return BookingOut.model_validate(booking)
