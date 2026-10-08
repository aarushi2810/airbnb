"use client";

/**
 * CategoryRow.tsx
 *
 * Sticky row below the header with:
 *  - Horizontally scrollable category pill carousel (with left/right arrows)
 *  - "Filters" button that opens the full FiltersModal
 *  - Active filter count badge on the Filters button
 *
 * Filter state lives in URL query params (single source of truth):
 *   category, min_price, max_price, room_types (repeating), amenities (repeating)
 * Applying filters pushes a new URL so back/forward restores state.
 */

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles, Waves, Trees, Landmark, Flame, Sailboat,
  Palmtree, Castle, Tent, Snowflake, SunMedium, History,
  Home, ChevronLeft, ChevronRight, SlidersHorizontal,
} from "lucide-react";
import { api } from "../../lib/api";
import type { Category, ListingFilterParams } from "../../types";
import { cn } from "../../lib/utils";
import { FiltersModal } from "./FiltersModal";

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  icons: Sparkles, beachfront: Waves, cabins: Trees, mansions: Landmark,
  trending: Flame, lakefront: Sailboat, countryside: Trees,
  "tiny-homes": Home, treehouses: Trees, tropical: Palmtree,
  castles: Castle, camping: Tent, "ski-in-out": Snowflake,
  desert: SunMedium, historical: History,
};

/**
 * Reads current filter URL params and counts how many are active
 * (excludes category and search params—those are shown in the pill).
 */
function countActiveFilters(sp: URLSearchParams): number {
  let count = 0;
  if (sp.get("min_price")) count++;
  if (sp.get("max_price")) count++;
  const rts = sp.getAll("room_types");
  if (rts.length > 0) count++;
  const ams = sp.getAll("amenities");
  if (ams.length > 0) count += ams.length;
  return count;
}

function CategoryRowInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategorySlug = searchParams.get("category") || "";
  const activeFilterCount = countActiveFilters(searchParams);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  // Live result count shown on "Show N places" button; updated debounced
  const [filterResultCount, setFilterResultCount] = useState<number | undefined>(undefined);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch categories ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    api.categories.list()
      .then((data) => { if (isMounted) { setCategories(data); setIsLoading(false); } })
      .catch((err) => { console.error("Categories:", err); if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  // ── Scroll state ───────────────────────────────────────────────────────────
  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories, checkScroll]);

  const scroll = (dir: "left" | "right") => {
    scrollContainerRef.current?.scrollBy({ left: dir === "left" ? -350 : 350, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  const handleSelectCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCategorySlug === slug) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.delete("page");
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  };

  // ── Build current filter params from URL (for FiltersModal pre-fill) ───────
  const currentFilters: Partial<ListingFilterParams> = {
    min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
    max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
    room_types: searchParams.getAll("room_types").length > 0
      ? (searchParams.getAll("room_types") as ListingFilterParams["room_types"])
      : undefined,
    amenities: searchParams.getAll("amenities").length > 0
      ? searchParams.getAll("amenities").map(Number)
      : undefined,
  };

  // ── Debounced live count fetch when FiltersModal opens ─────────────────────
  useEffect(() => {
    if (!isFilterModalOpen) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const result = await api.listings.list({ ...currentFilters, page_size: 1 });
        setFilterResultCount(result.total);
      } catch { /* silent */ }
    }, 400);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFilterModalOpen, searchParams.toString()]);

  // ── Apply filters: merge into URL params ───────────────────────────────────
  const handleApplyFilters = (newFilters: Partial<ListingFilterParams>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Clear old filter params
    params.delete("min_price");
    params.delete("max_price");
    params.delete("room_types");
    params.delete("amenities");
    params.delete("page");

    if (newFilters.min_price !== undefined) params.set("min_price", String(newFilters.min_price));
    if (newFilters.max_price !== undefined) params.set("max_price", String(newFilters.max_price));
    newFilters.room_types?.forEach((rt) => params.append("room_types", rt));
    newFilters.amenities?.forEach((id) => params.append("amenities", String(id)));

    router.push(params.toString() ? `/?${params.toString()}` : "/");
  };

  return (
    <div className="sticky top-20 z-30 w-full bg-white border-b border-neutral-100 shadow-xs">
      <div className="airbnb-container flex items-center gap-4 py-3">
        {/* Category Carousel */}
        <div className="relative flex-1 flex items-center overflow-hidden">
          {canScrollLeft && (
            <button onClick={() => scroll("left")} aria-label="Scroll left"
              className="absolute left-0 z-10 p-1.5 rounded-full border border-neutral-300 bg-white shadow-md hover:scale-105 transition-all text-neutral-700">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div ref={scrollContainerRef} onScroll={checkScroll}
            className="flex items-center gap-7 overflow-x-auto scrollbar-none py-1 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {isLoading
              ? [...Array(12)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-neutral-200" />
                  <div className="w-12 h-2.5 rounded-full bg-neutral-200" />
                </div>
              ))
              : categories.map((cat) => {
                const IconComponent = CATEGORY_ICON_MAP[cat.slug] || Sparkles;
                const isActive = activeCategorySlug === cat.slug;
                return (
                  <button key={cat.id} onClick={() => handleSelectCategory(cat.slug)}
                    className={cn(
                      "flex flex-col items-center gap-2 pb-2.5 pt-1 shrink-0 border-b-2 transition-all group select-none",
                      isActive ? "border-[#222222] text-[#222222]" : "border-transparent text-[#717171] hover:text-[#222222] hover:border-neutral-300"
                    )}>
                    <IconComponent className={cn("w-6 h-6 transition-transform group-hover:scale-110",
                      isActive ? "text-[#222222] stroke-[2.2]" : "text-[#717171] group-hover:text-[#222222]")} />
                    <span className={cn("text-xs whitespace-nowrap", isActive ? "font-semibold" : "font-medium")}>
                      {cat.name}
                    </span>
                  </button>
                );
              })
            }
          </div>

          {canScrollRight && (
            <button onClick={() => scroll("right")} aria-label="Scroll right"
              className="absolute right-0 z-10 p-1.5 rounded-full border border-neutral-300 bg-white shadow-md hover:scale-105 transition-all text-neutral-700">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Button with active count badge */}
        <div className="shrink-0 pl-2">
          <button type="button" onClick={() => setIsFilterModalOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-neutral-800 text-xs font-semibold text-[#222222] transition-colors bg-white shadow-xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#222222] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <FiltersModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={currentFilters}
        resultCount={filterResultCount}
      />
    </div>
  );
}

export function CategoryRow() {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-white border-b border-neutral-100" />}>
      <CategoryRowInner />
    </Suspense>
  );
}
