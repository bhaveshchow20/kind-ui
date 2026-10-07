import type { SeriesConfig } from "./types.js";

/** Presentation only: never rewrite metadata identity, paint or consumer data. */
export function resolveSeriesLabel(key: string, label?: string): string {
  if (label !== undefined) return label;
  const words = key
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export type ResolvedSeriesConfig = Readonly<
  Record<string, SeriesConfig[string] & { label: string }>
>;

export function resolveSeriesConfig(config: SeriesConfig): ResolvedSeriesConfig {
  return Object.fromEntries(
    Object.entries(config).map(([key, item]) => [
      key,
      { ...item, label: resolveSeriesLabel(key, item.label) },
    ]),
  );
}
