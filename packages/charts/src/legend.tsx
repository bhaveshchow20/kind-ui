"use client";

import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";
import { Symbols } from "recharts";
import { useChart } from "./chart-context.js";
import { useChartInteraction } from "./chart-interaction.js";
import { useEmphasis } from "./emphasis.js";
import { FillPatternSwatch } from "./fill-pattern.js";
import { colorStopToken } from "./series-color.js";

export type LegendProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  /** Use the existing square color swatch instead of configured icons or symbols. */
  hideIcon?: boolean;
  /** Explicit series emphasis; visibility click behavior remains controlled by Root. */
  emphasis?: "none" | "series";
  /** Compose each item's noninteractive content; Kind retains list/button/state ownership. */
  children?: (item: {
    key: string;
    label: string;
    visible: boolean;
    selected: boolean;
    mode: "visibility" | "focus";
    marker: ReactNode;
  }) => ReactNode;
};

/** Configured items focus independently; explicit visibility mode opts into hide/show. */
export function Legend({ hideIcon = false, emphasis = "series", children, ...props }: LegendProps) {
  const { config, paints, visibleSeries } = useChart();
  const interaction = useChartInteraction();
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Delegates clicks from native buttons, which already implement Enter and Space.
    <ul
      aria-label="Chart legend"
      {...props}
      data-kind-ui="chart-legend"
      onClick={(event) => {
        props.onClick?.(event);
        const button = (event.target as Element).closest<HTMLButtonElement>(
          "button[data-legend-key]",
        );
        if (button?.dataset.legendKey !== undefined && event.currentTarget.contains(button))
          interaction.activate(
            { kind: interaction.kind, key: button.dataset.legendKey },
            "legend",
            event,
          );
      }}
    >
      {Object.entries(config).map(([key, item]) => {
        const visible = visibleSeries?.includes(key) ?? true;
        const marker =
          item.icon && !hideIcon ? (
            <span aria-hidden="true" data-kind-ui="chart-icon">
              <item.icon />
            </span>
          ) : item.legendShape && !hideIcon ? (
            <svg
              aria-hidden="true"
              focusable="false"
              data-kind-ui="chart-indicator"
              data-legend-shape={item.legendShape}
              viewBox="-8 -8 16 16"
              style={
                {
                  "--kind-ui-chart-indicator-color": paints[key],
                } as CSSProperties
              }
            >
              <Symbols type={item.legendShape} cx={0} cy={0} size={64} />
            </svg>
          ) : item.pattern && !hideIcon ? (
            <FillPatternSwatch pattern={item.pattern} color={`var(--color-${key})`} />
          ) : (
            <span
              aria-hidden="true"
              data-kind-ui="chart-indicator"
              style={
                {
                  "--kind-ui-chart-indicator-color": `var(--color-${key})`,
                  "--kind-ui-chart-indicator-background": `var(${colorStopToken(key, "gradient")})`,
                } as CSSProperties
              }
            />
          );
        const content = children ? (
          children({
            key,
            label: item.label,
            visible,
            marker,
            selected: interaction.selected === key,
            mode: interaction.mode,
          })
        ) : (
          <>
            {marker}
            {item.label}
          </>
        );
        return (
          <LegendItem
            key={key}
            seriesKey={key}
            enabled={emphasis === "series" && visible && interaction.eligible.includes(key)}
            interactive={interaction.interactive && interaction.eligible.includes(key)}
          >
            {interaction.interactive && interaction.eligible.includes(key) ? (
              <button
                type="button"
                aria-pressed={interaction.mode === "focus" ? interaction.selected === key : visible}
                data-inactive={
                  !visible || (interaction.selected !== null && interaction.selected !== key)
                    ? "true"
                    : undefined
                }
                data-kind-ui="chart-legend-button"
                data-legend-key={key}
              >
                {content}
              </button>
            ) : (
              <span>
                {content}
                {visible ? null : " (hidden)"}
              </span>
            )}
          </LegendItem>
        );
      })}
    </ul>
  );
}

function LegendItem({
  seriesKey,
  enabled,
  interactive,
  children,
}: {
  seriesKey: string;
  enabled: boolean;
  interactive: boolean;
  children: ReactNode;
}) {
  const emphasis = useEmphasis(
    { kind: "series", key: seriesKey, scope: "legend", seriesKey },
    enabled,
  );
  return (
    <li
      data-kind-ui="chart-legend-item"
      data-series={seriesKey}
      tabIndex={enabled && !interactive ? 0 : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") emphasis.enter("pointer");
      }}
      onPointerLeave={() => emphasis.leave("pointer")}
      onPointerCancel={() => emphasis.leave("pointer")}
      onFocus={(event) => {
        if ((event.target as Element).matches(":focus-visible")) emphasis.enter("keyboard");
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          emphasis.leave("keyboard");
      }}
    >
      {children}
    </li>
  );
}
