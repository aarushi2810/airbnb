"use client";

/**
 * AvailabilityCalendar.tsx
 *
 * Side-by-side two-month calendar showing real-time availability:
 *  - Disables past days and booked date ranges (struck-through, greyed out).
 *  - Range selection (check-in -> checkout).
 *  - Validates that the selected range does not contain any blocked dates.
 *  - Displays dynamic title ("X nights in City" or "Select check-in date").
 *  - "Clear dates" action to reset selections.
 */

import React, { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  parseISO,
  differenceInCalendarDays,
  isWithinInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BookedDateRange } from "../../types";

interface AvailabilityCalendarProps {
  blockedRanges: BookedDateRange[];
  checkIn: string | null; // YYYY-MM-DD
  checkOut: string | null; // YYYY-MM-DD
  onChangeDates: (checkIn: string | null, checkOut: string | null) => void;
  city?: string;
  minNights?: number;
}

export function AvailabilityCalendar({
  blockedRanges,
  checkIn,
  checkOut,
  onChangeDates,
  city = "this destination",
  minNights = 1,
}: AvailabilityCalendarProps) {
  // Current view month (left calendar)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (checkIn) return parseISO(checkIn);
    return new Date();
  });

  const nextMonth = useMemo(() => addMonths(currentMonth, 1), [currentMonth]);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const checkInDate = checkIn ? parseISO(checkIn) : null;
  const checkOutDate = checkOut ? parseISO(checkOut) : null;

  // Convert blocked ranges to Date intervals
  const parsedBlockedRanges = useMemo(() => {
    return blockedRanges.map((range) => ({
      start: parseISO(range.check_in),
      end: parseISO(range.check_out),
    }));
  }, [blockedRanges]);

  // Check if a specific date is blocked/booked
  const isDateBlocked = (date: Date): boolean => {
    if (isBefore(date, today)) return true;
    return parsedBlockedRanges.some((range) =>
      isWithinInterval(date, { start: range.start, end: range.end })
    );
  };

  // Check if any date in interval [start, end] is blocked
  const hasBlockedDateInRange = (start: Date, end: Date): boolean => {
    return parsedBlockedRanges.some((range) => {
      // Overlap condition: start < range.end and end > range.start
      return isBefore(start, range.end) && isAfter(end, range.start);
    });
  };

  // Handle day click
  const handleDateClick = (date: Date) => {
    if (isDateBlocked(date)) return;

    const dateStr = format(date, "yyyy-MM-dd");

    // Case 1: No check-in, or already have both -> set new check-in
    if (!checkInDate || (checkInDate && checkOutDate)) {
      onChangeDates(dateStr, null);
      return;
    }

    // Case 2: We have check-in, clicked earlier date -> reset check-in to clicked date
    if (isBefore(date, checkInDate) || isSameDay(date, checkInDate)) {
      onChangeDates(dateStr, null);
      return;
    }

    // Case 3: We have check-in, clicked date after check-in -> validate range
    if (hasBlockedDateInRange(checkInDate, date)) {
      // Overlaps with a blocked date -> reset check-in to clicked date
      onChangeDates(dateStr, null);
      return;
    }

    // Valid check-out!
    onChangeDates(checkIn, dateStr);
  };

  // Navigation
  const prevMonthHandler = () => setCurrentMonth((m) => subMonths(m, 1));
  const nextMonthHandler = () => setCurrentMonth((m) => addMonths(m, 1));

  // Render month grid helper
  const renderMonthGrid = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <div className="w-full">
        <div className="text-center font-bold text-sm text-[#222222] mb-4">
          {format(monthDate, "MMMM yyyy")}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-neutral-400 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthDate);
            const isBlocked = isDateBlocked(day);
            const isStart = checkInDate && isSameDay(day, checkInDate);
            const isEnd = checkOutDate && isSameDay(day, checkOutDate);
            const isInRange =
              checkInDate &&
              checkOutDate &&
              isAfter(day, checkInDate) &&
              isBefore(day, checkOutDate);

            if (!isCurrentMonth) {
              return <div key={day.toString()} className="h-10" />;
            }

            return (
              <div
                key={day.toString()}
                className={`relative h-10 flex items-center justify-center ${
                  isInRange ? "bg-neutral-100" : ""
                } ${isStart && checkOutDate ? "rounded-l-full bg-neutral-100" : ""} ${
                  isEnd && checkInDate ? "rounded-r-full bg-neutral-100" : ""
                }`}
              >
                <button
                  type="button"
                  disabled={isBlocked}
                  onClick={() => handleDateClick(day)}
                  className={`w-9 h-9 flex items-center justify-center text-xs font-medium rounded-full transition-all duration-150 ${
                    isBlocked
                      ? "text-neutral-300 line-through cursor-not-allowed hover:bg-transparent"
                      : isStart || isEnd
                      ? "bg-[#222222] text-white font-bold shadow"
                      : "text-[#222222] hover:border hover:border-black"
                  }`}
                >
                  {format(day, "d")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const nightsCount =
    checkInDate && checkOutDate
      ? differenceInCalendarDays(checkOutDate, checkInDate)
      : 0;

  return (
    <div className="py-6">
      {/* Title & subtitle */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#222222]">
            {checkInDate && checkOutDate
              ? `${nightsCount} night${nightsCount !== 1 ? "s" : ""} in ${city}`
              : checkInDate
              ? "Select checkout date"
              : "Select check-in date"}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {checkInDate && checkOutDate
              ? `${format(checkInDate, "MMM d, yyyy")} – ${format(
                  checkOutDate,
                  "MMM d, yyyy"
                )}`
              : checkInDate
              ? `Minimum stay: ${minNights} night${minNights !== 1 ? "s" : ""}`
              : "Add your travel dates for exact pricing"}
          </p>
        </div>

        {(checkIn || checkOut) && (
          <button
            onClick={() => onChangeDates(null, null)}
            className="text-xs font-semibold text-[#222222] underline hover:text-black py-1"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Calendar months container */}
      <div className="relative">
        {/* Navigation controls */}
        <div className="flex justify-between items-center absolute -top-10 left-0 right-0 pointer-events-none px-2 z-10">
          <button
            type="button"
            onClick={prevMonthHandler}
            disabled={isBefore(currentMonth, today)}
            className="pointer-events-auto p-1.5 rounded-full hover:bg-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-700" />
          </button>
          <button
            type="button"
            onClick={nextMonthHandler}
            className="pointer-events-auto p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-neutral-700" />
          </button>
        </div>

        {/* Dual month layout (1 col on mobile, 2 cols on md+) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {renderMonthGrid(currentMonth)}
          <div className="hidden md:block">{renderMonthGrid(nextMonth)}</div>
        </div>
      </div>
    </div>
  );
}
