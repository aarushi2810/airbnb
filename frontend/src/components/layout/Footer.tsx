"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";
import { ComingSoonModal } from "../ui/ComingSoonModal";

export function Footer() {
  const [comingSoonModal, setComingSoonModal] = useState<string | null>(null);

  const openComingSoon = (feature: string) => {
    setComingSoonModal(feature);
  };

  return (
    <>
      <footer className="w-full border-t border-[#DDDDDD] bg-[#F7F7F7] mt-auto select-none pb-20 md:pb-0">
        <div className="airbnb-container py-12">
          {/* Three Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-neutral-200 text-xs">
            {/* Column 1: Support */}
            <div className="space-y-3.5">
              <h4 className="font-semibold text-sm text-[#222222]">Support</h4>
              <ul className="space-y-3 text-[#222222]">
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Help Centre
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    AirCover
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Anti-discrimination
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Disability support
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Cancellation options
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Report neighbourhood concern
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Hosting */}
            <div className="space-y-3.5">
              <h4 className="font-semibold text-sm text-[#222222]">Hosting</h4>
              <ul className="space-y-3 text-[#222222]">
                <li>
                  <Link href="/host/dashboard" className="hover:underline">
                    Airbnb your home
                  </Link>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    AirCover for Hosts
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Hosting resources
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Community forum
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Hosting responsibly
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("help")} className="hover:underline">
                    Join a free hosting class
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Airbnb */}
            <div className="space-y-3.5">
              <h4 className="font-semibold text-sm text-[#222222]">Airbnb</h4>
              <ul className="space-y-3 text-[#222222]">
                <li>
                  <button onClick={() => openComingSoon("newsroom")} className="hover:underline">
                    Newsroom
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("release")} className="hover:underline">
                    2026 Summer Release
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("careers")} className="hover:underline">
                    Careers
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("investors")} className="hover:underline">
                    Investors
                  </button>
                </li>
                <li>
                  <button onClick={() => openComingSoon("emergency")} className="hover:underline">
                    Airbnb.org emergency stays
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-6 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-[#222222]">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 text-[#717171]">
              <span>&copy; 2026 Airbnb, Inc.</span>
              <span>&bull;</span>
              <Link href="/coming-soon?feature=privacy" className="hover:underline">Privacy</Link>
              <span>&bull;</span>
              <Link href="/coming-soon?feature=terms" className="hover:underline">Terms</Link>
              <span>&bull;</span>
              <Link href="/coming-soon?feature=sitemap" className="hover:underline">Sitemap</Link>
              <span>&bull;</span>
              <Link href="/coming-soon?feature=company" className="hover:underline">Company details</Link>
            </div>

            <div className="flex items-center gap-6 font-semibold">
              <button
                type="button"
                onClick={() => openComingSoon("globe")}
                className="flex items-center gap-2 hover:underline"
              >
                <Globe className="w-4 h-4" />
                <span>English (IN)</span>
              </button>

              <button
                type="button"
                onClick={() => openComingSoon("globe")}
                className="hover:underline"
              >
                <span>₹ INR</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Coming Soon Modal */}
      <ComingSoonModal
        isOpen={Boolean(comingSoonModal)}
        onClose={() => setComingSoonModal(null)}
        feature={comingSoonModal || "help"}
      />
    </>
  );
}
