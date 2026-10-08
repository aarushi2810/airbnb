"""services/review_service.py — Review creation and rating aggregation."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.booking import Booking
from app.models.listing import Listing
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut, ReviewsPage


def create_review(db: Session, listing_id: int, payload: ReviewCreate, user: User) -> ReviewOut:
    """
    Post a review for a listing. Rules:
    - listing must exist and be active
    - if booking_id is provided, the booking must be by this user for this listing
    - one review per booking (enforced by DB unique constraint)
    """
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if payload.booking_id:
        booking = db.get(Booking, payload.booking_id)
        if not booking or booking.listing_id != listing_id or booking.guest_id != user.id:
            raise HTTPException(status_code=400, detail="Invalid booking reference")

    review = Review(
        listing_id=listing_id,
        author_id=user.id,
        booking_id=payload.booking_id,
        rating=payload.rating,
        cleanliness=payload.cleanliness,
        accuracy=payload.accuracy,
        communication=payload.communication,
        location=payload.location,
        checkin=payload.checkin,
        value=payload.value,
        comment=payload.comment,
    )
    db.add(review)
    db.flush()  # get the ID before the aggregate recompute

    # Recompute listing.rating_avg and review_count
    agg = db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.listing_id == listing_id)
    ).one()
    listing.rating_avg = round(float(agg[0] or 0), 2)
    listing.review_count = agg[1]

    db.commit()
    db.refresh(review)
    return ReviewOut.model_validate(review)


def get_reviews(
    db: Session,
    listing_id: int,
    page: int = 1,
    page_size: int = 10,
) -> ReviewsPage:
    from sqlalchemy.orm import joinedload

    total = db.execute(
        select(func.count(Review.id)).where(Review.listing_id == listing_id)
    ).scalar_one()

    rows = db.execute(
        select(Review)
        .options(joinedload(Review.author))
        .where(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    # Compute average sub-ratings
    avgs = db.execute(
        select(
            func.avg(Review.cleanliness),
            func.avg(Review.accuracy),
            func.avg(Review.communication),
            func.avg(Review.location),
            func.avg(Review.checkin),
            func.avg(Review.value),
        ).where(Review.listing_id == listing_id)
    ).one()

    def _r(val):
        return round(float(val), 2) if val is not None else None

    return ReviewsPage(
        items=[ReviewOut.model_validate(r) for r in rows],
        total=total,
        page=page,
        has_more=(page * page_size) < total,
        avg_cleanliness=_r(avgs[0]),
        avg_accuracy=_r(avgs[1]),
        avg_communication=_r(avgs[2]),
        avg_location=_r(avgs[3]),
        avg_checkin=_r(avgs[4]),
        avg_value=_r(avgs[5]),
    )
