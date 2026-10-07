"use client";

import { createContext, type ReactNode } from "react";

/** Sankey IDs are arbitrary nonempty strings, independent from Root CSS variable keys. */
export type SankeyNodeConfig = Readonly<
  Record<string, { label: string; color: string; icon?: ReactNode }>
>;
export const SankeyColors = createContext<SankeyNodeConfig | undefined>(undefined);
export function sankeyColor(config: SankeyNodeConfig | undefined, id: string) {
  return config && Object.hasOwn(config, id) ? config[id]?.color : undefined;
}
