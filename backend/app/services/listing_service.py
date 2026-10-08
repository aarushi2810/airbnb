"""services/listing_service.py — Query helpers for listings.

All filter logic lives here rather than in the router to keep routers thin.
"""

from datetime import date
from typing import Optional

from sqlalchemy import and_, func, or_, select, not_
from sqlalchemy.orm import Session, selectinload

from app.models.booking import Booking
from app.models.listing import Amenity, Listing, ListingAmenity
from app.models.wishlist import WishlistItem
from app.schemas.listing import ListingCard, ListingDetail, ListingsPage, ListingImageOut


def _wishlist_ids(db: Session, user_id: Optional[int]) -> set[int]:
    """Return the set of listing IDs the user has wishlisted."""
    if not user_id:
        return set()
    rows = db.execute(
        select(WishlistItem.listing_id).where(WishlistItem.user_id == user_id)
    ).scalars().all()
    return set(rows)


def _listing_to_card(listing: Listing, wishlisted: set[int]) -> ListingCard:
    images = [ListingImageOut.model_validate(img) for img in listing.images]
    cover = images[0].url if images else None
    return ListingCard(
        id=listing.id,
        title=listing.title,
        city=listing.city,
        state=listing.state,
        country=listing.country,
        price_per_night=float(listing.price_per_night),
        cleaning_fee=float(listing.cleaning_fee),
        rating_avg=listing.rating_avg,
        review_count=listing.review_count,
        is_guest_favorite=listing.is_guest_favorite,
        room_type=listing.room_type,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        category_id=listing.category_id,
        cover_image=cover,
        images=images,
        is_wishlisted=listing.id in wishlisted,
    )


def get_listings(
    db: Session,
    user_id: Optional[int] = None,
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
    amenity_ids: Optional[list[int]] = None,
    sort: str = "recommended",
    page: int = 1,
    page_size: int = 20,
) -> ListingsPage:
    q = (
        select(Listing)
        .options(
            selectinload(Listing.images),
        )
        .where(Listing.status == "active")
    )

    # Location filter (case-insensitive substring match on city/state/country)
    if location:
        loc = f"%{location.lower()}%"
        q = q.where(
            or_(
                func.lower(Listing.city).like(loc),
                func.lower(Listing.state).like(loc),
                func.lower(Listing.country).like(loc),
            )
        )

    # Date availability filter — exclude listings with overlapping confirmed bookings
    if check_in and check_out:
        overlapping = (
            select(Booking.listing_id)
            .where(
                and_(
                    Booking.status == "confirmed",
                    Booking.check_in < check_out,
                    Booking.check_out > check_in,
                )
            )
            .scalar_subquery()
        )
        q = q.where(not_(Listing.id.in_(overlapping)))

    # Guest capacity
    if guests:
        q = q.where(Listing.max_guests >= guests)

    # Price range
    if min_price is not None:
        q = q.where(Listing.price_per_night >= min_price)
    if max_price is not None:
        q = q.where(Listing.price_per_night <= max_price)

    # Room type
    if room_type:
        q = q.where(Listing.room_type == room_type)

    # Property type
    if property_type:
        q = q.where(func.lower(Listing.property_type) == property_type.lower())

    # Category
    if category_id:
        q = q.where(Listing.category_id == category_id)

    # Bedroom / bed / bathroom minimums
    if bedrooms:
        q = q.where(Listing.bedrooms >= bedrooms)
    if beds:
        q = q.where(Listing.beds >= beds)
    if bathrooms:
        q = q.where(Listing.bathrooms >= bathrooms)

    # Amenities — listing must have ALL requested amenities
    if amenity_ids:
        for aid in amenity_ids:
            q = q.where(
                Listing.id.in_(
                    select(ListingAmenity.listing_id).where(ListingAmenity.amenity_id == aid)
                )
            )

    # Sorting
    if sort == "price_asc":
        q = q.order_by(Listing.price_per_night.asc())
    elif sort == "price_desc":
        q = q.order_by(Listing.price_per_night.desc())
    elif sort == "rating":
        q = q.order_by(Listing.rating_avg.desc())
    else:
        # "recommended": guest favorites first, then by rating
        q = q.order_by(Listing.is_guest_favorite.desc(), Listing.rating_avg.desc())

    # Count total before pagination
    count_q = select(func.count()).select_from(q.subquery())
    total = db.execute(count_q).scalar_one()

    # Paginate
    offset = (page - 1) * page_size
    rows = db.execute(q.offset(offset).limit(page_size)).scalars().all()

    wishlisted = _wishlist_ids(db, user_id)
    items = [_listing_to_card(r, wishlisted) for r in rows]

    return ListingsPage(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_more=(offset + len(items)) < total,
    )


def get_listing_detail(
    db: Session,
    listing_id: int,
    user_id: Optional[int] = None,
) -> Listing:
    """Return the full Listing ORM object with relationships loaded."""
    from sqlalchemy.orm import joinedload
    listing = db.execute(
        select(Listing)
        .options(
            joinedload(Listing.host),
            selectinload(Listing.images),
            selectinload(Listing.amenities),
        )
        .where(Listing.id == listing_id)
    ).scalar_one_or_none()
    return listing


def get_blocked_ranges(db: Session, listing_id: int, from_date: date, to_date: date) -> list:
    """Return confirmed booking date ranges for a listing within a window."""
    rows = db.execute(
        select(Booking.check_in, Booking.check_out)
        .where(
            and_(
                Booking.listing_id == listing_id,
                Booking.status == "confirmed",
                Booking.check_in < to_date,
                Booking.check_out > from_date,
            )
        )
    ).all()
    return [{"check_in": str(r.check_in), "check_out": str(r.check_out)} for r in rows]
