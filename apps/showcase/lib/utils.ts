import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Require a complete entry in the maintained demo's parallel data or palette. */
export function demoEntry<T>(entries: readonly T[], index: number): T {
  const entry = entries[index];
  if (entry === undefined) throw new Error(`Missing demo entry at index ${index}`);
  return entry;
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
