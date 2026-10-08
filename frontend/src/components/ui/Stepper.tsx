"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

interface StepperProps {
  title: string;
  subtitle?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  className?: string;
}

export function Stepper({
  title,
  subtitle,
  value,
  min = 0,
  max = 16,
  onChange,
  className,
}: StepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div className={cn("flex items-center justify-between py-4", className)}>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-[#222222]">{title}</span>
        {subtitle && (
          <span className="text-xs text-[#717171]">{subtitle}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => canDecrease && onChange(value - 1)}
          disabled={!canDecrease}
          aria-label={`Decrease ${title}`}
          className="w-8 h-8 rounded-full border border-neutral-300 hover:border-neutral-800 text-neutral-600 hover:text-black flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span className="w-6 text-center text-sm font-semibold text-[#222222]">
          {value}
        </span>

        <button
          type="button"
          onClick={() => canIncrease && onChange(value + 1)}
          disabled={!canIncrease}
          aria-label={`Increase ${title}`}
          className="w-8 h-8 rounded-full border border-neutral-300 hover:border-neutral-800 text-neutral-600 hover:text-black flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
