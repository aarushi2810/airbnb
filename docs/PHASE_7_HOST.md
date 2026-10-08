# Phase 7: Host Dashboard & Listing CRUD

## Overview
Phase 7 introduces the hosting experience to the Airbnb application:
1. **Host Dashboard (`/host/dashboard`)**:
   - Aggregate performance metrics: Active Listings, Upcoming Reservations, and Estimated Host Earnings.
   - Dual-tab navigation synchronized with the URL (`?tab=listings` vs `?tab=reservations`).
   - "My Listings" management table: live thumbnail, title, property specs, status badge, nightly price, and inline actions (view public page, edit, activate/deactivate toggle, and delete).
   - "Reservations" management table: guest avatar/name, listing summary, check-in/out dates, host payout, booking code badge, and host cancellation action with instant date unblocking.
   - Active reservations protection: attempt to delete a listing with upcoming confirmed bookings returns HTTP 409 conflict (`LISTING_HAS_BOOKINGS`), prompting the host to deactivate or view reservations instead.
   - Guest-mode graceful fallback: informs guest accounts of their mode with a clear call-to-action to switch to a host account or start hosting.
2. **Multi-Step Listing Wizard (`ListingForm`)**:
   - 7 progressive steps with animated progress bar and step indicators:
     - **Step 1: Basics**: Title (max 80 chars with counter), description (min 50 chars with counter), property type selector cards, room type selector cards, and category pills.
     - **Step 2: Location**: City, state, country, street address, and latitude/longitude coordinates with visual pin preview.
     - **Step 3: Capacity**: Interactive steppers for guests (1–16), bedrooms (0–20), beds (1–20), and bathrooms (0.5–10).
     - **Step 4: Amenities**: Vector icon cards categorized into essentials, features, and safety.
     - **Step 5: Photos**: Image URL input with validation, 3 curated photo gallery presets (Modern Loft, Coastal Villa, Alpine Cabin), reordering (move left/right), removal, and 5-photo minimum validation.
     - **Step 6: Pricing**: Base nightly rate, cleaning fee, and live 3-night price quote preview.
     - **Step 7: Review & Publish**: Comprehensive property preview card, host ground rules reminder, and submission.
3. **Creation & Edition Routes**:
   - `/host/listings/new`: Initializes wizard in creation mode; creates listing via `POST /api/listings`.
   - `/host/listings/[id]/edit`: Validates host ownership; pre-fills wizard in edit mode; updates listing via `PUT /api/listings/{id}`.
4. **Host Listing Detail Integration**:
   - In `/listings/[id]`, when the logged-in user is the owner of the listing, the Reserve widget is replaced by a "This is your listing" alert and an "Edit listing details" direct link.

---

## Architectural Details & Components

### 1. `ListingForm.tsx` (`frontend/src/components/host/ListingForm.tsx`)
- **State Management**: Managed via a single `useReducer` action dispatcher (`SET_FIELD`, `TOGGLE_AMENITY`, `ADD_IMAGE`, `REMOVE_IMAGE`, `MOVE_IMAGE`, `SET_PRESET_IMAGES`).
- **Validation**: Strict validation per step prevents proceeding if required fields are missing.
- **Mode Polymorphism**: Handles both create mode (`mode="create"`) and edit mode (`mode="edit"`), re-mapping existing amenities, images, and status.

### 2. `HostDashboardPage` (`frontend/src/app/host/dashboard/page.tsx`)
- **Suspense Boundary**: Wraps client search params usage in `<Suspense>` for zero hydration lag.
- **Route Guard**: Reusable `useRequireHost` hook detects authentication and host status, triggering login or guest guidance when needed.
- **Deletion Safety**: Traps HTTP 409 responses to present non-destructive alternatives ("Deactivate instead" or "View reservations").

### 3. Backend Endpoints (`backend/app/routers/host.py` & `listings.py`)
- `GET /api/host/dashboard`: Aggregates active listings, total listings, upcoming confirmed reservations, and estimated earnings.
- `GET /api/host/listings`: Returns full listing details for the authenticated host.
- `GET /api/host/bookings`: Returns all bookings for listings owned by the host, filterable by status (`?status=`).
- `POST /api/listings`: Creates a new listing with images and amenities.
- `PUT /api/listings/{id}`: Modifies listing metadata, photos, amenities, or status.
- `DELETE /api/listings/{id}`: Deletes a listing, with an atomic check for upcoming confirmed bookings preventing orphan records.

---

## Verification & Status

- `npm run lint`: **0 errors, 0 warnings**
- `npm run build`: **0 errors, all 11 routes successfully compiled**
- **Browser Subagent Test**: Visually verified Host Dashboard top stats, Reservations tab, Step 1 of Listing Wizard, and Host Listing Detail shortcut banner.
