"use client";

import React from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, isBefore, startOfToday } from "date-fns";

interface DateRangePickerProps {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  onClose?: () => void;
}

export function DateRangePicker({
  range,
  onChange,
  onClose,
}: DateRangePickerProps) {
  const today = startOfToday();

  return (
    <div className="p-6 bg-white select-none">
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-semibold text-[#222222]">
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, "MMM d")} &ndash; {format(range.to, "MMM d, yyyy")}
                </>
              ) : (
                <>Select checkout date</>
              )
            ) : (
              <>Select dates</>
            )}
          </h3>
          <p className="text-xs text-[#717171]">
            Minimum stay is 1 night &bull; Add your travel dates for exact pricing
          </p>
        </div>

        {range?.from && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs font-semibold text-[#222222] underline hover:text-black py-1 px-2 rounded-md hover:bg-neutral-100 transition-colors"
          >
            Clear dates
          </button>
        )}
      </div>

      <div className="airbnb-calendar flex justify-center">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={onChange}
          numberOfMonths={2}
          disabled={(date) => isBefore(date, today)}
          classNames={{
            months: "flex flex-col md:flex-row gap-8",
            month: "space-y-4",
            month_caption: "flex justify-center pt-1 relative items-center font-semibold text-sm text-[#222222]",
            caption_label: "text-sm font-semibold text-[#222222]",
            nav: "space-x-1 flex items-center",
            button_previous: "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600",
            button_next: "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-600",
            month_grid: "w-full border-collapse space-y-1",
            weekdays: "flex",
            weekday: "text-neutral-400 rounded-md w-10 font-normal text-[0.8rem] text-center",
            week: "flex w-full mt-2",
            day: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day_button: "h-10 w-10 p-0 font-medium rounded-full hover:bg-neutral-100 transition-colors flex items-center justify-center text-[#222222]",
            selected: "bg-[#222222] text-white hover:bg-black font-semibold",
            range_start: "rounded-l-full bg-[#222222] text-white",
            range_end: "rounded-r-full bg-[#222222] text-white",
            range_middle: "bg-[#F7F7F7] text-[#222222] rounded-none hover:bg-neutral-200",
            today: "underline font-bold",
            disabled: "text-neutral-300 line-through cursor-not-allowed hover:bg-transparent pointer-events-none",
            outside: "opacity-0 pointer-events-none",
          }}
        />
      </div>

      {onClose && (
        <div className="flex justify-end pt-4 mt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-[#222222] text-white rounded-full hover:bg-black transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
