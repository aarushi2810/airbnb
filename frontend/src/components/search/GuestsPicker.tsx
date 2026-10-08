"use client";

import React from "react";
import { Stepper } from "../ui/Stepper";

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

interface GuestsPickerProps {
  counts: GuestCounts;
  onChange: (counts: GuestCounts) => void;
  maxGuests?: number;
}

export function GuestsPicker({
  counts,
  onChange,
  maxGuests = 16,
}: GuestsPickerProps) {
  const { adults, children, infants, pets } = counts;
  const nonAdultGuests = children + infants + pets;
  // If children, infants or pets are present, at least 1 adult is required
  const minAdults = nonAdultGuests > 0 ? 1 : 0;

  const totalPrimaryGuests = adults + children;

  const updateCounts = (updates: Partial<GuestCounts>) => {
    const next = { ...counts, ...updates };

    // Auto-bump adults to at least 1 if any children, infants or pets are added
    if ((next.children > 0 || next.infants > 0 || next.pets > 0) && next.adults === 0) {
      next.adults = 1;
    }

    onChange(next);
  };

  return (
    <div className="w-80 p-5 bg-white divide-y divide-neutral-100 select-none">
      <Stepper
        title="Adults"
        subtitle="Ages 13 or above"
        value={adults}
        min={minAdults}
        max={maxGuests - children}
        onChange={(val) => updateCounts({ adults: val })}
      />

      <Stepper
        title="Children"
        subtitle="Ages 2–12"
        value={children}
        min={0}
        max={maxGuests - adults}
        onChange={(val) => updateCounts({ children: val })}
      />

      <Stepper
        title="Infants"
        subtitle="Under 2"
        value={infants}
        min={0}
        max={5}
        onChange={(val) => updateCounts({ infants: val })}
      />

      <Stepper
        title="Pets"
        subtitle="Bringing a service animal?"
        value={pets}
        min={0}
        max={5}
        onChange={(val) => updateCounts({ pets: val })}
      />

      {totalPrimaryGuests > 0 && (
        <div className="pt-3 text-[11px] text-[#717171] leading-relaxed">
          This place allows a maximum of {maxGuests} guests, not including infants.
        </div>
      )}
    </div>
  );
}

export function formatGuestSummary(counts: GuestCounts): string {
  const total = counts.adults + counts.children;
  if (total === 0) return "Add guests";

  const guestPart = `${total} guest${total > 1 ? "s" : ""}`;
  const infantPart = counts.infants > 0 ? `, ${counts.infants} infant${counts.infants > 1 ? "s" : ""}` : "";
  const petPart = counts.pets > 0 ? `, ${counts.pets} pet${counts.pets > 1 ? "s" : ""}` : "";

  return `${guestPart}${infantPart}${petPart}`;
}
