# Phase 1: Backend Architecture, Workings & File Guide

This document provides a comprehensive, line-by-line understanding of all components built in **Phase 1: Backend Foundation**.

---

## 1. Tech Stack & Architectural Decisions

| Layer | Technology | Decision Rationale |
|---|---|---|
| **Web Framework** | FastAPI (Python 3.10+) | High performance, automatic OpenAPI documentation (`/docs`), async-first request handling, native Pydantic integration. |
| **ORM** | SQLAlchemy 2.0 | Modern typed API (`Mapped[...]`, `mapped_column()`), separating business logic from raw SQL while retaining query optimization. |
| **Validation / DTOs** | Pydantic v2 | High-speed C-based validation (`ConfigDict(from_attributes=True)`), robust serialization from SQLAlchemy ORM models. |
| **Database** | SQLite (`airbnb.db`) | Zero-configuration file database suitable for local development and take-home review; in-memory SQLite used for deterministic tests. |
| **Authentication** | Header-based mock (`X-User-Id`) | Keeps the take-home project simple without external OAuth setup or JWT state, while maintaining realistic user-scoped actions. |

---

## 2. Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── deps.py               # Dependency injection: database sessions and user auth
│   ├── database.py               # Engine, Base declarative class, session factory
│   ├── models/                   # SQLAlchemy 2.0 database entities
│   │   ├── __init__.py           # Explicit model exports to register metadata
│   │   ├── user.py               # User table
│   │   ├── listing.py            # Listing, Category, Amenity, ListingPhoto tables
│   │   ├── booking.py            # Booking table
│   │   ├── review.py             # Review table
│   │   └── wishlist.py           # Wishlist and WishlistItem tables
│   ├── schemas/                  # Pydantic v2 validation and response schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── listing.py
│   │   ├── booking.py
│   │   ├── review.py
│   │   └── wishlist.py
│   ├── services/                 # Pure business logic and domain rules
│   │   ├── __init__.py
│   │   ├── pricing_service.py    # Nights calculation, service fee, cleaning fee formula
│   │   └── booking_service.py    # Date overlap detection and reservation creation
│   ├── routers/                  # HTTP API endpoints
│   │   ├── __init__.py
│   │   ├── listings.py           # Browsing, searching, filters, listing detail
│   │   ├── bookings.py           # Pricing quote, checkout reservation, user bookings
│   │   ├── host.py               # Listing creation, host property management
│   │   ├── wishlist.py           # Saved listings toggle and retrieval
│   │   ├── users.py              # Current user profile and mock switch
│   │   └── misc.py               # Categories and amenities listings
│   ├── seed.py                   # Realistic database population script
│   ├── main.py                   # App factory, CORS, static uploads mount, health check
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py           # In-memory SQLite fixtures + FastAPI TestClient
│       ├── test_bookings.py      # Overlap checks & pricing calculations tests
│       └── test_listings.py      # Search, filter, and detail tests
├── requirements.txt
└── airbnb.db                     # Generated SQLite database
```

---

## 3. Data Models & Entity Relationships

All models extend `Base` from `app/database.py` and use SQLAlchemy 2.0 type mapping.

### `User` (`app/models/user.py`)
- **Fields**: `id`, `email` (unique, indexed), `name`, `avatar_url`, `bio`, `role` (`guest` or `host`), `is_superhost` (boolean), `created_at`.
- **Relationships**:
  - `listings`: One-to-many relationship with `Listing`.
  - `bookings`: One-to-many relationship with `Booking`.
  - `reviews`: One-to-many relationship with `Review`.
  - `wishlists`: One-to-many relationship with `Wishlist`.

### `Listing`, `Category`, `Amenity`, `ListingPhoto` (`app/models/listing.py`)
- **`Listing`**:
  - Core listing attributes: `title`, `description`, `room_type` (`entire_home`, `private_room`, `shared_room`), `property_type`.
  - Geographic fields: `address`, `city` (indexed), `state`, `country`, `latitude`, `longitude`.
  - Pricing & Capacity: `price_per_night` (Float), `cleaning_fee` (Float), `max_guests`, `bedrooms`, `beds`, `bathrooms`.
  - Operational flags: `status` (`active`, `inactive`), `instant_bookable` (Boolean).
  - Relationships:
    - Many-to-one with `User` (`host`).
    - Many-to-one with `Category` (`category`).
    - Many-to-many with `Amenity` via `listing_amenities` join table.
    - One-to-many with `ListingPhoto` (ordered by `order_index`).
    - One-to-many with `Review` and `Booking`.
- **`Category`**: `id`, `name`, `icon` (Lucide icon identifier), `slug`.
- **`Amenity`**: `id`, `name`, `icon`, `category` (`essentials`, `features`, `safety`).
- **`ListingPhoto`**: `id`, `listing_id`, `url`, `caption`, `is_cover`, `order_index`.

### `Booking` (`app/models/booking.py`)
- **Fields**: `listing_id`, `guest_id`, `check_in` (Date), `check_out` (Date), `guests_count`, `nightly_rate`, `nights`, `subtotal`, `cleaning_fee`, `service_fee`, `total_price`, `status` (`confirmed`, `cancelled`, `completed`), `special_requests`.
- **Index**: Compound index on `(listing_id, check_in, check_out)` for high-performance overlap queries.

### `Review` (`app/models/review.py`)
- **Fields**: `listing_id`, `author_id`, `booking_id` (optional), `overall_rating` (1 to 5), granular sub-ratings (`cleanliness`, `accuracy`, `communication`, `location`, `check_in_rating`, `value`), `comment`.

### `Wishlist` & `WishlistItem` (`app/models/wishlist.py`)
- **Fields**: `user_id`, `name` (defaults to "Favorites").
- **Unique Constraint**: `(wishlist_id, listing_id)` on `WishlistItem` to prevent duplicate saves.

---

## 4. Key Business Logic Services

### Pricing Service (`app/services/pricing_service.py`)
Encapsulates all financial calculations so frontend quotation and backend reservation validation never drift:
$$\text{nights} = (\text{check\_out} - \text{check\_in}).\text{days}$$
$$\text{subtotal} = \text{nights} \times \text{nightly\_rate}$$
$$\text{service\_fee} = \text{round}(\text{subtotal} \times 0.14, 2)$$
$$\text{total} = \text{subtotal} + \text{cleaning\_fee} + \text{service\_fee}$$

- Validates that `check_out > check_in`.
- Returns an exact dictionary containing all line items for transparency.

### Booking Service (`app/services/booking_service.py`)
Manages calendar reservations and prevents double-booking:
1. **Overlap Mathematics**:
   An existing booking overlaps with a new requested range if and only if:
   $$\text{existing.check\_in} < \text{new.check\_out} \quad \text{AND} \quad \text{existing.check\_out} > \text{new.check\_in}$$
2. **Cancelled Bookings Ignored**: Bookings with `status == 'cancelled'` are filtered out.
3. **Guest Capacity Validation**: Confirms `guests_count <= listing.max_guests`.
4. **Atomicity**: Performs check-and-insert in a single SQLAlchemy transaction.

---

## 5. Security & Mock Authentication (`app/core/deps.py`)

- **Design**: Instead of requiring user signup and JWT token refresh logic for an assignment demo, the API uses the HTTP header `X-User-Id`.
- **`get_current_user`**:
  - Reads `X-User-Id` integer from request header.
  - Queries `User` table; raises HTTP 401 if missing or HTTP 404 if user doesn't exist.
- **`get_optional_user`**:
  - Attempts to resolve `X-User-Id`, but yields `None` if missing.
  - Enables public endpoints (like browsing listings) to include user-specific indicators (e.g. `is_wishlisted: true/false`).

---

## 6. Testing Strategy & Isolation (`app/tests/`)

- **Fixtures (`conftest.py`)**:
  - Uses `sqlite:///:memory:`.
  - Configured with `poolclass=StaticPool` and `check_same_thread=False`.
  - *Critical Insight*: Without `StaticPool`, each thread in FastAPI's async test runner opens an isolated empty SQLite memory instance. `StaticPool` guarantees all threads and sessions see the exact same in-memory database instance.
  - Automatically resets tables (`Base.metadata.create_all` / `drop_all`) per test function.
