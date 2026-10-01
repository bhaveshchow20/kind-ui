"use client";

import type { ComponentPropsWithRef } from "react";
import type { ChartContextValue } from "./chart-context.js";
import { ChartContext } from "./chart-context.js";
import type { SeriesConfig } from "./types.js";

export type RootProps = ComponentPropsWithRef<"div"> & { config: SeriesConfig } & (
    | { visibleSeries?: undefined; onVisibleSeriesChange?: never }
    | { visibleSeries: readonly string[]; onVisibleSeriesChange?: (next: string[]) => void }
  );

/** Scopes presentation metadata and CSS colors; the consumer owns chart geometry and state. */
export function Root({
  config,
  visibleSeries,
  onVisibleSeriesChange,
  style,
  children,
  ...props
}: RootProps) {
  if (onVisibleSeriesChange && !visibleSeries)
    throw new Error("Root requires visibleSeries when onVisibleSeriesChange is provided");
  const colors: Record<string, string> = {};
  for (const [key, item] of Object.entries(config)) {
    if (!/^[a-zA-Z][\w-]*$/.test(key))
      throw new Error(
        `Chart series key "${key}" must start with a letter and contain only letters, numbers, underscores or hyphens`,
      );
    colors[`--color-${key}`] = item.color;
  }
  const value: ChartContextValue = {
    config,
    ...(visibleSeries ? { visibleSeries } : {}),
    ...(onVisibleSeriesChange ? { onVisibleSeriesChange } : {}),
  };
  return (
    <ChartContext value={value}>
      <div {...props} data-kind-ui="chart" style={{ ...colors, ...style }}>
        {children}
      </div>
    </ChartContext>
  );
}
