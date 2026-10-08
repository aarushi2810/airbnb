"""routers/host.py — Host dashboard endpoints (my listings, reservations)."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, select
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_db, get_host_user
from app.models.booking import Booking
from app.models.listing import Listing
from app.models.user import User
from app.schemas.booking import BookingOut, ListingSummary
from app.schemas.listing import ListingDetail
from app.services.listing_service import get_listing_detail

router = APIRouter(prefix="/api/host", tags=["host"])


@router.get("/listings", response_model=list[ListingDetail])
def host_listings(
    db: Session = Depends(get_db),
    user: User = Depends(get_host_user),
):
    """Return all listings owned by the authenticated host."""
    listings = db.execute(
        select(Listing)
        .where(Listing.host_id == user.id)
        .order_by(Listing.created_at.desc())
    ).scalars().all()
    # Load each with full detail (host, images, amenities)
    return [get_listing_detail(db, lst.id) for lst in listings]


@router.get("/bookings", response_model=list[BookingOut])
def host_bookings(
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_host_user),
):
    """Return all bookings for listings owned by the authenticated host."""
    q = (
        select(Booking)
        .join(Listing, Booking.listing_id == Listing.id)
        .options(
            joinedload(Booking.listing).joinedload(Listing.images),
            joinedload(Booking.guest),
        )
        .where(Listing.host_id == user.id)
        .order_by(Booking.check_in.desc())
    )
    if status:
        q = q.where(Booking.status == status)

    bookings = db.execute(q).scalars().unique().all()

    result = []
    for b in bookings:
        cover = b.listing.images[0].url if b.listing.images else None
        listing_summary = ListingSummary(
            id=b.listing.id,
            title=b.listing.title,
            city=b.listing.city,
            country=b.listing.country,
            cover_image=cover,
        )
        out = BookingOut.model_validate(b)
        out.listing = listing_summary
        result.append(out)
    return result


@router.get("/dashboard")
def host_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_host_user),
):
    """Aggregate dashboard metrics for the authenticated host."""
    from datetime import date
    from sqlalchemy import func

    # Active & total listings
    active_count = db.execute(
        select(func.count(Listing.id)).where(Listing.host_id == user.id, Listing.status == "active")
    ).scalar() or 0

    total_count = db.execute(
        select(func.count(Listing.id)).where(Listing.host_id == user.id)
    ).scalar() or 0

    # Bookings on host's listings
    q_bookings = (
        select(Booking)
        .join(Listing, Booking.listing_id == Listing.id)
        .where(Listing.host_id == user.id)
    )
    all_bookings = db.execute(q_bookings).scalars().all()

    upcoming_count = sum(
        1 for b in all_bookings if b.status == "confirmed" and b.check_out >= date.today()
    )

    # Estimated earnings: total_price - service_fee for confirmed/completed bookings
    estimated_earnings = sum(
        (b.total_price - b.service_fee)
        for b in all_bookings
        if b.status in ("confirmed", "completed")
    )

    return {
        "active_listings": active_count,
        "total_listings": total_count,
        "upcoming_reservations": upcoming_count,
        "estimated_earnings": round(estimated_earnings, 2),
    }
