/**
 * Application-wide constants and config tokens.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const STORAGE_KEYS = {
  USER_ID: "airbnb_user_id",
  HOST_MODE: "airbnb_host_mode",
} as const;

export const DEFAULT_USER_ID = 1;

export const AIRBNB_TOKENS = {
  brand: "#FF385C",
  dark: "#E31C5F",
  text: "#222222",
  muted: "#717171",
  border: "#DDDDDD",
  surface: "#F7F7F7",
} as const;
