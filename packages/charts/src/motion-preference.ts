"use client";

import type { Transition } from "motion/react";
import { useSyncExternalStore } from "react";

export const defaultHover: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };
const query = "(prefers-reduced-motion: reduce)";
const listeners = new Set<() => void>();
let media: MediaQueryList | undefined;
const notify = () => {
  for (const listener of listeners) listener();
};
function subscribe(listener: () => void) {
  if (!listeners.size) {
    media = window.matchMedia(query);
    media.addEventListener("change", notify);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      media?.removeEventListener("change", notify);
      media = undefined;
    }
  };
}
const snapshot = () =>
  typeof window === "undefined" ? true : (media ?? window.matchMedia(query)).matches;
const serverSnapshot = () => true;
/** One browser subscription for entrances, hover motion and loading across families. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
