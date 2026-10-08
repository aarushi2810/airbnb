"use client";

import React, { useState } from "react";
import Image from "next/image";
import { User as UserIcon, ShieldCheck } from "lucide-react";
import { cn } from "../../lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isSuperhost?: boolean;
  className?: string;
}

export function Avatar({
  src,
  alt = "User avatar",
  size = "md",
  isSuperhost = false,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const iconSizes = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-10 h-10",
  };

  return (
    <div className={cn("relative inline-block shrink-0", className)}>
      <div
        className={cn(
          "relative rounded-full overflow-hidden bg-neutral-200 border border-neutral-200/80",
          sizeClasses[size]
        )}
      >
        {src && !imgError ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500 bg-neutral-100">
            <UserIcon className={iconSizes[size]} />
          </div>
        )}
      </div>

      {isSuperhost && (
        <span
          className="absolute -bottom-1 -right-1 bg-[#E31C5F] text-white p-0.5 rounded-full shadow-xs ring-2 ring-white"
          title="Superhost"
        >
          <ShieldCheck className="w-3 h-3" />
        </span>
      )}
    </div>
  );
}
