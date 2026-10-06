"use client";

import { type ReactNode, use, useId } from "react";
import { ChartContext } from "./chart-context.js";
import { colorResourceId, colorStopToken } from "./series-color.js";

/** Each native SVG owns its viewport-relative resources; metadata stays Root-owned. */
export function SeriesPaintBoundary({ children }: { children: ReactNode }) {
  const chart = use(ChartContext);
  const colorId = useId();
  if (!chart) return children;
  const paints = Object.fromEntries(
    Object.entries(chart.colorStops).map(([key, stops]) => [
      key,
      stops.colors.length > 1 ? `url(#${colorResourceId(colorId, key)})` : `var(--color-${key})`,
    ]),
  );
  return <ChartContext value={{ ...chart, colorId, paints }}>{children}</ChartContext>;
}

export function SeriesColorDefinitions({ viewport = false }: { viewport?: boolean }) {
  const chart = use(ChartContext);
  if (!chart) return null;
  return (
    <defs data-kind-ui="series-color-definitions">
      {Object.entries(chart.colorStops)
        .filter(([, stops]) => stops.colors.length > 1)
        .map(([key, stops]) => (
          <linearGradient
            key={key}
            id={colorResourceId(chart.colorId, key)}
            x1="0"
            y1="0"
            x2={viewport ? "100%" : "1"}
            y2="0"
            gradientUnits={viewport ? "userSpaceOnUse" : "objectBoundingBox"}
          >
            {stops.offsets.map((offset, index) => (
              <stop key={offset} offset={offset} stopColor={`var(${colorStopToken(key, index)})`} />
            ))}
          </linearGradient>
        ))}
    </defs>
  );
}
