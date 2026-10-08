/**
 * Core TypeScript definitions matching FastAPI backend schemas exactly.
 * No `any` allowed.
 */

export type UserRole = "guest" | "host";
export type RoomType = "entire_home" | "private_room" | "shared_room";
export type BookingStatus = "confirmed" | "cancelled" | "completed";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  is_superhost: boolean;
  response_rate?: number | null;
  joined_at?: string;
  created_at?: string;
}

export interface HostSummary {
  id: number;
  name: string;
  avatar_url: string | null;
  is_superhost: boolean;
  response_rate?: number | null;
  joined_at: string;
  bio?: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  slug: string;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
  category: "essentials" | "features" | "safety" | string;
}

export interface ListingImage {
  id: number;
  url: string;
  position: number;
  caption?: string | null;
}

export interface ReviewAuthor {
  id: number;
  name: string;
  avatar_url: string | null;
  is_superhost?: boolean;
}

export interface Review {
  id: number;
  listing_id: number;
  author_id: number;
  booking_id?: number | null;
  rating: number;
  cleanliness?: number | null;
  accuracy?: number | null;
  communication?: number | null;
  location?: number | null;
  checkin?: number | null;
  value?: number | null;
  comment?: string | null;
  created_at: string;
  author?: User | ReviewAuthor;
}

export interface ReviewsPage {
  items: Review[];
  total: number;
  page: number;
  has_more: boolean;
  avg_cleanliness?: number | null;
  avg_accuracy?: number | null;
  avg_communication?: number | null;
  avg_location?: number | null;
  avg_checkin?: number | null;
  avg_value?: number | null;
}

export interface ListingSummary {
  id: number;
  title: string;
  room_type: RoomType;
  city: string;
  state?: string | null;
  country: string;
  price_per_night: number;
  cleaning_fee?: number;
  max_guests: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  category_id?: number | null;
  category?: Category | null;
  cover_image?: string | null;
  images?: ListingImage[];
  rating?: number | null;
  rating_avg?: number | null;
  review_count: number;
  is_guest_favorite?: boolean;
  is_wishlisted?: boolean;
}

export interface ListingDetail {
  id: number;
  title: string;
  description?: string | null;
  property_type?: string | null;
  room_type: RoomType;
  city: string;
  state?: string | null;
  country: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  rating_avg: number;
  review_count: number;
  is_guest_favorite: boolean;
  status: "active" | "inactive" | string;
  created_at: string;
  updated_at: string;
  category_id?: number | null;
  host: HostSummary;
  images: ListingImage[];
  amenities: Amenity[];
  is_wishlisted: boolean;
}

export interface ListingListResponse {
  items: ListingSummary[];
  total: number;
  page: number;
  page_size: number;
  has_more?: boolean;
  total_pages?: number;
}

export interface PriceBreakdown {
  nights: number;
  nightly_rate: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
}

export interface Booking {
  id: number;
  code: string;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests_adults: number;
  guests_children: number;
  guests_infants: number;
  nightly_rate: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  listing?: ListingSummary;
  guest?: User;
}

export interface BookingConfirmation {
  booking: Booking;
  price_breakdown: PriceBreakdown;
}

export interface BookingCreatePayload {
  listing_id: number;
  check_in: string;
  check_out: string;
  guests_adults: number;
  guests_children?: number;
  guests_infants?: number;
}

export interface WishlistItem {
  id: number;
  wishlist_id: number;
  listing_id: number;
  created_at: string;
  listing: ListingSummary;
}

export interface Wishlist {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  items: WishlistItem[];
}

export interface BookedDateRange {
  check_in: string;
  check_out: string;
}

export interface ListingFilterParams {
  category?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  guests?: number;
  check_in?: string;
  check_out?: string;
  room_types?: RoomType[];
  amenities?: number[];
  sort_by?: "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  page_size?: number;
}

export interface ApiErrorResponse {
  detail: string | { msg?: string; loc?: (string | number)[] }[];
  code?: string;
}

export interface ListingCreate {
  title: string;
  description?: string;
  property_type?: string;
  category_id?: number;
  room_type: RoomType;
  city: string;
  state?: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price_per_night: number;
  cleaning_fee?: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenity_ids?: number[];
  image_urls?: string[];
}

export interface ListingUpdate {
  title?: string;
  description?: string;
  property_type?: string;
  category_id?: number;
  room_type?: RoomType;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price_per_night?: number;
  cleaning_fee?: number;
  max_guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  status?: "active" | "inactive" | string;
  amenity_ids?: number[];
  image_urls?: string[];
}

export interface HostDashboardMetrics {
  active_listings: number;
  total_listings: number;
  upcoming_reservations: number;
  estimated_earnings: number;
}

