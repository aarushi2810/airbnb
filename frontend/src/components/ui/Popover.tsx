"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}

export function Popover({
  isOpen,
  onClose,
  children,
  className,
  align = "left",
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div
      ref={popoverRef}
      className={cn(
        "absolute top-full mt-3 z-50 bg-white rounded-3xl border border-neutral-200/80 shadow-dropdown overflow-hidden animate-in fade-in zoom-in-95 duration-150",
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
