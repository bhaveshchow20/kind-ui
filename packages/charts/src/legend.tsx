"use client";

import * as motion from "motion/react-m";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Symbols } from "recharts";
import { useInteractionOpacity } from "./animation.js";
import { useChart } from "./chart-context.js";
import { useChartInteraction } from "./chart-interaction.js";
import { useEmphasis } from "./emphasis.js";
import { FillPatternSwatch } from "./fill-pattern.js";
import { colorBaseToken, colorStopToken } from "./series-color.js";
import { cn } from "./utils.js";

export const legendClassName = "flex flex-wrap gap-2 list-none mx-0 mt-1 mb-2 p-0";
export const legendButtonClassName =
  "inline-flex items-center gap-1.5 border border-solid border-[color:var(--border,currentColor)] rounded-[var(--radius,6px)] bg-[color:var(--muted,transparent)] text-inherit min-h-6 py-[3px] px-1.5 font-[family-name:inherit] text-[11px] leading-4 cursor-pointer data-[inactive=true]:text-[color:var(--muted-foreground,GrayText)] data-[inactive=true]:no-underline data-[inactive=true]:[&_[data-fill-pattern]]:opacity-50";

export type LegendProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  /** Use the existing square color swatch instead of configured icons or symbols. */
  hideIcon?: boolean;
  /** Explicit series emphasis; visibility click behavior remains controlled by chart. */
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
      className={cn(legendClassName, props.className)}
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
        const inactive =
          !visible || (interaction.selected !== null && interaction.selected !== key);
        const marker =
          item.icon && !hideIcon ? (
            <span
              aria-hidden="true"
              data-kind-ui="chart-icon"
              className="inline-flex shrink-0 items-center [&>svg]:w-[12px] [&>svg]:h-[12px]"
            >
              <item.icon />
            </span>
          ) : item.legendShape && !hideIcon ? (
            <svg
              aria-hidden="true"
              focusable="false"
              data-kind-ui="chart-indicator"
              data-legend-shape={item.legendShape}
              className="inline-block shrink-0 size-3 bg-none fill-current"
              viewBox="-8 -8 16 16"
              style={{ fill: inactive ? undefined : paints[key] }}
            >
              <Symbols type={item.legendShape} cx={0} cy={0} size={64} />
            </svg>
          ) : item.pattern && !hideIcon ? (
            <FillPatternSwatch pattern={item.pattern} color={`var(${colorBaseToken(key)})`} />
          ) : (
            <span
              aria-hidden="true"
              data-kind-ui="chart-indicator"
              className="inline-block shrink-0 size-2 bg-current"
              style={{
                background: inactive ? undefined : `var(${colorStopToken(key, "gradient")})`,
              }}
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
            enabled={
              emphasis === "series" &&
              visible &&
              interaction.eligible.includes(key) &&
              (interaction.selected === null || interaction.selected === key)
            }
            inactive={inactive}
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
                className={legendButtonClassName}
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

export function LegendItem({
  seriesKey,
  enabled,
  interactive,
  inactive,
  children,
}: {
  seriesKey: string;
  enabled: boolean;
  interactive: boolean;
  inactive: boolean;
  children: ReactNode;
}) {
  const emphasis = useEmphasis(
    { kind: "series", key: seriesKey, scope: "legend", seriesKey },
    enabled,
  );
  const opacity = useInteractionOpacity(inactive ? 0.28 : 1);
  return (
    <motion.li
      initial={false}
      style={{ opacity }}
      className="[&>span]:inline-flex [&>span]:items-center [&>span]:gap-1 [&>span]:py-[2px] [&>span]:px-0 [&>span]:text-[11px] [&>span]:leading-4"
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
    </motion.li>
  );
}
