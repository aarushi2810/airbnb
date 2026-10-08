"use client";

/**
 * useRequireAuth.ts
 *
 * Route guard hook:
 *  - Checks if user is currently authenticated.
 *  - If not, triggers the login modal and can optionally redirect.
 *  - Host-mode users are permitted (hosts can book stays as guests).
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

interface UseRequireAuthOptions {
  redirectTo?: string;
  triggerModal?: boolean;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo, triggerModal = true } = options;
  const { currentUser, isLoading, openLoginModal } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      if (triggerModal) {
        openLoginModal();
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [currentUser, isLoading, openLoginModal, redirectTo, router, triggerModal]);

  return {
    currentUser,
    isLoading,
    isAuthenticated: Boolean(currentUser),
  };
}
