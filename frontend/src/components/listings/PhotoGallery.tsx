"use client";

/**
 * PhotoGallery.tsx
 *
 * Pixel-faithful Airbnb photo showcase:
 *  - Desktop (lg+): 5-photo mosaic grid.
 *    - Left image: 50% width, full height, rounded left corners.
 *    - Right grid: 2x2 grid of 4 smaller photos, rounded right corners.
 *    - Subtle hover brightness dim effect.
 *    - "Show all photos" pill button bottom-right with grid icon.
 *  - Mobile/tablet (< lg): Single-image carousel with swipe / arrows
 *    and photo counter badge (e.g. "1 / 5").
 *  - Fullscreen Modal Gallery:
 *    - Vertical scroll feed of all photos in high resolution.
 *    - Sticky header with Close (X) button, Share, Save.
 *    - Photo index counters.
 *    - Keyboard Escape key closes modal.
 */

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Grid, X, ChevronLeft, ChevronRight, Share2, Heart } from "lucide-react";
import type { ListingImage } from "../../types";

interface PhotoGalleryProps {
  images: ListingImage[];
  title: string;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onShare?: () => void;
}

export function PhotoGallery({
  images,
  title,
  isWishlisted,
  onToggleWishlist,
  onShare,
}: PhotoGalleryProps) {
  const [showAllModal, setShowAllModal] = useState(false);
  const [mobileIdx, setMobileIdx] = useState(0);

  // Fallback if images empty
  const photoList =
    images.length > 0
      ? images
      : [
          {
            id: 0,
            url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200",
            position: 0,
          },
        ];

  // First 5 for the mosaic
  const mosaicPhotos = photoList.slice(0, 5);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!showAllModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAllModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showAllModal]);

  const prevMobile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMobileIdx((i) => (i === 0 ? photoList.length - 1 : i - 1));
  };

  const nextMobile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMobileIdx((i) => (i === photoList.length - 1 ? 0 : i + 1));
  };

  return (
    <>
      {/* ── Desktop Mosaic Grid (lg+) ── */}
      <div className="hidden lg:block relative rounded-2xl overflow-hidden mt-6">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] xl:h-[480px]">
          {/* Main Left Image (spans 2 cols, 2 rows) */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden bg-neutral-100"
            onClick={() => setShowAllModal(true)}
          >
            <Image
              src={mosaicPhotos[0]?.url || ""}
              alt={`${title} - Photo 1`}
              fill
              priority
              sizes="(max-width: 1280px) 50vw, 600px"
              className="object-cover group-hover:scale-[1.02] group-hover:brightness-95 transition-all duration-300"
            />
          </div>

          {/* 4 Smaller Right Images */}
          {[1, 2, 3, 4].map((idx) => {
            const photo = mosaicPhotos[idx] || mosaicPhotos[0];
            return (
              <div
                key={idx}
                className="col-span-1 row-span-1 relative cursor-pointer group overflow-hidden bg-neutral-100"
                onClick={() => setShowAllModal(true)}
              >
                <Image
                  src={photo?.url || ""}
                  alt={`${title} - Photo ${idx + 1}`}
                  fill
                  sizes="(max-width: 1280px) 25vw, 300px"
                  className="object-cover group-hover:scale-[1.02] group-hover:brightness-95 transition-all duration-300"
                />
              </div>
            );
          })}
        </div>

        {/* "Show all photos" Button */}
        <button
          onClick={() => setShowAllModal(true)}
          className="absolute bottom-5 right-5 z-10 flex items-center gap-2 px-4 py-2 bg-white/95 hover:bg-white text-[#222222] font-semibold text-sm rounded-lg border border-[#222222] shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <Grid className="w-4 h-4" />
          <span>Show all {photoList.length} photos</span>
        </button>
      </div>

      {/* ── Mobile/Tablet Carousel (< lg) ── */}
      <div className="lg:hidden relative aspect-[4/3] -mx-4 sm:-mx-6 sm:rounded-none overflow-hidden bg-neutral-100">
        <Image
          src={photoList[mobileIdx]?.url || ""}
          alt={`${title} - Photo ${mobileIdx + 1}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Navigation Arrows */}
        {photoList.length > 1 && (
          <>
            <button
              onClick={prevMobile}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md text-neutral-800"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMobile}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md text-neutral-800"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-md bg-black/60 text-white text-xs font-medium tracking-wide">
          {mobileIdx + 1} / {photoList.length}
        </div>
      </div>

      {/* ── Fullscreen Modal Gallery ── */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
          {/* Sticky Modal Header */}
          <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setShowAllModal(false)}
              className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-800"
              aria-label="Close photo gallery"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-sm font-semibold text-neutral-700">
              {photoList.length} photos
            </span>

            <div className="flex items-center gap-2">
              {onShare && (
                <button
                  onClick={onShare}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-800 flex items-center gap-1.5 text-sm font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
              {onToggleWishlist && (
                <button
                  onClick={onToggleWishlist}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-800 flex items-center gap-1.5 text-sm font-medium"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted ? "fill-[#FF385C] text-[#FF385C]" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Photos Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-8 max-w-4xl mx-auto w-full space-y-8">
            {photoList.map((photo, i) => (
              <div key={photo.id || i} className="flex flex-col gap-2">
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] bg-neutral-100 rounded-xl overflow-hidden shadow-sm">
                  <Image
                    src={photo.url}
                    alt={`${title} - Photo ${i + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 896px"
                    className="object-cover"
                  />
                </div>
                {photo.caption && (
                  <p className="text-sm text-neutral-500 italic px-1">
                    {photo.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
