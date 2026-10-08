# Phase 2: Frontend Architecture, Workings & File Guide

This document provides a comprehensive, line-by-line understanding of all components built in **Phase 2: Frontend Foundation & Setup**.

---

## 1. Tech Stack & Architectural Decisions

| Layer | Technology | Decision Rationale |
|---|---|---|
| **Framework** | Next.js 14+ / App Router | Modern React Server & Client Components, file-system routing, built-in font optimization, clean metadata API. |
| **Language** | TypeScript (Strict Mode) | Zero `any` policy. Every API request, response, and component prop is strictly typed to match the FastAPI backend models. |
| **Styling** | Tailwind CSS + CSS Variables | Pixel-faithful Airbnb design tokens: brand `#FF385C`, dark `#E31C5F`, text `#222222`, muted `#717171`, border `#DDDDDD`, surface `#F7F7F7`. |
| **Typography** | `next/font/google` (Inter) | Zero-layout-shift Google Font loading matching Airbnb's modern sans-serif typography. |
| **Icons & UI** | `lucide-react`, `sonner`, `clsx` | Clean vector iconography, dark Airbnb-style toast notifications, and safe dynamic class merging. |
| **Mock Auth** | `AuthProvider` + `localStorage` | Seamless mock identity switching without OAuth friction; automatically attaches `X-User-Id` to all API requests. |

---

