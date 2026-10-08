"use client";

/**
 * useRequireHost.ts
 *
 * Route guard hook for host pages:
 *  - Checks if user is authenticated. If not, opens login modal.
 *  - Checks if user has 'host' role.
 *  - Exposes isHost, isGuest, currentUser, isLoading.
 */

import { useEffect } from "react";
import { useAuth } from "./useAuth";

export function useRequireHost() {
  const { currentUser, isLoading, openLoginModal } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      openLoginModal();
    }
  }, [currentUser, isLoading, openLoginModal]);

  const isHost = Boolean(currentUser && currentUser.role === "host");
  const isGuest = Boolean(currentUser && currentUser.role === "guest");

  return {
    currentUser,
    isLoading,
    isHost,
    isGuest,
    openLoginModal,
  };
}
