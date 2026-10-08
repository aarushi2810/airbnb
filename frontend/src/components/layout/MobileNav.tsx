"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, Luggage, User as UserIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { openLoginModal, currentUser } = useAuth();

  const NAV_ITEMS = [
    { label: "Explore", href: "/", icon: Compass },
    { label: "Wishlists", href: "/wishlists", icon: Heart },
    { label: "Trips", href: "/trips", icon: Luggage },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#DDDDDD] px-6 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-1 transition-colors",
                isActive ? "text-[#FF385C]" : "text-[#717171] hover:text-[#222222]"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Profile / Switch User Button */}
        <button
          type="button"
          onClick={openLoginModal}
          className="flex flex-col items-center gap-1 py-1 text-[#717171] hover:text-[#222222] transition-colors"
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-medium">
            {currentUser ? currentUser.name.split(" ")[0] : "Log in"}
          </span>
        </button>
      </div>
    </nav>
  );
}
