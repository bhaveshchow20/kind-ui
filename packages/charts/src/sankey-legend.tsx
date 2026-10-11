"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { useOptionalChartInteraction } from "./chart-interaction.js";
import { LegendItem, legendButtonClassName, legendClassName } from "./legend.js";
import type { SankeyNodeConfig } from "./sankey-colors.js";
import { cn } from "./utils.js";

export type SankeyLegendProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  /** Share this explicit reference with SankeyChart.nodeConfig. Config order owns legend order. */
  config: SankeyNodeConfig;
  interactionBinding?: "root";
  children?: (item: { key: string; label: string; color: string; marker: ReactNode }) => ReactNode;
};

/** Node identity legend; solid links inherit source color, gradient links use both endpoints. */
export function SankeyLegend({
  config,
  interactionBinding,
  children,
  ...props
}: SankeyLegendProps) {
  const interaction = useOptionalChartInteraction();
  if (
    interactionBinding &&
    (!interaction || interaction.kind !== "node" || interaction.mode !== "focus")
  )
    throw new Error("SankeyLegend Root interaction binding requires node focus");
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Delegates clicks from native buttons, which already implement Enter and Space.
    <ul
      aria-label="Chart legend"
      {...props}
      className={cn(legendClassName, props.className)}
      data-kind-ui="chart-legend"
      onClick={(event) => {
        props.onClick?.(event);
        const button = (event.target as Element).closest<HTMLButtonElement>(
          "button[data-node-key]",
        );
        if (
          interactionBinding &&
          button?.dataset.nodeKey !== undefined &&
          event.currentTarget.contains(button)
        )
          interaction?.activate({ kind: "node", key: button.dataset.nodeKey }, "legend", event);
      }}
    >
      {Object.entries(config).map(([key, item]) => {
        const inactive = Boolean(
          interactionBinding && interaction?.selected !== null && interaction?.selected !== key,
        );
        const marker = (
          <span
            key={key}
            aria-hidden="true"
            data-kind-ui="chart-indicator"
            className="inline-block shrink-0 size-2 bg-current"
            style={{ backgroundColor: inactive ? undefined : item.color }}
          />
        );
        const content = children ? (
          children({ key, label: item.label, color: item.color, marker })
        ) : (
          <>
            {marker}
            {item.label}
          </>
        );
        return interactionBinding && interaction ? (
          <LegendItem
            key={key}
            seriesKey={key}
            interactive={interaction.eligible.includes(key)}
            enabled={
              interaction.eligible.includes(key) &&
              (interaction.selected === null || interaction.selected === key)
            }
            inactive={inactive}
          >
            {interaction.eligible.includes(key) ? (
              <button
                type="button"
                aria-pressed={interaction.selected === key}
                className={legendButtonClassName}
                data-node-key={key}
                data-inactive={
                  interaction.selected !== null && interaction.selected !== key ? "true" : undefined
                }
              >
                {content}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 py-[2px] px-0 text-[11px] leading-4">
                {content}
              </span>
            )}
          </LegendItem>
        ) : (
          <li key={key} data-kind-ui="chart-legend-item" data-node={key}>
            <span className="inline-flex items-center gap-1 py-[2px] px-0 text-[11px] leading-4">
              {content}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