- **Test Coverage**:
  - `test_bookings.py` (9 tests): Validates pricing arithmetic, single night calculations, invalid dates, adjacent bookings (allowed), middle bookings (rejected), enclosing bookings (rejected), and cancelled booking reuse.
  - `test_listings.py` (10 tests): Validates empty database responses, pagination, keyword city search, price min/max filters, guest capacity filters, detail view, 404 handling, amenities listing, categories listing, and calendar availability.
- **Total Test Result**: **19/19 passing**.

---

## 7. Database Seeding (`app/seed.py`)

Run via:
```bash
.venv/bin/python -m app.seed
```
Seeds realistic, production-quality data:
- **6 Users**: Mix of Superhosts (e.g., Priya Sharma, Marcus Vance) and active Guests.
- **15 Categories**: Iconic Airbnb categories (Icons, Beachfront, Cabins, Mansions, Trending, Lakefront, Countryside, Tiny Homes, Treehouses, Tropical, Castles, Camping, Ski-in/out, Desert, Historical).
- **25 Amenities**: Wi-Fi, Kitchen, Pool, Free parking, EV charger, Hot tub, Air conditioning, Dedicated workspace, Beach access, etc.
- **30 Unique Listings**: Hand-crafted real-world properties across global travel destinations (Goa, Bali, Kyoto, Amalfi, Santorini, Zermatt, Paris, Lake Como, Joshua Tree, etc.) paired with high-resolution Unsplash architecture photography.
- **18 Bookings**: Realistic upcoming and historical dates for testing calendar blocking.
- **71 Guest Reviews**: Detailed textual reviews with ratings across all 6 criteria to compute authentic star averages.
- **Wishlist Items**: Pre-populated favorites.

---

## 8. Verification & Running the API

### Starting the Backend Server
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Running Tests
```bash
cd backend
source .venv/bin/activate
pytest
```

### Key API Endpoints
- `GET /health` — Service health check.
- `GET /docs` — Interactive OpenAPI Swagger UI.
- `GET /api/listings` — Search listings (filters: `location`, `category`, `min_price`, `max_price`, `guests`, `check_in`, `check_out`, `amenities`, `sort_by`, `page`, `page_size`).
- `GET /api/listings/{id}` — Full listing detail with reviews, photos, amenities, and host profile.
- `GET /api/listings/{id}/availability` — Returns booked date ranges.
- `POST /api/bookings/price` — Computes price breakdown.
- `POST /api/bookings` — Creates reservation with conflict detection.
- `GET /api/bookings/my` — Returns current user's reservations.
- `POST /api/wishlist/toggle` — Add or remove listing from wishlist.
- `GET /api/categories` & `GET /api/amenities` — UI filter taxonomy.
