"use client";

import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";
import { useChart } from "./chart-context.js";

export type LegendProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  /** Use the existing color swatch instead of configured icons. */
  hideIcon?: boolean;
  /** Compose each item's noninteractive content; Kind retains list/button/state ownership. */
  children?: (item: {
    key: string;
    label: string;
    visible: boolean;
    marker: ReactNode;
  }) => ReactNode;
};

/** Displays configured series; becomes interactive only when a controlled change callback exists. */
export function Legend({ hideIcon = false, children, ...props }: LegendProps) {
  const { config, visibleSeries, onVisibleSeriesChange } = useChart();
  return (
    <ul aria-label="Chart legend" {...props} data-kind-ui="chart-legend">
      {Object.entries(config).map(([key, item]) => {
        const visible = visibleSeries?.includes(key) ?? true;
        const marker =
          item.icon && !hideIcon ? (
            <span aria-hidden="true" data-kind-ui="chart-icon">
              <item.icon />
            </span>
          ) : (
            <span
              aria-hidden="true"
              data-kind-ui="chart-indicator"
              style={{ "--kind-ui-chart-indicator-color": `var(--color-${key})` } as CSSProperties}
            />
          );
        const content = children ? (
          children({ key, label: item.label, visible, marker })
        ) : (
          <>
            {marker}
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
