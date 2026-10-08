"""routers/listings.py — Listing CRUD and availability endpoints."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db, get_host_user, get_required_user
from app.models.listing import Amenity, Listing, ListingAmenity, ListingImage
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.schemas.listing import (
    BlockedRange, ListingCard, ListingCreate, ListingDetail,
    ListingImageOut, ListingUpdate, ListingsPage,
)
from app.services.listing_service import (
    get_blocked_ranges, get_listing_detail, get_listings,
)
from app.schemas.review import ReviewCreate, ReviewsPage
from app.services.review_service import create_review, get_reviews

router = APIRouter(prefix="/api/listings", tags=["listings"])


# ── Browse / Search ───────────────────────────────────────────────────────── #
@router.get("", response_model=ListingsPage)
def browse_listings(
    location: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    room_type: Optional[str] = None,
    property_type: Optional[str] = None,
    category_id: Optional[int] = None,
    bedrooms: Optional[int] = None,
    beds: Optional[int] = None,
    bathrooms: Optional[float] = None,
    # Comma-separated amenity IDs, e.g. "1,3,7"
    amenities: Optional[str] = Query(default=None),
    sort: str = "recommended",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=50),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    amenity_ids = None
    if amenities:
        try:
            amenity_ids = [int(x) for x in amenities.split(",") if x.strip()]
        except ValueError:
            raise HTTPException(400, "amenities must be comma-separated integers")

    return get_listings(
        db=db,
        user_id=user.id if user else None,
        location=location,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
        room_type=room_type,
        property_type=property_type,
        category_id=category_id,
        bedrooms=bedrooms,
        beds=beds,
        bathrooms=bathrooms,
        amenity_ids=amenity_ids,
        sort=sort,
        page=page,
        page_size=page_size,
    )


# ── Listing Detail ────────────────────────────────────────────────────────── #
@router.get("/{listing_id}", response_model=ListingDetail)
def listing_detail(
    listing_id: int,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    listing = get_listing_detail(db, listing_id, user.id if user else None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Determine if wishlisted
    is_wishlisted = False
    if user:
        is_wishlisted = db.get(WishlistItem, (user.id, listing_id)) is not None

    detail = ListingDetail.model_validate(listing)
    detail.is_wishlisted = is_wishlisted
    return detail


# ── Availability ──────────────────────────────────────────────────────────── #
@router.get("/{listing_id}/availability", response_model=list[BlockedRange])
def listing_availability(
    listing_id: int,
    from_date: date = Query(alias="from"),
    to_date: date = Query(alias="to"),
    db: Session = Depends(get_db),
):
    return get_blocked_ranges(db, listing_id, from_date, to_date)


# ── Reviews ───────────────────────────────────────────────────────────────── #
@router.get("/{listing_id}/reviews", response_model=ReviewsPage)
def listing_reviews(
    listing_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
):
    return get_reviews(db, listing_id, page, page_size)


@router.post("/{listing_id}/reviews", response_model=ReviewsPage, status_code=201)
def post_review(
    listing_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_required_user),
):
    create_review(db, listing_id, payload, user)
    return get_reviews(db, listing_id)


# ── Host CRUD ─────────────────────────────────────────────────────────────── #
@router.post("", response_model=ListingDetail, status_code=201)
def create_listing(
    payload: ListingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_host_user),
):
    listing = Listing(
        host_id=user.id,
        title=payload.title,
        description=payload.description,
        property_type=payload.property_type,
        category_id=payload.category_id,
        room_type=payload.room_type,
        city=payload.city,
        state=payload.state,
        country=payload.country,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        price_per_night=payload.price_per_night,
        cleaning_fee=payload.cleaning_fee,
        max_guests=payload.max_guests,
        bedrooms=payload.bedrooms,
        beds=payload.beds,
        bathrooms=payload.bathrooms,
    )
    db.add(listing)
    db.flush()  # get listing.id before adding images/amenities

    # Add images
    for i, url in enumerate(payload.image_urls):
        db.add(ListingImage(listing_id=listing.id, url=url, position=i))

    # Add amenities
    for aid in payload.amenity_ids:
        amenity = db.get(Amenity, aid)
        if amenity:
            db.add(ListingAmenity(listing_id=listing.id, amenity_id=aid))

    db.commit()
    db.refresh(listing)
    return get_listing_detail(db, listing.id)


@router.put("/{listing_id}", response_model=ListingDetail)
def update_listing(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_host_user),
):
    listing = db.get(Listing, listing_id)
    if not listing or listing.host_id != user.id:
        raise HTTPException(status_code=404, detail="Listing not found or not yours")

    update_data = payload.model_dump(exclude_none=True, exclude={"amenity_ids", "image_urls"})
    for key, val in update_data.items():
        setattr(listing, key, val)

    # Replace images if provided
    if payload.image_urls is not None:
        for img in listing.images:
            db.delete(img)
        db.flush()
        for i, url in enumerate(payload.image_urls):
            db.add(ListingImage(listing_id=listing.id, url=url, position=i))

    # Replace amenities if provided
    if payload.amenity_ids is not None:
        db.execute(
            __import__("sqlalchemy", fromlist=["delete"]).delete(ListingAmenity)
            .where(ListingAmenity.listing_id == listing_id)
        )
        db.flush()
        for aid in payload.amenity_ids:
            db.add(ListingAmenity(listing_id=listing.id, amenity_id=aid))

    db.commit()
    db.refresh(listing)
    return get_listing_detail(db, listing.id)


@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_host_user),
):
    from app.models.booking import Booking
    from sqlalchemy import and_
    listing = db.get(Listing, listing_id)
    if not listing or listing.host_id != user.id:
        raise HTTPException(status_code=404, detail="Listing not found or not yours")

    # Block deletion if there are upcoming confirmed bookings
    from datetime import date
    upcoming = db.execute(
        select(Booking).where(
            and_(
                Booking.listing_id == listing_id,
                Booking.status == "confirmed",
                Booking.check_in >= date.today(),
            )
        )
    ).first()
    if upcoming:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "LISTING_HAS_BOOKINGS",
                "message": "Cannot delete listing with upcoming confirmed bookings. Cancel them or deactivate the listing instead.",
            },
        )

    db.delete(listing)
    db.commit()
