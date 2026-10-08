"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import { X, Check, ShieldCheck, User as UserIcon } from "lucide-react";
import type { User, UserRole } from "../types";
import { api, registerUserIdGetter } from "../lib/api";
import { STORAGE_KEYS, DEFAULT_USER_ID } from "../lib/constants";

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  role: UserRole;
  isHostMode: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  switchUser: (userId: number) => Promise<void>;
  toggleHostMode: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isHostMode, setIsHostMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Sync API client with current user ID
  useEffect(() => {
    registerUserIdGetter(() => currentUser?.id ?? null);
  }, [currentUser]);

  // Load all available mock users and active user
  useEffect(() => {
    let isMounted = true;

    api.users
      .list()
      .then((userList) => {
        if (!isMounted) return;
        setUsers(userList);

        const savedUserId =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEYS.USER_ID)
            : null;
        const targetId = savedUserId ? parseInt(savedUserId, 10) : DEFAULT_USER_ID;

        const matched = userList.find((u) => u.id === targetId) || userList[0] || null;
        if (matched) {
          setCurrentUser(matched);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEYS.USER_ID, matched.id.toString());
          }
        }

        const savedHostMode =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEYS.HOST_MODE) === "true"
            : false;
        setIsHostMode(savedHostMode);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to initialize mock authentication:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const switchUser = useCallback(
    async (userId: number) => {
      const selected = users.find((u) => u.id === userId);
      if (selected) {
        setCurrentUser(selected);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.USER_ID, selected.id.toString());
        }
        setIsLoginModalOpen(false);
      }
    },
    [users]
  );

  const toggleHostMode = useCallback(() => {
    setIsHostMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.HOST_MODE, next.toString());
      }
      return next;
    });
  }, []);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const role: UserRole = currentUser?.role ?? "guest";

  const value = useMemo(
    () => ({
      currentUser,
      users,
      role,
      isHostMode,
      isLoading,
      isLoginModalOpen,
      switchUser,
      toggleHostMode,
      openLoginModal,
      closeLoginModal,
    }),
    [
      currentUser,
      users,
      role,
      isHostMode,
      isLoading,
      isLoginModalOpen,
      switchUser,
      toggleHostMode,
      openLoginModal,
      closeLoginModal,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* "Login as..." Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-[#222222]">
                Switch Mock User
              </h2>
              <button
                onClick={closeLoginModal}
                className="p-1 rounded-full hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-900"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-2">
              <p className="text-sm text-[#717171] mb-4">
                Select a user to test roles, host workflows, permissions, and wishlists.
              </p>

              {users.map((u) => {
                const isSelected = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#222222] bg-neutral-50 ring-1 ring-[#222222]"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                        {u.avatar_url ? (
                          <Image
                            src={u.avatar_url}
                            alt={u.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <UserIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-[#222222]">
                          <span>{u.name}</span>
                          {u.is_superhost && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#E31C5F] bg-rose-50 px-1.5 py-0.5 rounded-md">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Superhost
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#717171] capitalize">
                          {u.role} &bull; {u.email}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#222222] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
