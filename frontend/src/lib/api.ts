import { API_BASE_URL, STORAGE_KEYS } from "./constants";
import type {
  User,
  Category,
  Amenity,
  ListingDetail,
  ListingListResponse,
  ListingFilterParams,
  PriceBreakdown,
  Wishlist,
  BookedDateRange,
  Booking,
  ListingCreate,
  ListingUpdate,
  HostDashboardMetrics,
} from "../types";

export class ApiError extends Error {
  status: number;
  detail: string;
  code?: string;

  constructor(status: number, detail: string, code?: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.code = code;
  }
}

// Module-level getter/setter so AuthProvider can sync the active user ID
let currentUserIdGetter: (() => number | null) | null = null;

export function registerUserIdGetter(getter: () => number | null) {
  currentUserIdGetter = getter;
}

function getActiveUserId(): number | null {
  if (currentUserIdGetter) {
    const id = currentUserIdGetter();
    if (id !== null) return id;
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (stored) {
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? null : parsed;
    }
  }
  return null;
}

/**
 * Core typed fetch wrapper. Automatically attaches X-User-Id header and parses ApiError.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const userId = getActiveUserId();
  if (userId !== null && !headers.has("X-User-Id")) {
    headers.set("X-User-Id", userId.toString());
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    let errorCode: string | undefined;

    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === "string") {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((e: { msg?: string }) => e.msg || "").join(", ");
      }
      if (errorJson.code) {
        errorCode = errorJson.code;
      }
    } catch {
      // Non-JSON error body fallback
    }

    throw new ApiError(response.status, errorDetail, errorCode);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Strongly typed API helpers mapped to backend endpoints.
 */
export const api = {
  listings: {
    list: (params?: ListingFilterParams): Promise<ListingListResponse> => {
      const searchParams = new URLSearchParams();
      if (params) {
        if (params.category) searchParams.set("category", params.category);
        if (params.location) searchParams.set("location", params.location);
        if (params.min_price !== undefined) searchParams.set("min_price", params.min_price.toString());
        if (params.max_price !== undefined) searchParams.set("max_price", params.max_price.toString());
        if (params.guests !== undefined) searchParams.set("guests", params.guests.toString());
        if (params.check_in) searchParams.set("check_in", params.check_in);
        if (params.check_out) searchParams.set("check_out", params.check_out);
        if (params.sort_by) searchParams.set("sort_by", params.sort_by);
        if (params.page !== undefined) searchParams.set("page", params.page.toString());
        if (params.page_size !== undefined) searchParams.set("page_size", params.page_size.toString());
        if (params.room_types) {
          params.room_types.forEach((rt) => searchParams.append("room_types", rt));
        }
        if (params.amenities) {
          params.amenities.forEach((a) => searchParams.append("amenities", a.toString()));
        }
      }
      const qs = searchParams.toString();
      return apiFetch<ListingListResponse>(`/api/listings${qs ? `?${qs}` : ""}`);
    },

    getById: (id: number): Promise<ListingDetail> => {
      return apiFetch<ListingDetail>(`/api/listings/${id}`);
    },

    getAvailability: (id: number, fromDate?: string, toDate?: string): Promise<BookedDateRange[]> => {
      const searchParams = new URLSearchParams();
      const today = new Date();
      const future = new Date();
      future.setFullYear(today.getFullYear() + 1);
      const from = fromDate || today.toISOString().split("T")[0];
      const to = toDate || future.toISOString().split("T")[0];
      searchParams.set("from", from);
      searchParams.set("to", to);
      const qs = searchParams.toString();
      return apiFetch<BookedDateRange[]>(`/api/listings/${id}/availability${qs ? `?${qs}` : ""}`);
    },

    getReviews: (id: number, page: number = 1, pageSize: number = 10): Promise<import("../types").ReviewsPage> => {
      return apiFetch<import("../types").ReviewsPage>(
        `/api/listings/${id}/reviews?page=${page}&page_size=${pageSize}`
      );
    },
  },

  categories: {
    list: (): Promise<Category[]> => apiFetch<Category[]>("/api/categories"),
  },

  amenities: {
    list: (): Promise<Amenity[]> => apiFetch<Amenity[]>("/api/amenities"),
  },

  bookings: {
    quotePrice: (data: {
      listing_id: number;
      check_in: string;
      check_out: string;
      guests_count?: number;
    }): Promise<PriceBreakdown> => {
      return apiFetch<PriceBreakdown>("/api/bookings/price", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    create: (data: import("../types").BookingCreatePayload): Promise<import("../types").BookingConfirmation> => {
      return apiFetch<import("../types").BookingConfirmation>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    getById: (bookingId: number): Promise<import("../types").Booking> => {
      return apiFetch<import("../types").Booking>(`/api/bookings/${bookingId}`);
    },

    listMy: (status?: string): Promise<import("../types").Booking[]> => {
      const qs = status ? `?status=${status}` : "";
      return apiFetch<import("../types").Booking[]>(`/api/bookings/my${qs}`);
    },

    cancel: (bookingId: number): Promise<import("../types").Booking> => {
      return apiFetch<import("../types").Booking>(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });
    },

    postReview: (
      listingId: number,
      data: {
        rating: number;
        booking_id?: number;
        cleanliness?: number;
        accuracy?: number;
        communication?: number;
        location?: number;
        checkin?: number;
        value?: number;
        comment?: string;
      }
    ): Promise<import("../types").ReviewsPage> => {
      return apiFetch<import("../types").ReviewsPage>(`/api/listings/${listingId}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  wishlist: {
    get: (): Promise<Wishlist> => apiFetch<Wishlist>("/api/wishlist"),

    toggle: (listing_id: number): Promise<{ wishlisted: boolean; listing_id: number }> => {
      return apiFetch<{ wishlisted: boolean; listing_id: number }>("/api/wishlist/toggle", {
        method: "POST",
        body: JSON.stringify({ listing_id }),
      });
    },
  },

  users: {
    list: (): Promise<User[]> => apiFetch<User[]>("/api/users"),
    me: (): Promise<User> => apiFetch<User>("/api/users/me"),
    getById: (id: number): Promise<User> => apiFetch<User>(`/api/users/${id}`),
  },

  host: {
    listListings: (): Promise<ListingDetail[]> => apiFetch<ListingDetail[]>("/api/host/listings"),

    createListing: (data: ListingCreate): Promise<ListingDetail> => {
      return apiFetch<ListingDetail>("/api/listings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    updateListing: (id: number, data: ListingUpdate): Promise<ListingDetail> => {
      return apiFetch<ListingDetail>(`/api/listings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    deleteListing: (id: number): Promise<void> => {
      return apiFetch<void>(`/api/listings/${id}`, {
        method: "DELETE",
      });
    },

    listBookings: (status?: string): Promise<Booking[]> => {
      const qs = status ? `?status=${status}` : "";
      return apiFetch<Booking[]>(`/api/host/bookings${qs}`);
    },

    getDashboard: (): Promise<HostDashboardMetrics> => {
      return apiFetch<HostDashboardMetrics>("/api/host/dashboard");
    },
  },
};

export const apiClient = api;

