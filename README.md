# Airbnb Full-Stack Clone (SDE Take-Home Project)

A pixel-faithful, production-grade Airbnb clone built as an SDE take-home project, featuring modern web architecture, responsive UI, search and filtering, interactive date-range reservations, price breakdowns, and host workflows.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons, Date-fns
- **Backend**: Python FastAPI, SQLAlchemy 2.0, Pydantic v2
- **Database**: SQLite (`airbnb.db`), in-memory SQLite (`StaticPool`) for unit tests
- **Testing**: Pytest (19 tests covering pricing arithmetic, overlap logic, and search filters)

---

## 📁 Repository Structure

```
airbnb/
├── backend/                  # FastAPI + SQLAlchemy backend
│   ├── app/                  # Application source code
│   │   ├── core/             # Configuration & dependency injection
│   │   ├── models/           # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── services/         # Domain logic (pricing & booking overlap)
│   │   ├── routers/          # API endpoint routers
│   │   ├── tests/            # Pytest test suite (19 passing tests)
│   │   ├── database.py       # DB engine & sessionmaker
│   │   ├── main.py           # FastAPI entrypoint
│   │   └── seed.py           # Seed script (30 listings, 6 users, reviews)
│   ├── requirements.txt      # Python dependencies
│   └── airbnb.db             # SQLite database file
├── frontend/                 # Next.js 14 App Router frontend (Phase 2+)
├── docs/                     # Detailed architectural guides per phase
│   └── PHASE_1_BACKEND.md    # Phase 1 deep dive, design decisions & line explanation
└── README.md                 # Project overview & instructions
```

---

## 🚀 Phase Implementation Tracker

| Phase | Description | Status | Reference Doc |
|---|---|---|---|
| **Phase 1** | **Backend Foundation**: Models, Schemas, Seed Script, Business Services, Routers, Pytest Suite | ✅ **Completed** | [`docs/PHASE_1_BACKEND.md`](docs/PHASE_1_BACKEND.md) |
| **Phase 2** | **Frontend Foundation**: Next.js 14+ App Router, Tailwind setup, Component library, API client | ✅ **Completed** | [`docs/PHASE_2_FRONTEND.md`](docs/PHASE_2_FRONTEND.md) |
| **Phase 3** | **Global Shell**: Header, collapsed/expanded SearchPill, User menu, Footer, MobileNav | ✅ **Completed** | [`docs/PHASE_2_FRONTEND.md`](docs/PHASE_2_FRONTEND.md) |
| **Phase 4** | **Explore & Filters**: Category row, FiltersModal, live count, useListings infinite scroll | ✅ **Completed** | [`frontend/src/app/page.tsx`](frontend/src/app/page.tsx) |
| **Phase 5** | **Listing Detail Page**: Photo mosaic gallery, Sticky booking card, Host bio, Reviews breakdown | ✅ **Completed** | [`docs/PHASE_5_DETAIL.md`](docs/PHASE_5_DETAIL.md) |
| **Phase 6** | **Booking & Trips**: Checkout modal, Instant availability validation, User trips page | ✅ **Completed** | [`docs/PHASE_6_BOOKINGS.md`](docs/PHASE_6_BOOKINGS.md) |
| **Phase 7** | **Host Mode**: Create new listing multi-step wizard, Host dashboard & metrics | ✅ **Completed** | [`docs/PHASE_7_HOST.md`](docs/PHASE_7_HOST.md) |
| **Phase 8** | **Polish & Error Boundaries**: 404 page, error.tsx, coming-soon pages, visual verification | ✅ **Completed** | [`docs/PHASE_8_POLISH.md`](docs/PHASE_8_POLISH.md) |
| **Phase 9** | **Persistence & Architecture Summary**: End-to-end verification and run guide | ✅ **Completed** | [`docs/PHASE_9_PERSISTENCE.md`](docs/PHASE_9_PERSISTENCE.md) |

---

## 📋 Requirement & Feature Evaluation Matrix

