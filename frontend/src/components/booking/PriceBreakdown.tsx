"use client";

/**
 * PriceBreakdown.tsx
 *
 * Detailed price calculation component matching Airbnb's pricing formula:
 *  - Base nights calculation: rate x nights
 *  - Cleaning fee (fixed listing fee)
 *  - Airbnb service fee (14% of base subtotal)
 *  - Total before taxes
 */

import React from "react";
import { formatPrice } from "../../lib/utils";
import { HelpCircle } from "lucide-react";

interface PriceBreakdownProps {
  nightlyRate: number;
  nights: number;
  cleaningFee: number;
  currency?: string;
  className?: string;
}

export function PriceBreakdown({
  nightlyRate,
  nights,
  cleaningFee,
  currency = "INR",
  className = "",
}: PriceBreakdownProps) {
  const subtotal = nightlyRate * nights;
  const serviceFee = Math.round(subtotal * 0.14);
  const total = subtotal + cleaningFee + serviceFee;

  return (
    <div className={`space-y-3 pt-4 text-sm text-[#222222] ${className}`}>
      {/* Subtotal line */}
      <div className="flex justify-between items-center">
        <span className="underline decoration-neutral-300 underline-offset-2">
          {formatPrice(nightlyRate, currency)} x {nights} night
          {nights !== 1 ? "s" : ""}
        </span>
        <span>{formatPrice(subtotal, currency)}</span>
      </div>

      {/* Cleaning fee */}
      {cleaningFee > 0 && (
        <div className="flex justify-between items-center">
          <span className="underline decoration-neutral-300 underline-offset-2">
            Cleaning fee
          </span>
          <span>{formatPrice(cleaningFee, currency)}</span>
        </div>
      )}

      {/* Airbnb service fee */}
      <div className="flex justify-between items-center group relative">
        <div className="flex items-center gap-1.5 underline decoration-neutral-300 underline-offset-2">
          <span>Airbnb service fee</span>
          <HelpCircle className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
        </div>
        <span>{formatPrice(serviceFee, currency)}</span>
      </div>

      {/* Total line */}
      <div className="border-t border-neutral-200 pt-3 flex justify-between items-center font-bold text-base text-[#222222]">
        <span>Total before taxes</span>
        <span>{formatPrice(total, currency)}</span>
      </div>
    </div>
  );
}
