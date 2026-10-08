"use client";

import React, { useState, useEffect } from "react";
import { Compass, MapPin, Globe, Mountain, Palmtree, Castle } from "lucide-react";
import { api } from "../../lib/api";

interface DestinationPickerProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (val: string) => void;
}

const REGION_SUGGESTIONS = [
  { name: "I'm flexible", icon: Globe, label: "Search anywhere" },
  { name: "Goa", icon: Palmtree, label: "India &bull; Beach & villas" },
  { name: "Bali", icon: Palmtree, label: "Indonesia &bull; Tropical retreats" },
  { name: "Kyoto", icon: Castle, label: "Japan &bull; Historic temples" },
  { name: "Amalfi", icon: Compass, label: "Italy &bull; Coastal cliffs" },
  { name: "Zermatt", icon: Mountain, label: "Switzerland &bull; Alpine peaks" },
  { name: "Paris", icon: Castle, label: "France &bull; City of light" },
];

export function DestinationPicker({
  value,
  onChange,
  onSelect,
}: DestinationPickerProps) {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    // Fetch seed listings to extract unique cities
    api.listings.list({ page_size: 50 }).then((res) => {
      const cities = Array.from(new Set(res.items.map((i) => i.city)));
      setAvailableCities(cities);
    }).catch(() => {
      // Fallback
      setAvailableCities(["Goa", "Bali", "Kyoto", "Amalfi", "Santorini", "Paris", "Zermatt", "Udaipur", "Lake Como"]);
    });
  }, []);

  const filteredCities = value.trim()
    ? availableCities.filter((c) =>
        c.toLowerCase().includes(value.toLowerCase().trim())
      )
    : [];

  return (
    <div className="w-96 p-6 bg-white select-none">
      {/* Autocomplete Results when typing */}
      {value.trim().length > 0 && filteredCities.length > 0 ? (
        <div>
          <div className="text-xs font-semibold text-[#717171] uppercase tracking-wider mb-2">
            Matching Locations
          </div>
          <div className="space-y-1">
            {filteredCities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onChange(city);
                  onSelect(city);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#222222]">
                    {city}
                  </div>
                  <div className="text-xs text-[#717171]">Verified destination</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Suggested Destinations Grid */
        <div>
          <div className="text-xs font-semibold text-[#717171] uppercase tracking-wider mb-3">
            Search by region or city
          </div>
          <div className="grid grid-cols-2 gap-2">
            {REGION_SUGGESTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    const target = item.name === "I'm flexible" ? "" : item.name;
                    onChange(target);
                    onSelect(target);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-800 text-left transition-all hover:bg-neutral-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-[#222222] truncate">
                      {item.name}
                    </div>
                    <div
                      className="text-[10px] text-[#717171] truncate"
                      dangerouslySetInnerHTML={{ __html: item.label }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