| Requirement | Status | Implementation & Verification Details |
|---|:---:|---|
| **Live website works** | ✅ | Deployed on Vercel: [https://airbnb-nine-jade.vercel.app](https://airbnb-nine-jade.vercel.app) |
| **Backend works** | ✅ | Production FastAPI endpoints handling listings, search, filters, quotes, reservations, host operations, and reviews. |
| **Listings load** | ✅ | 30 rich seed listings across global destinations with high-res photos, amenities, pricing, and ratings. |
| **Search** | ✅ | Destination search (city/state/country), date range selector, and guest capacity filtering in `frontend/src/components/search/SearchPill.tsx`. |
| **Filters** | ✅ | 12+ categories, price range sliders, room type selections, and amenities checkboxes in `frontend/src/components/search/FiltersModal.tsx`. |
| **Pagination / infinite scroll** | ✅ | Responsive infinite scroll with IntersectionObserver and smooth fallback loading in `frontend/src/app/page.tsx`. |
| **Listing detail** | ✅ | Full detail view (`/listings/[id]`) with 5-photo mosaic gallery, host profile, amenity badges, and interactive map preview. |
| **Calendar** | ✅ | 2-month interactive availability calendar with real-time blocked date calculation in `frontend/src/components/listings/AvailabilityCalendar.tsx`. |
| **Booking** | ✅ | End-to-end checkout flow (`/book/[listingId]`), live itemized quote calculation, payment method selection, and unique confirmation code generation. |
| **Booking validation** | ✅ | Client-side validation + backend atomic overlap protection preventing past dates, excessive guest counts, or duplicate reservations. |
| **My Trips** | ✅ | Reservation management page (`/trips`) with past/upcoming tabs and itemized trip detail modals (`/trips/[bookingId]`). |
| **Booked dates blocked** | ✅ | Confirmed reservations immediately lock date intervals on the listing availability calendar, disabling selection. |
| **Host create** | ✅ | Multi-step listing creation wizard (`/host/listings/new`) with photo upload/URL, room types, pricing, and amenities. |
| **Host edit** | ✅ | Edit existing listing details (`/host/listings/[id]/edit`) pre-populating current attributes with instant updates. |
| **Host delete** | ✅ | Listing deletion with confirmation modal and safety checks against active upcoming guest bookings. |
| **Host dashboard** | ✅ | Host control centre (`/host/dashboard`) displaying revenue stats, upcoming reservations, and listing inventory management. |
| **Wishlist** | ✅ | 1-click heart toggle on cards and detail page, saved under dedicated Wishlists page (`/wishlists`). |
| **Reviews section** | ✅ | 6 category sub-ratings (Cleanliness, Accuracy, Communication, Location, Check-in, Value) and review submission modal. |
| **Airbnb-like UI** | ✅ | Pixel-faithful Airbnb design system using official typography, colors (#FF385C), hover micro-animations, and mobile bottom navigation. |
| **README** | ✅ | Comprehensive documentation with architecture, quick start, schema diagrams, design assumptions, and evaluation checklist. |
| **Public GitHub** | ✅ | Repository: [https://github.com/aarushi2810/airbnb](https://github.com/aarushi2810/airbnb) |
| **Deployment link** | ✅ | Primary Live URL: [https://airbnb-nine-jade.vercel.app](https://airbnb-nine-jade.vercel.app) |

> **⚠️ Deployment URL Note**:  
> - **Public Production Link**: [https://airbnb-nine-jade.vercel.app](https://airbnb-nine-jade.vercel.app) *(Publicly accessible without authentication)*  
> - **Preview Branch URL**: `https://airbnb-6qxklqxwi-aarushis-projects-664c71ff.vercel.app/` *(Vercel deployment protection / SSO login is active on branch previews by default; evaluators should use the canonical production link above)*.

---

## ⚡ Quick Start: Running the Full Stack Application

### 1. Backend Setup & Startup
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed   # Seeds 30 listings, 6 users, amenities, categories, reviews
pytest               # 19 passing unit tests
uvicorn app.main:app --reload --port 8000
```
- API Endpoint: [http://localhost:8000](http://localhost:8000)
- OpenAPI Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run lint         # 0 errors, 0 warnings
npm run build        # Production build verification
npm run dev -- -p 3000
```
- Web Application: [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema & Entity Relationships

The SQLite database (`backend/airbnb.db`) is structured with relational integrity using SQLAlchemy 2.0:

- **`User`**: `id`, `email`, `name`, `avatar_url`, `bio`, `role` (`"guest"` / `"host"`), `is_superhost`, `response_rate`, `created_at`
- **`Listing`**: `id`, `host_id` (FK $\rightarrow$ `users.id`), `title`, `description`, `property_type`, `room_type`, `category_id` (FK $\rightarrow$ `categories.id`), `city`, `state`, `country`, `address`, `latitude`, `longitude`, `price_per_night`, `cleaning_fee`, `max_guests`, `bedrooms`, `beds`, `bathrooms`, `status` (`"active"` / `"inactive"`), `created_at`
- **`ListingImage`**: `id`, `listing_id` (FK $\rightarrow$ `listings.id`), `url`, `position`, `caption`
- **`Amenity`**: `id`, `name`, `icon`, `category` (`"essentials"`, `"features"`, `"safety"`)
- **`ListingAmenity`**: Join table linking `listing_id` and `amenity_id`
- **`Category`**: `id`, `name`, `icon`, `slug`
- **`Booking`**: `id`, `code` (e.g. `BK-893140`), `listing_id` (FK $\rightarrow$ `listings.id`), `guest_id` (FK $\rightarrow$ `users.id`), `check_in`, `check_out`, `guests_adults`, `guests_children`, `guests_infants`, `nightly_rate`, `cleaning_fee`, `service_fee`, `total_price`, `status` (`"confirmed"`, `"cancelled"`, `"completed"`), `created_at`
- **`Review`**: `id`, `listing_id` (FK $\rightarrow$ `listings.id`), `author_id` (FK $\rightarrow$ `users.id`), `booking_id` (FK $\rightarrow$ `bookings.id`), `rating` (1–5), `cleanliness`, `accuracy`, `communication`, `location`, `checkin`, `value`, `comment`, `created_at`
- **`Wishlist` & `WishlistItem`**: Saved listings associated with a user.

---

## 💡 Assumptions & Design Decisions

1. **Authentication**: Real user authentication is mocked with a 1-click **User Switcher Modal** allowing seamless switching between hosts (e.g., *Priya Sharma*, Superhost) and guests (*Arjun Mehta*, *Emily Chen*) to demonstrate both host and traveler perspectives.
2. **Payments**: Real payment processing is out of scope per assignment prompt. The checkout form validates credit card formatting, expiration, CVV, and ZIP client-side, computing an exact price quote via the backend.
3. **Availability & Overlaps**: Adjacent bookings are permitted (check-out on day $X$ allows check-in on day $X$). Confirmed bookings block dates immediately on both the calendar and checkout; cancellations release dates atomically.
4. **Geolocation**: Uses latitude/longitude coordinates with visual map previews.
5. **Placeholder Features**: Features like Experiences, Language/Currency settings, and Messaging render dedicated "Coming Soon" states.


