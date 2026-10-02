"use client";

import type { ComponentPropsWithRef } from "react";
import type { ChartContextValue } from "./chart-context.js";
import { ChartContext } from "./chart-context.js";
import { EmphasisProvider, useEmphasisActions } from "./emphasis.js";
import type { SeriesConfig } from "./types.js";

export type RootProps = ComponentPropsWithRef<"div"> & {
  config: SeriesConfig;
  emphasis?: "auto" | "none";
} & (
    | { visibleSeries?: undefined; onVisibleSeriesChange?: never }
    | { visibleSeries: readonly string[]; onVisibleSeriesChange?: (next: string[]) => void }
  );

/** Scopes presentation metadata and CSS colors; the consumer owns chart geometry and state. */
export function Root({
  config,
  emphasis = "auto",
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
      <EmphasisProvider enabled={emphasis === "auto"}>
        <RootFrame {...props} style={{ ...colors, ...style }}>
          {children}
        </RootFrame>
      </EmphasisProvider>
    </ChartContext>
  );
}

function RootFrame({ children, ...props }: ComponentPropsWithRef<"div">) {
  const { reset } = useEmphasisActions();
  return (
    <div
      {...props}
      data-kind-ui="chart"
      onKeyDownCapture={(event) => {
        if (event.key === "Escape") reset();
        props.onKeyDownCapture?.(event);
      }}
    >
      {children}
    </div>
  );
}
