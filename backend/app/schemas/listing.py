"""schemas/listing.py — Pydantic v2 schemas for Listing, Amenity, Category."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ── Amenity ──────────────────────────────────────────────────────────────── #
class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    icon: Optional[str] = None
    category: Optional[str] = None


# ── Category ─────────────────────────────────────────────────────────────── #
class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    icon: Optional[str] = None
    slug: str


# ── Listing Image ─────────────────────────────────────────────────────────── #
class ListingImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    position: int


# ── Host summary embedded in listing ─────────────────────────────────────── #
class HostSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    avatar_url: Optional[str] = None
    is_superhost: bool
    response_rate: Optional[int] = None
    joined_at: datetime


# ── Listing (list / card view) ────────────────────────────────────────────── #
class ListingCard(BaseModel):
    """Lightweight schema for the listing grid cards."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    city: str
    state: Optional[str] = None
    country: str
    price_per_night: float
    cleaning_fee: float
    rating_avg: float
    review_count: int
    is_guest_favorite: bool
    room_type: str
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    category_id: Optional[int] = None
    # First image URL (cover photo) — resolved by the service layer
    cover_image: Optional[str] = None
    # All images for the card carousel
    images: list[ListingImageOut] = []
    # Whether the current user has wishlisted this listing (injected per request)
    is_wishlisted: bool = False


# ── Listing Detail ────────────────────────────────────────────────────────── #
class ListingDetail(BaseModel):
    """Full listing data for the detail page."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    property_type: Optional[str] = None
    room_type: str
    city: str
    state: Optional[str] = None
    country: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: float
    cleaning_fee: float
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    rating_avg: float
    review_count: int
    is_guest_favorite: bool
    status: str
    created_at: datetime
    updated_at: datetime
    category_id: Optional[int] = None

    host: HostSummary
    images: list[ListingImageOut] = []
    amenities: list[AmenityOut] = []
    is_wishlisted: bool = False


# ── Paginated response ────────────────────────────────────────────────────── #
class ListingsPage(BaseModel):
    items: list[ListingCard]
    total: int
    page: int
    page_size: int
    has_more: bool


# ── Create / Update ───────────────────────────────────────────────────────── #
class ListingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    property_type: Optional[str] = None
    category_id: Optional[int] = None
    room_type: str = "entire_home"
    city: str
    state: Optional[str] = None
    country: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: float
    cleaning_fee: float = 0.0
    max_guests: int = 1
    bedrooms: int = 1
    beds: int = 1
    bathrooms: float = 1.0
    amenity_ids: list[int] = []
    image_urls: list[str] = []  # ordered list of image URLs


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    category_id: Optional[int] = None
    room_type: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: Optional[float] = None
    cleaning_fee: Optional[float] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[float] = None
    status: Optional[str] = None
    amenity_ids: Optional[list[int]] = None
    image_urls: Optional[list[str]] = None


# ── Availability ──────────────────────────────────────────────────────────── #
class BlockedRange(BaseModel):
    check_in: str   # ISO date string "YYYY-MM-DD"
    check_out: str
