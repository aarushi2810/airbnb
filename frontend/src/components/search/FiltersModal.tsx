"use client";

/**
 * FiltersModal.tsx
 *
 * Airbnb-style full filter panel.
 * Sections:
 *  1. Type of place       — entire home / private room / shared room
 *  2. Price range         — dual-thumb range slider (CSS custom, no lib)
 *  3. Rooms & beds        — steppers for bedrooms / beds / bathrooms
 *  4. Property type       — pill grid (house, apartment, guesthouse, hotel)
 *  5. Amenities           — fetched from /api/amenities, grouped by category
 */

import React, { useState, useEffect, useCallback } from "react";
import { X, Home, DoorOpen, Users2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { api } from "../../lib/api";
import type { Amenity, RoomType, ListingFilterParams } from "../../types";

interface FilterState {
  roomTypes: RoomType[];
  minPrice: number;
  maxPrice: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  propertyTypes: string[];
  amenityIds: number[];
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Partial<ListingFilterParams>) => void;
  currentFilters?: Partial<ListingFilterParams>;
  resultCount?: number;
}

const MIN_PRICE = 0;
const MAX_PRICE = 1500;

const PROPERTY_TYPES = [
  { key: "house", label: "House", emoji: "🏠" },
  { key: "apartment", label: "Apartment", emoji: "🏢" },
  { key: "guesthouse", label: "Guesthouse", emoji: "🏡" },
  { key: "hotel", label: "Hotel", emoji: "🏨" },
];