## 2. Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout (Inter font, AuthProvider, Toaster, Header, Footer)
│   │   ├── page.tsx                       # Home page (smoke test verifying live API connection & listings)
│   │   ├── globals.css                    # Airbnb design tokens & responsive container utilities
│   │   ├── listings/
│   │   │   └── [id]/
│   │   │       └── page.tsx               # Dynamic listing detail route placeholder
│   │   ├── book/
│   │   │   └── [listingId]/
│   │   │       └── page.tsx               # Dynamic booking checkout route placeholder
│   │   ├── trips/
│   │   │   └── page.tsx                   # User bookings & reservations route placeholder
│   │   ├── wishlists/
│   │   │   └── page.tsx                   # User saved favorites route placeholder
│   │   ├── host/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx               # Host analytics & listing management placeholder
│   │   │   └── listings/
│   │   │       ├── new/
│   │   │       │   └── page.tsx           # Multi-step listing creation wizard placeholder
│   │   │       └── [id]/
│   │   │           └── edit/
│   │   │               └── page.tsx       # Listing editing placeholder
│   │   └── coming-soon/
│   │       └── page.tsx                   # Informational placeholder for tertiary links
│   ├── components/
│   │   ├── ui/                            # Reusable base components (buttons, modals, inputs)
│   │   ├── layout/                        # Header, Footer, Container layout components
│   │   ├── listings/                      # Listing cards, photo galleries, amenity badges
│   │   ├── search/                        # Search bar, destination & date range pickers
│   │   ├── booking/                       # Checkout summary, pricing cards
│   │   └── host/                          # Host dashboard widgets & tables
│   ├── context/
│   │   └── AuthProvider.tsx               # Context provider, X-User-Id dispatcher, user switcher modal
│   ├── hooks/
│   │   ├── useAuth.ts                     # Easy consumer hook for auth state
│   │   ├── useListings.ts                 # Listings query hook with filter and pagination support
│   │   └── useWishlist.ts                 # Wishlist mutations hook with optimistic updates
│   ├── lib/
│   │   ├── api.ts                         # Strongly typed API client + ApiError + endpoint helpers
│   │   ├── utils.ts                       # Helper utilities (cn, formatPrice, formatDate)
│   │   └── constants.ts                   # Token constants, storage keys, and API URLs
│   └── types/
│       └── index.ts                       # Complete TypeScript models matching backend schemas (no `any`)
├── .env.local.example                     # Environment template (NEXT_PUBLIC_API_URL)
├── .env.local                             # Local environment variables
├── tailwind.config.ts                     # Extended Tailwind configuration
├── tsconfig.json                          # Strict TypeScript configuration
└── package.json
```

---

## 3. Key Files & Implementation Details

### 1. TypeScript Contracts (`src/types/index.ts`)
Matches the FastAPI Pydantic v2 schemas exactly:
- `User`: `id`, `name`, `email`, `avatar_url`, `bio`, `role`, `is_superhost`, `created_at`.
- `ListingSummary`: `id`, `title`, `room_type`, `city`, `country`, `price_per_night`, `max_guests`, `category`, `cover_image`, `rating`, `review_count`, `is_wishlisted`.
- `ListingDetail`: Inherits `ListingSummary` + `description`, `address`, `cleaning_fee`, `bedrooms`, `beds`, `bathrooms`, `host`, `photos`, `amenities`, `reviews`.
- `PriceBreakdown`: `nights`, `nightly_rate`, `subtotal`, `cleaning_fee`, `service_fee`, `total`.
- `Booking`: `id`, `listing_id`, `guest_id`, `check_in`, `check_out`, `guests_count`, `pricing breakdown`, `status`.
- `Wishlist` & `WishlistItem`: Saved user favorites.

### 2. Typed API Client (`src/lib/api.ts`)
- **`ApiError` class**: Captures HTTP status, backend `detail` messages, and optional error codes.
- **Dynamic Header Injection**: Automatically attaches the active user ID as `X-User-Id` to all outgoing requests.
- **Endpoint Helpers**:
  - `api.listings.list(params)`: Maps filter parameters (`location`, `category`, `min_price`, `max_price`, `guests`, `check_in`, `check_out`, `amenities`, etc.) into URL search params.
  - `api.listings.getById(id)`: Fetches full listing detail with reviews and amenities.
  - `api.bookings.quotePrice(data)`: Retrieves authoritative price calculation from backend.
  - `api.bookings.create(data)`: Books a reservation with conflict prevention.
  - `api.wishlist.toggle(listingId)`: Adds/removes listings from user favorites.
  - `api.users.list()` & `api.users.me()`: User directory and profile retrieval.

### 3. AuthProvider & Mock Identity (`src/context/AuthProvider.tsx`)
- Fetches all available seed users (`/api/users`) on startup.
- Persists selected user ID and host/traveling mode in `localStorage`.
- Includes an interactive **"Switch Mock User"** modal displaying avatars, Superhost badges, and roles.
- Exposes:
  - `currentUser`, `role` (`"guest"` | `"host"`), `isHostMode` (boolean)
  - `switchUser(userId)`: Instantly switches identity and updates `X-User-Id` header.
  - `toggleHostMode()`: Toggles between Traveling and Host mode views.
  - `openLoginModal()` / `closeLoginModal()`

### 4. Design System Tokens & Responsive Container (`src/app/globals.css` & `tailwind.config.ts`)
- **Brand Colors**:
  - Brand Red: `#FF385C`
  - Brand Dark: `#E31C5F`
  - Text Primary: `#222222`
  - Text Muted: `#717171`
  - Border: `#DDDDDD`
  - Surface: `#F7F7F7`
- **Shadows**:
  - Search Bar: `0 2px 4px rgba(0, 0, 0, 0.18)`
  - Dropdown / Modals: `0 6px 16px rgba(0, 0, 0, 0.12)`
  - Cards: `0 6px 20px rgba(0, 0, 0, 0.08)`
- **Container**:
  - Class: `.airbnb-container`
  - Max Width: `1760px`
  - Padding: `px-6` (mobile) to `px-20` (desktop)

---

## 4. Verification & Testing

1. **Linting**:
   ```bash
   npm run lint
   # 0 errors, 0 warnings
   ```
2. **Production Build**:
   ```bash
   npm run build
   # Compiled successfully (9 routes generated)
   ```
3. **Live Browser Smoke Test**:
   - Connected to FastAPI backend on `http://localhost:8000`.
   - Verified that `http://localhost:3000` rendered the 30 seed listings with live prices, locations, and ratings.
   - Tested the "Switch Mock User" modal and confirmed active state reflects user profile.
