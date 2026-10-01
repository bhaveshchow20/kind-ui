"use client";

import type { ComponentPropsWithRef, CSSProperties } from "react";
import { useChart } from "./chart-context.js";

export type LegendProps = Omit<ComponentPropsWithRef<"ul">, "children">;

/** Displays configured series; becomes interactive only when a controlled change callback exists. */
export function Legend(props: LegendProps) {
  const { config, visibleSeries, onVisibleSeriesChange } = useChart();
  return (
    <ul aria-label="Chart legend" {...props} data-kind-ui="chart-legend">
      {Object.entries(config).map(([key, item]) => {
        const visible = visibleSeries?.includes(key) ?? true;
        const content = (
          <>
            <span
              aria-hidden="true"
              data-kind-ui="chart-indicator"
              style={{ "--kind-ui-chart-indicator-color": `var(--color-${key})` } as CSSProperties}
            />
            {item.label}
          </>
        );
        return (
          <li key={key} data-kind-ui="chart-legend-item" data-series={key}>
            {onVisibleSeriesChange && visibleSeries ? (
              <button
                type="button"
                aria-pressed={visible}
                data-kind-ui="chart-legend-button"
                onClick={() =>
                  onVisibleSeriesChange(
                    visible
                      ? visibleSeries.filter((value) => value !== key)
                      : [...visibleSeries, key],
                  )
                }
              >
                {content}
              </button>
            ) : (
              <span>
                {content}
                {visible ? null : " (hidden)"}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
