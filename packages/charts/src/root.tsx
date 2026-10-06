"use client";

import { type ComponentPropsWithRef, useId } from "react";
import type { ChartContextValue } from "./chart-context.js";
import { ChartContext } from "./chart-context.js";
import { EmphasisProvider, useEmphasisActions } from "./emphasis.js";
import {
  type ColorStops,
  colorResourceId,
  colorStopToken,
  resolveSeriesColor,
} from "./series-color.js";
import { resolveSeriesConfig } from "./series-label.js";
import { SeriesColorDefinitions } from "./series-paint.js";
import { StylesheetWarning } from "./stylesheet-warning.js";
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
  const id = useId();
  const colors: Record<string, string> = {};
  const paints: Record<string, string> = {};
  const colorStops: Record<string, ColorStops> = {};
  for (const [key, item] of Object.entries(config)) {
    if (!/^[a-zA-Z][\w-]*$/.test(key))
      throw new Error(
        `Chart series key "${key}" must start with a letter and contain only letters, numbers, underscores or hyphens`,
      );
    const resolved = resolveSeriesColor(item.color);
    colors[`--color-${key}`] = resolved.colors[0]!;
    for (const [index, color] of resolved.colors.entries())
      colors[colorStopToken(key, index)] = color;
    colorStops[key] = resolved;
    const gradientId = colorResourceId(id, key);
    const gradient = resolved.colors.length > 1;
    paints[key] = gradient ? `url(#${gradientId})` : `var(--color-${key})`;
    colors[colorStopToken(key, "gradient")] = gradient
      ? `linear-gradient(to right in srgb, ${resolved.offsets.map((offset, index) => `var(${colorStopToken(key, index)}) ${offset * 100}%`).join(", ")})`
      : `var(--color-${key})`;
  }
  const value: ChartContextValue = {
    config: resolveSeriesConfig(config),
    paints,
    colorId: id,
    colorStops,
    ...(visibleSeries ? { visibleSeries } : {}),
    ...(onVisibleSeriesChange ? { onVisibleSeriesChange } : {}),
  };
  return (
    <ChartContext value={value}>
      <EmphasisProvider enabled={emphasis === "auto"}>
        <RootFrame {...props} style={{ ...colors, ...style }}>
          {process.env.NODE_ENV === "development" && <StylesheetWarning />}
          {Object.values(colorStops).some((stops) => stops.colors.length > 1) && (
            <svg
              aria-hidden="true"
              focusable="false"
              width={0}
              height={0}
              style={{ position: "absolute" }}
              data-kind-ui="color-resources"
            >
              <SeriesColorDefinitions />
            </svg>
          )}
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
