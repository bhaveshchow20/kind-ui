"use client";

import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";
import type { SankeyNodeConfig } from "./sankey-colors.js";

export type SankeyLegendProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  /** Share this explicit reference with SankeyChart.nodeConfig. Config order owns legend order. */
  config: SankeyNodeConfig;
  children?: (item: { key: string; label: string; color: string; marker: ReactNode }) => ReactNode;
};

/** Node identity legend; solid links inherit source color, gradient links use both endpoints. */
export function SankeyLegend({ config, children, ...props }: SankeyLegendProps) {
  return (
    <ul aria-label="Chart legend" {...props} data-kind-ui="chart-legend">
      {Object.entries(config).map(([key, item]) => {
        const marker = (
          <span
            aria-hidden="true"
            data-kind-ui="chart-indicator"
            style={{ "--kind-ui-chart-indicator-color": item.color } as CSSProperties}
          />
        );
        return (
          <li key={key} data-kind-ui="chart-legend-item" data-node={key}>
            <span>
              {children ? (
                children({ key, label: item.label, color: item.color, marker })
              ) : (
                <>
                  {marker}
                  {item.label}
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
