# Phase 9: Persistence, Architecture Summary & Deployment Checklist

## 1. Project Architecture Summary

This repository is a full-stack, production-grade Airbnb clone built to pixel fidelity using modern industry standards:

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 14+ App Router               │
│  - TypeScript (Strict mode, zero `any`)                 │
│  - Tailwind CSS with bespoke Airbnb design tokens       │
│  - Lucide Vector Icons & Sonner Notifications          │
│  - Responsive Desktop (1760px) & Mobile Shells         │
└───────────────────────────┬────────────────────────────┘
                            │  JSON REST / CORS
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Python FastAPI Backend               │
│  - SQLAlchemy 2.0 ORM + Pydantic v2 validation         │
│  - Atomic reservation overlap & pricing math services  │
│  - Eager-loaded joinedload collections (`.unique()`)   │
│  - SQLite Database (`backend/airbnb.db`)               │
└────────────────────────────────────────────────────────┘
```

---

## 2. Seed Data & Database Persistence

The local SQLite database (`backend/airbnb.db`) contains rich, realistic data for demonstration:
- **6 Users**:
  - `id: 1` — **Priya Sharma** (`priya@example.com`): Superhost with 11 luxury listings across India.
  - `id: 2` — **Marcus Vance** (`marcus@example.com`): Host with alpine chalets and villas.
  - `id: 3` — **Elena Rostova** (`elena@example.com`): Host with beach cottages.
  - `id: 4` — **Arjun Mehta** (`arjun@example.com`): Guest with upcoming & past trips.
  - `id: 5` — **Emily Chen** (`emily@example.com`): Guest with wishlisted items.
  - `id: 6` — **Carlos Silva** (`carlos@example.com`): Guest.
- **30 Listings**: Spread across popular tourist destinations (Goa, Manali, Udaipur, Jaipur, Kerala, Shimla, etc.) with high-resolution Unsplash architectural photography, ratings, and amenity mappings.
- **10 Categories**: Icons, slugs, and display names matching Airbnb's signature category row.
- **20 Amenities**: Categorized into essentials, features, and safety.
- **Reviews & Ratings**: Aggregated star scores and reviews with category sub-ratings.

To reset or re-seed the database at any time:
```bash
cd backend
.venv/bin/python -m app.seed
```

---

## 3. End-to-End Test Suite

Run the automated backend test suite:
```bash
cd backend
.venv/bin/python -m pytest app/tests -v
```
**Results**: 19 passing tests verifying:
1. Exact pricing math (nightly rate, cleaning fee, 14% service fee calculation).
2. Interval overlap detection (adjacent dates allowed, enclosed dates blocked, cancelled bookings unblocked).
3. 409 Conflict handling on double bookings.
4. Search filter parameter queries (location, price range, max guests, category).
5. Availability endpoints and listing details.

---

## 4. Frontend Production Build & Code Quality

Verify the Next.js production build:
```bash
cd frontend
npm run lint    # 0 errors, 0 warnings
npm run build   # Successfully compiled all static & dynamic routes
```

---

## 5. Local Running Instructions

### Backend:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### Frontend:
```bash
cd frontend
npm run dev -- -p 3000
```
- Web Application: `http://localhost:3000`
