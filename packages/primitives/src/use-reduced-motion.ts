"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
let mediaQuery: MediaQueryList | undefined;
let mediaQueryWindow: Window | undefined;

function getMediaQuery() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
  if (mediaQueryWindow !== window) {
    mediaQueryWindow = window;
    mediaQuery = window.matchMedia(query);
  }
  return mediaQuery;
}

function subscribe(onChange: () => void) {
  const media = getMediaQuery();
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}

function getSnapshot() {
  return getMediaQuery()?.matches ?? true;
}

function getServerSnapshot() {
  return true;
}

/** Follows live preference changes and keeps server-rendered motion conservative. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
