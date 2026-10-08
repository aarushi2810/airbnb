"use client";

/**
 * Home / Explore page.
 *
 * Layout:
 *  - CategoryRow (sticky below header) with embedded FiltersModal
 *  - Grid of ListingCard (1/2/3/4/5 cols responsive)
 *  - Infinite scroll via IntersectionObserver + "Show more" fallback
 *  - Skeleton loading, empty, and error states
 *
 * URL params are the single source of truth for all filter state.
 * useListings resets + re-fetches whenever params change.
 */

import React, { useMemo, Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useListings } from "../hooks/useListings";
import { Container } from "../components/layout/Container";
import { CategoryRow } from "../components/search/CategoryRow";
import { ListingCard } from "../components/listings/ListingCard";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import type { ListingFilterParams, RoomType } from "../types";

// ── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-square w-full rounded-xl bg-neutral-200" />
      <div className="h-4 w-3/4 rounded bg-neutral-200" />
      <div className="h-3 w-1/2 rounded bg-neutral-100" />
      <div className="h-3 w-2/3 rounded bg-neutral-100" />
      <div className="h-4 w-1/3 rounded bg-neutral-200 mt-1" />
    </div>
  );
}

// ── HomeContent ────────────────────────────────────────────────────────────────
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build filter params from URL (single source of truth)
  const filterParams = useMemo<ListingFilterParams>(() => {
    const rawRoomTypes = searchParams.getAll("room_types") as RoomType[];
    const rawAmenities = searchParams.getAll("amenities").map(Number).filter(Boolean);
    return {
      category: searchParams.get("category") || undefined,
      location: searchParams.get("location") || undefined,
      check_in: searchParams.get("checkIn") || undefined,
      check_out: searchParams.get("checkOut") || undefined,
      guests: searchParams.get("guests") ? parseInt(searchParams.get("guests")!, 10) : undefined,
      min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
      max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
      room_types: rawRoomTypes.length > 0 ? rawRoomTypes : undefined,
      amenities: rawAmenities.length > 0 ? rawAmenities : undefined,
    };
  }, [searchParams]);

  const { listings, total, isLoading, isFetchingMore, error, hasMore, loadMore, refetch } =
    useListings(filterParams);

  const hasActiveFilters = Boolean(
    filterParams.category || filterParams.location || filterParams.check_in ||
    filterParams.check_out || filterParams.guests || filterParams.min_price ||
    filterParams.max_price || filterParams.room_types || filterParams.amenities
  );

  const clearAllFilters = () => router.push("/");

  // ── Infinite Scroll Sentinel ───────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className="flex-1 flex flex-col">
      <CategoryRow />

      <div className="py-8">
        <Container>
          {/* Result Header */}
          {!isLoading && !error && listings.length > 0 && (
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <h1 className="text-xl font-bold text-[#222222]">
                {hasActiveFilters
                  ? `${total.toLocaleString()} place${total !== 1 ? "s" : ""} matching your search`
                  : `Stays around the world`}
              </h1>
              {hasActiveFilters && (
                <button onClick={clearAllFilters}
                  className="text-xs font-semibold text-[#FF385C] underline hover:text-[#E31C5F]">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Loading Skeleton (first page) */}
          {isLoading && listings.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
              {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Unable to load listings</h3>
                  <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
              <button onClick={refetch}
                className="px-4 py-2 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black flex items-center gap-1.5 transition-colors shrink-0">
                <RefreshCw className="w-3.5 h-3.5" />Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && listings.length === 0 && (
            <div className="text-center py-20 px-4">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-400">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#222222] mb-2">No exact matches</h2>
              <p className="text-sm text-[#717171] max-w-sm mx-auto mb-6">
                Try adjusting or clearing your search filters to see more available places.
              </p>
              <button onClick={clearAllFilters}
                className="px-6 py-3 rounded-xl bg-[#222222] text-white text-sm font-semibold hover:bg-black transition-colors">
                Clear all filters
              </button>
            </div>
          )}

          {/* Listing Grid */}
          {!error && listings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
              {/* Append skeleton rows while fetching next page */}
              {isFetchingMore && (
                [...Array(5)].map((_, i) => <SkeletonCard key={`more-${i}`} />)
              )}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4 mt-4" />

          {/* Fallback "Show more" button (for keyboard / no-JS) */}
          {hasMore && !isFetchingMore && !isLoading && (
            <div className="flex justify-center mt-8">
              <button onClick={loadMore}
                className="px-8 py-3 rounded-xl border border-[#222222] text-sm font-semibold text-[#222222] hover:bg-neutral-50 transition-colors">
                Show more places
              </button>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeContent />
    </Suspense>
  );
}
