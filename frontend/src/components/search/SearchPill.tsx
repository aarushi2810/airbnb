"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "../../lib/utils";
import { DestinationPicker } from "./DestinationPicker";
import { DateRangePicker } from "./DateRangePicker";
import { GuestsPicker, formatGuestSummary, type GuestCounts } from "./GuestsPicker";

type SearchSegment = "where" | "checkIn" | "checkOut" | "who" | null;

function SearchPillInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state is the single source of truth
  const locationParam = searchParams.get("location") || "";
  const checkInParam = searchParams.get("checkIn") || "";
  const checkOutParam = searchParams.get("checkOut") || "";
  const guestsParam = searchParams.get("guests") || "";

  // Local form state initialized directly from URL parameters
  const [location, setLocation] = useState(locationParam);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (checkInParam) {
      try {
        return {
          from: parseISO(checkInParam),
          to: checkOutParam ? parseISO(checkOutParam) : undefined,
        };
      } catch {
        return undefined;
      }
    }
    return undefined;
  });

  const [guestCounts, setGuestCounts] = useState<GuestCounts>(() => {
    const total = guestsParam ? parseInt(guestsParam, 10) : 0;
    return {
      adults: total > 0 ? total : 0,
      children: 0,
      infants: 0,
      pets: 0,
    };
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSegment, setActiveSegment] = useState<SearchSegment>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Collapse on scroll down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40 && isExpanded) {
        setIsExpanded(false);
        setActiveSegment(null);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isExpanded]);

  // Close active segment popover when clicking outside the entire search pill
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveSegment(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalGuests = guestCounts.adults + guestCounts.children;

  // Submit search query
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (location.trim()) {
      params.set("location", location.trim());
    } else {
      params.delete("location");
    }

    if (dateRange?.from) {
      params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    } else {
      params.delete("checkIn");
    }

    if (dateRange?.to) {
      params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    } else {
      params.delete("checkOut");
    }

    if (totalGuests > 0) {
      params.set("guests", totalGuests.toString());
    } else {
      params.delete("guests");
    }

    // Reset pagination to page 1 on new search
    params.delete("page");

    setIsExpanded(false);
    setActiveSegment(null);

    const queryString = params.toString();
    const targetUrl = queryString ? `/?${queryString}` : "/";
    router.push(targetUrl);
  };

  // Summaries for compact pill
  const compactLocation = location || "Anywhere";
  const compactDates = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
      : format(dateRange.from, "MMM d")
    : "Any week";
  const compactGuests = totalGuests > 0 ? `${totalGuests} guest${totalGuests > 1 ? "s" : ""}` : "Add guests";

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. COLLAPSED SEARCH PILL                                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!isExpanded ? (
        <div className="w-full flex justify-center">
          {/* Mobile Full-Width Compact Bar */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setActiveSegment("where");
            }}
            className="md:hidden w-full flex items-center justify-between px-4 py-3 rounded-full border border-neutral-300 bg-white shadow-search hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#222222]" />
              <div>
                <div className="text-xs font-semibold text-[#222222]">
                  {compactLocation}
                </div>
                <div className="text-[11px] text-[#717171]">
                  {compactDates} &bull; {compactGuests}
                </div>
              </div>
            </div>
          </button>

          {/* Desktop Compact Search Pill */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(true);
              setActiveSegment("where");
            }}
            className="hidden md:inline-flex items-center h-12 rounded-full border border-neutral-300 bg-white shadow-search hover:shadow-md transition-shadow text-xs font-semibold text-[#222222] select-none pl-6 pr-2 py-2"
          >
            <span className="truncate max-w-[130px] font-semibold">{compactLocation}</span>
            <span className="mx-3.5 h-5 w-[1px] bg-neutral-200" />
            <span className="truncate max-w-[120px] font-semibold">{compactDates}</span>
            <span className="mx-3.5 h-5 w-[1px] bg-neutral-200" />
            <span className="truncate max-w-[110px] text-[#717171] font-normal">{compactGuests}</span>
            <div className="ml-3 w-8 h-8 rounded-full bg-[#FF385C] text-white flex items-center justify-center shrink-0">
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </button>
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* 2. EXPANDED SEARCH BAR WITH ACTIVE SEGMENTS                   */
        /* ───────────────────────────────────────────────────────────── */
        <div className="w-full animate-in fade-in zoom-in-95 duration-200">
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col md:flex-row items-center w-full bg-[#F7F7F7] border border-neutral-200 rounded-full shadow-search p-1"
          >
            {/* WHERE SEGMENT */}
            <div
              onClick={() => setActiveSegment("where")}
              className={cn(
                "relative flex-1 w-full md:w-auto px-7 py-3 rounded-full cursor-pointer transition-all",
                activeSegment === "where"
                  ? "bg-white shadow-dropdown ring-1 ring-neutral-200/80 z-20"
                  : "hover:bg-neutral-200/60"
              )}
            >
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#222222]">
                Where
              </label>
              <input
                type="text"
                placeholder="Search destinations"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setActiveSegment("where")}
                className="w-full bg-transparent text-xs font-semibold text-[#222222] placeholder:text-[#717171] placeholder:font-normal focus:outline-none truncate"
              />

              {activeSegment === "where" && (
                <div className="absolute top-full left-0 mt-3 z-50 rounded-3xl border border-neutral-200 bg-white shadow-dropdown overflow-hidden">
                  <DestinationPicker
                    value={location}
                    onChange={(val) => setLocation(val)}
                    onSelect={(val) => {
                      setLocation(val);
                      setActiveSegment("checkIn");
                    }}
                  />
                </div>
              )}
            </div>

            <div className="hidden md:block h-8 w-[1px] bg-neutral-300" />

            {/* CHECK IN SEGMENT */}
            <div
              onClick={() => setActiveSegment("checkIn")}
              className={cn(
                "relative flex-1 w-full md:w-auto px-7 py-3 rounded-full cursor-pointer transition-all",
                activeSegment === "checkIn"
                  ? "bg-white shadow-dropdown ring-1 ring-neutral-200/80 z-20"
                  : "hover:bg-neutral-200/60"
              )}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#222222]">
                Check in
              </span>
              <span className="block text-xs font-semibold text-[#222222] truncate">
                {dateRange?.from ? format(dateRange.from, "MMM d") : <span className="font-normal text-[#717171]">Add dates</span>}
              </span>

              {activeSegment === "checkIn" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 rounded-3xl border border-neutral-200 bg-white shadow-dropdown overflow-hidden">
                  <DateRangePicker
                    range={dateRange}
                    onChange={(r) => {
                      setDateRange(r);
                      if (r?.from && !r?.to) {
                        setActiveSegment("checkOut");
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="hidden md:block h-8 w-[1px] bg-neutral-300" />

            {/* CHECK OUT SEGMENT */}
            <div
              onClick={() => setActiveSegment("checkOut")}
              className={cn(
                "relative flex-1 w-full md:w-auto px-7 py-3 rounded-full cursor-pointer transition-all",
                activeSegment === "checkOut"
                  ? "bg-white shadow-dropdown ring-1 ring-neutral-200/80 z-20"
                  : "hover:bg-neutral-200/60"
              )}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#222222]">
                Check out
              </span>
              <span className="block text-xs font-semibold text-[#222222] truncate">
                {dateRange?.to ? format(dateRange.to, "MMM d") : <span className="font-normal text-[#717171]">Add dates</span>}
              </span>

              {activeSegment === "checkOut" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 rounded-3xl border border-neutral-200 bg-white shadow-dropdown overflow-hidden">
                  <DateRangePicker
                    range={dateRange}
                    onChange={(r) => setDateRange(r)}
                  />
                </div>
              )}
            </div>

            <div className="hidden md:block h-8 w-[1px] bg-neutral-300" />

            {/* WHO / GUESTS SEGMENT */}
            <div
              onClick={() => setActiveSegment("who")}
              className={cn(
                "relative flex-[1.2] w-full md:w-auto pl-7 pr-3 py-2 rounded-full cursor-pointer transition-all flex items-center justify-between",
                activeSegment === "who"
                  ? "bg-white shadow-dropdown ring-1 ring-neutral-200/80 z-20"
                  : "hover:bg-neutral-200/60"
              )}
            >
              <div className="truncate">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#222222]">
                  Who
                </span>
                <span className="block text-xs font-semibold text-[#222222] truncate">
                  {totalGuests > 0 ? formatGuestSummary(guestCounts) : <span className="font-normal text-[#717171]">Add guests</span>}
                </span>
              </div>

              {/* Red Circular Search Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit();
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#FF385C] to-[#E31C5F] text-white hover:opacity-95 shadow-md transition-all shrink-0 ml-2"
              >
                <Search className="w-4 h-4 stroke-[3]" />
                <span className="text-xs font-bold hidden lg:inline">Search</span>
              </button>

              {activeSegment === "who" && (
                <div className="absolute top-full right-0 mt-3 z-50 rounded-3xl border border-neutral-200 bg-white shadow-dropdown overflow-hidden">
                  <GuestsPicker
                    counts={guestCounts}
                    onChange={(next) => setGuestCounts(next)}
                  />
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SearchPillWrapper() {
  const searchParams = useSearchParams();
  // keying on searchParams string ensures form state cleanly re-initializes when URL updates
  return <SearchPillInner key={searchParams.toString()} />;
}

export function SearchPill() {
  return (
    <Suspense fallback={<div className="h-12 w-80 bg-neutral-100 rounded-full animate-pulse mx-auto" />}>
      <SearchPillWrapper />
    </Suspense>
  );
}
