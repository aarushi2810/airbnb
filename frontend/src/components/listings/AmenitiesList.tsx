"use client";

/**
 * AmenitiesList.tsx
 *
 * Shows listing amenities with matched Lucide vector icons:
 *  - 2-column grid showing first 10 amenities.
 *  - "Show all N amenities" button opening an Airbnb-style modal.
 *  - Modal groups amenities by category ("Kitchen", "Bathroom", "Safety", etc.).
 */

import React, { useState, useEffect } from "react";
import {
  Wifi,
  Utensils,
  Wind,
  Flame,
  Waves,
  Car,
  Sparkles,
  Tv,
  Bath,
  Dumbbell,
  Snowflake,
  Zap,
  Monitor,
  Bell,
  Heart,
  Coffee,
  PawPrint,
  Package,
  Check,
  X,
  LucideIcon,
} from "lucide-react";
import type { Amenity } from "../../types";

interface AmenitiesListProps {
  amenities: Amenity[];
}

// Icon dictionary matching amenity slugs / names
const ICON_MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  utensils: Utensils,
  kitchen: Utensils,
  wind: Wind,
  "air-conditioning": Wind,
  flame: Flame,
  heating: Flame,
  waves: Waves,
  pool: Waves,
  car: Car,
  parking: Car,
  sparkles: Sparkles,
  washer: Sparkles,
  dryer: Sparkles,
  tv: Tv,
  bath: Bath,
  bathtub: Bath,
  dumbbell: Dumbbell,
  gym: Dumbbell,
  snowflake: Snowflake,
  ski: Snowflake,
  zap: Zap,
  ev: Zap,
  monitor: Monitor,
  workspace: Monitor,
  bell: Bell,
  smoke: Bell,
  heart: Heart,
  firstaid: Heart,
  coffee: Coffee,
  breakfast: Coffee,
  paw: PawPrint,
  pets: PawPrint,
  package: Package,
  luggage: Package,
};

function getAmenityIcon(iconName: string, amenityName: string): LucideIcon {
  const normalizedIcon = (iconName || "").toLowerCase().replace(/[^a-z]/g, "");
  const normalizedName = (amenityName || "").toLowerCase().replace(/[^a-z]/g, "");

  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (normalizedIcon.includes(key) || normalizedName.includes(key)) {
      return icon;
    }
  }
  return Check;
}

export function AmenitiesList({ amenities }: AmenitiesListProps) {
  const [showModal, setShowModal] = useState(false);

  // Keyboard Escape for modal
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  // Group amenities by category for modal
  const groupedAmenities = React.useMemo(() => {
    const groups: Record<string, Amenity[]> = {};
    amenities.forEach((a) => {
      const cat = a.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, [amenities]);

  const displayedAmenities = amenities.slice(0, 10);

  return (
    <div className="py-8">
      <h2 className="text-xl font-bold text-[#222222] mb-6">
        What this place offers
      </h2>

      {/* 2-column preview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
        {displayedAmenities.map((amenity) => {
          const Icon = getAmenityIcon(amenity.icon, amenity.name);
          return (
            <div key={amenity.id} className="flex items-center gap-4 text-[#222222]">
              <Icon className="w-6 h-6 text-neutral-700 stroke-[1.5]" />
              <span className="text-base text-neutral-800">{amenity.name}</span>
            </div>
          );
        })}
      </div>

      {/* Show all amenities button */}
      {amenities.length > 0 && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-6 py-3 border border-[#222222] rounded-xl font-semibold text-sm text-[#222222] hover:bg-neutral-50 active:scale-[0.99] transition-all"
        >
          Show all {amenities.length} amenities
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <button
                onClick={() => setShowModal(false)}
                className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-800"
                aria-label="Close amenities modal"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-base text-[#222222]">What this place offers</h3>
              <div className="w-5" />
            </div>

            {/* Scrollable list grouped by category */}
            <div className="flex-1 overflow-y-auto px-6 py-6 divide-y divide-neutral-200 space-y-6">
              {Object.entries(groupedAmenities).map(([category, items], idx) => (
                <div key={category} className={idx > 0 ? "pt-6" : ""}>
                  <h4 className="font-bold text-base text-[#222222] mb-4 capitalize">
                    {category}
                  </h4>
                  <div className="space-y-4">
                    {items.map((item) => {
                      const Icon = getAmenityIcon(item.icon, item.name);
                      return (
                        <div key={item.id} className="flex items-center gap-4">
                          <Icon className="w-6 h-6 text-neutral-700 stroke-[1.5]" />
                          <span className="text-sm text-neutral-800">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
