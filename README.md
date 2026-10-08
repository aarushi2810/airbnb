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

## 📖 Deep Dive Documentation per Phase

For comprehensive architectural design decisions, schemas, and implementation details:
- [Phase 1: Backend Architecture & Data Models](docs/PHASE_1_BACKEND.md)
- [Phase 2 & 3: Frontend Foundation & Global Shell](docs/PHASE_2_FRONTEND.md)
- [Phase 5: Listing Detail Page & Availability Calendar](docs/PHASE_5_DETAIL.md)
- [Phase 6: Booking Flow, Trips & Wishlists](docs/PHASE_6_BOOKINGS.md)
- [Phase 7: Host Dashboard & Multi-Step Wizard](docs/PHASE_7_HOST.md)
- [Phase 8: Polish, Coming-Soon & Error Handling](docs/PHASE_8_POLISH.md)
- [Phase 9: Persistence & Deployment Checklist](docs/PHASE_9_PERSISTENCE.md)