const ROOM_TYPE_OPTIONS: { value: RoomType; label: string; desc: string; Icon: React.ElementType }[] = [
  { value: "entire_home", label: "Entire home", desc: "Guests have the whole place to themselves", Icon: Home },
  { value: "private_room", label: "Private room", desc: "Guests have their own room and share some spaces", Icon: DoorOpen },
  { value: "shared_room", label: "Shared room", desc: "Guests sleep in a shared space, like a common room", Icon: Users2 },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[#222222] mb-4">{children}</h3>;
}

function Divider() {
  return <hr className="border-neutral-200 my-6" />;
}

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 8,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-[#222222] font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-neutral-400 flex items-center justify-center text-neutral-600 hover:border-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-semibold text-[#222222]">
          {value === 0 ? "Any" : `${value}${value === max ? "+" : ""}`}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-neutral-400 flex items-center justify-center text-neutral-600 hover:border-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function PriceSlider({
  min,
  max,
  low,
  high,
  onChange,
}: {
  min: number;
  max: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
}) {
  const lowPct = ((low - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;

  const trackStyle = {
    background: `linear-gradient(to right, #DDDDDD ${lowPct}%, #222222 ${lowPct}%, #222222 ${highPct}%, #DDDDDD ${highPct}%)`,
  };

  return (
    <div className="relative">
      <div className="flex justify-between text-xs text-[#717171] mb-4">
        <span>${low.toLocaleString()}</span>
        <span>${high.toLocaleString()}{high >= MAX_PRICE ? "+" : ""}</span>
      </div>
      <div className="relative h-1.5 rounded-full" style={trackStyle}>
        <input
          type="range" min={min} max={max} step={10} value={low}
          onChange={(e) => onChange(Math.min(parseInt(e.target.value, 10), high - 10), high)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: low > max - 10 ? 5 : 3 }}
          aria-label="Minimum price"
        />
        <input
          type="range" min={min} max={max} step={10} value={high}
          onChange={(e) => onChange(low, Math.max(parseInt(e.target.value, 10), low + 10))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
          aria-label="Maximum price"
        />
      </div>
      <div className="relative h-0 pointer-events-none">
        <div className="absolute -top-3.5 w-6 h-6 rounded-full border-2 border-[#222222] bg-white shadow-md -translate-x-1/2 -translate-y-1/2" style={{ left: `${lowPct}%` }} />
        <div className="absolute -top-3.5 w-6 h-6 rounded-full border-2 border-[#222222] bg-white shadow-md -translate-x-1/2 -translate-y-1/2" style={{ left: `${highPct}%` }} />
      </div>
      <div className="h-5" />
    </div>
  );
}

export function FiltersModal({ isOpen, onClose, onApply, currentFilters = {}, resultCount }: FiltersModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    roomTypes: (currentFilters.room_types as RoomType[]) ?? [],
    minPrice: currentFilters.min_price ?? MIN_PRICE,
    maxPrice: currentFilters.max_price ?? MAX_PRICE,
    bedrooms: 0, beds: 0, bathrooms: 0, propertyTypes: [], amenityIds: currentFilters.amenities ?? [],
  });
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFilters({
        roomTypes: (currentFilters.room_types as RoomType[]) ?? [],
        minPrice: currentFilters.min_price ?? MIN_PRICE,
        maxPrice: currentFilters.max_price ?? MAX_PRICE,
        bedrooms: 0, beds: 0, bathrooms: 0, propertyTypes: [],
        amenityIds: currentFilters.amenities ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => { api.amenities.list().then(setAmenities).catch(console.error); }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const toggleRoomType = useCallback((rt: RoomType) => {
    setFilters((prev) => ({
      ...prev,
      roomTypes: prev.roomTypes.includes(rt) ? prev.roomTypes.filter((x) => x !== rt) : [...prev.roomTypes, rt],
    }));
  }, []);

  const togglePropertyType = useCallback((pt: string) => {
    setFilters((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(pt) ? prev.propertyTypes.filter((x) => x !== pt) : [...prev.propertyTypes, pt],
    }));
  }, []);

  const toggleAmenity = useCallback((id: number) => {
    setFilters((prev) => ({
      ...prev,
      amenityIds: prev.amenityIds.includes(id) ? prev.amenityIds.filter((x) => x !== id) : [...prev.amenityIds, id],
    }));
  }, []);

  const clearAll = () => {
    setFilters({ roomTypes: [], minPrice: MIN_PRICE, maxPrice: MAX_PRICE, bedrooms: 0, beds: 0, bathrooms: 0, propertyTypes: [], amenityIds: [] });
  };

  const apply = () => {
    const params: Partial<ListingFilterParams> = {};
    if (filters.roomTypes.length > 0) params.room_types = filters.roomTypes;
    if (filters.minPrice > MIN_PRICE) params.min_price = filters.minPrice;
    if (filters.maxPrice < MAX_PRICE) params.max_price = filters.maxPrice;
    if (filters.amenityIds.length > 0) params.amenities = filters.amenityIds;
    onApply(params);
    onClose();
  };

  const activeCount =
    filters.roomTypes.length +
    (filters.minPrice > MIN_PRICE || filters.maxPrice < MAX_PRICE ? 1 : 0) +
    (filters.bedrooms > 0 ? 1 : 0) +
    (filters.beds > 0 ? 1 : 0) +
    (filters.bathrooms > 0 ? 1 : 0) +
    filters.propertyTypes.length +
    filters.amenityIds.length;

  const amenityGroups = amenities.reduce<Record<string, Amenity[]>>((acc, a) => {
    const grp = a.category || "Other";
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(a);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 shrink-0">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600" aria-label="Close filters">
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-[#222222]">Filters</h2>
          <div className="w-8" />
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* 1. Type of place */}
          <section>
            <SectionTitle>Type of place</SectionTitle>
            <div className="grid grid-cols-1 gap-3">
              {ROOM_TYPE_OPTIONS.map(({ value, label, desc, Icon }) => {
                const isActive = filters.roomTypes.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleRoomType(value)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                      isActive ? "border-[#222222] bg-neutral-50" : "border-neutral-200 hover:border-neutral-400 bg-white"
                    )}
                  >
                    <Icon className={cn("w-6 h-6 shrink-0", isActive ? "text-[#222222]" : "text-[#717171]")} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#222222]">{label}</p>
                      <p className="text-xs text-[#717171] mt-0.5">{desc}</p>
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors", isActive ? "border-[#222222] bg-[#222222]" : "border-neutral-300")}>
                      {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <Divider />

          {/* 2. Price range */}
          <section>
            <SectionTitle>Price range</SectionTitle>
            <p className="text-xs text-[#717171] mb-4">Nightly prices including fees and taxes</p>
            <PriceSlider
              min={MIN_PRICE} max={MAX_PRICE}
              low={filters.minPrice} high={filters.maxPrice}
              onChange={(low, high) => setFilters((prev) => ({ ...prev, minPrice: low, maxPrice: high }))}
            />
            <div className="flex gap-3 mt-2">
              {(["minPrice", "maxPrice"] as const).map((field, i) => (
                <label key={field} className="flex-1 flex flex-col gap-1">
                  <span className="text-xs text-[#717171]">{i === 0 ? "Minimum" : "Maximum"}</span>
                  <div className="flex items-center gap-1 border border-neutral-300 rounded-lg px-3 py-2 focus-within:border-neutral-800 transition-colors">
                    <span className="text-sm text-[#717171]">$</span>
                    <input
                      type="number" step={10}
                      value={filters[field]}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 0;
                        setFilters((prev) => ({
                          ...prev,
                          [field]: field === "minPrice"
                            ? Math.max(MIN_PRICE, Math.min(v, prev.maxPrice - 10))
                            : Math.min(MAX_PRICE, Math.max(v, prev.minPrice + 10)),
                        }));
                      }}
                      className="w-full text-sm font-semibold text-[#222222] outline-none bg-transparent"
                    />
                  </div>
                </label>
              ))}
            </div>
          </section>

          <Divider />

          {/* 3. Rooms & Beds */}
          <section>
            <SectionTitle>Rooms and beds</SectionTitle>
            <div className="divide-y divide-neutral-100">
              <Stepper label="Bedrooms" value={filters.bedrooms} onChange={(n) => setFilters((p) => ({ ...p, bedrooms: n }))} />
              <Stepper label="Beds" value={filters.beds} onChange={(n) => setFilters((p) => ({ ...p, beds: n }))} />
              <Stepper label="Bathrooms" value={filters.bathrooms} onChange={(n) => setFilters((p) => ({ ...p, bathrooms: n }))} />
            </div>
          </section>

          <Divider />

          {/* 4. Property type */}
          <section>
            <SectionTitle>Property type</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PROPERTY_TYPES.map(({ key, label, emoji }) => {
                const isActive = filters.propertyTypes.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => togglePropertyType(key)}
                    className={cn(
                      "flex flex-col items-start gap-2 p-4 rounded-xl border transition-all",
                      isActive ? "border-[#222222] bg-neutral-50" : "border-neutral-200 hover:border-neutral-400 bg-white"
                    )}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className={cn("text-sm text-[#222222]", isActive && "font-semibold")}>{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {amenities.length > 0 && (
            <>
              <Divider />
              {/* 5. Amenities */}
              <section>
                <SectionTitle>Amenities</SectionTitle>
                <div className="space-y-6">
                  {Object.entries(amenityGroups).map(([group, items]) => (
                    <div key={group}>
                      <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-3 capitalize">{group}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((amenity) => {
                          const isActive = filters.amenityIds.includes(amenity.id);
                          return (
                            <button
                              key={amenity.id}
                              onClick={() => toggleAmenity(amenity.id)}
                              className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left text-sm",
                                isActive ? "border-[#222222] bg-neutral-50 font-semibold text-[#222222]" : "border-neutral-200 hover:border-neutral-400 text-[#222222]"
                              )}
                            >
                              <span>{amenity.name}</span>
                              <div className={cn("w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center ml-3 transition-colors", isActive ? "border-[#222222] bg-[#222222]" : "border-neutral-300")}>
                                {isActive && (
                                  <svg viewBox="0 0 10 8" className="w-2.5 fill-white">
                                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-neutral-200 bg-white flex items-center justify-between gap-4">
          <button onClick={clearAll} className="text-sm font-semibold text-[#222222] underline hover:text-black transition-colors flex items-center gap-1.5">
            Clear all
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#222222] text-white text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={apply}
            className="px-6 py-3 rounded-xl bg-[#222222] text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            {resultCount !== undefined ? `Show ${resultCount.toLocaleString()} place${resultCount !== 1 ? "s" : ""}` : "Show places"}
          </button>
        </div>
      </div>
    </div>
  );
}
