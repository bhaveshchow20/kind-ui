"use client";

import { motion } from "motion/react";
import { type ComponentPropsWithRef, type CSSProperties, type ReactNode, use } from "react";
import type { TooltipContentProps as UpstreamTooltipContentProps } from "recharts";
import { useInteractionOpacity } from "./animation.js";
import { useChart } from "./chart-context.js";
import { useChartInteraction } from "./chart-interaction.js";
import { chartClasses } from "./classes.js";
import { LineInteraction } from "./line-chart.js";
import { formatPercent, type NormalizedValue } from "./percent-stack.js";
import { colorStopToken } from "./series-color.js";
import { TooltipNumber } from "./tooltip-number.js";

export type TooltipContentProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** Pass the upstream content callback's props here so engine-only props never reach the DOM. */
  tooltip: UpstreamTooltipContentProps;
  missingValue?: ReactNode;
  /** Formatting-only fraction resolver. Default content retains the raw value alongside it. */
  normalizedValue?: NormalizedValue;
  /** Caller-owned projection status; use the same datum identity selection as BarSeries. */
  isProjected?: (entry: UpstreamTooltipContentProps["payload"][number]) => boolean;
  /** Accessible status text appended to projected items. */
  projectedLabel?: ReactNode;
  /** Opt in to decorative rolling digits for finite numeric text values. Default: off. */
  valueAnimation?: "shuffle";
  /** Omit the heading; series labels and values remain accessible. */
  hideLabel?: boolean;
  /** Omit the decorative marker, including a configured icon. */
  hideIndicator?: boolean;
  /** Defaults to the existing slim line marker. Configured icons take precedence. */
  indicator?: "dot" | "line" | "dashed";
  /** Stable metadata/visibility identity for an item, e.g. a pie category payload ID. */
  itemKey?: (entry: UpstreamTooltipContentProps["payload"][number]) => string;
};

/** Default tooltip UI using the containing chart's labels, formats, colors and visibility. */
export function TooltipContent({
  tooltip,
  missingValue = "No data",
  normalizedValue,
  isProjected,
  projectedLabel = "Projected",
  valueAnimation,
  itemKey,
  hideLabel = false,
  hideIndicator = false,
  indicator = "line",
  ...props
}: TooltipContentProps) {
  const { config, visibleSeries } = useChart();
  const interaction = useChartInteraction();
  const line = use(LineInteraction);
  const identity = (entry: UpstreamTooltipContentProps["payload"][number]) =>
    itemKey?.(entry) ??
    (entry.graphicalItemId
      ? line?.categoryKeys.get(entry.graphicalItemId)?.(Number(tooltip.activeIndex))
      : undefined) ??
    (entry.graphicalItemId ? line?.seriesKeys.get(entry.graphicalItemId) : undefined) ??
    String(entry.dataKey ?? entry.name);
  const { active, payload, label, formatter, labelFormatter, accessibilityLayer } = tooltip;
  const entries = active ? payload.filter((item) => item.type !== "none") : [];
  if (!entries.some((entry) => entry.value != null)) return null;
  let hasVisibleValue = false;
  const items = entries.map((entry, index) => {
    const key = identity(entry);
    const item = Object.hasOwn(config, key) ? config[key] : undefined;
    const projected = entry.payload != null && isProjected?.(entry) === true;
    let name: ReactNode = item?.label ?? entry.name ?? key;
    let value: ReactNode = missingValue;
    if (entry.value != null) {
      const format = entry.formatter ?? formatter;
      if (format) {
        const result = format(entry.value, entry.name, entry, index, entries);
        if (result == null) return null;
        if (Array.isArray(result)) [value, name] = result;
        else value = result;
      } else
        value = item?.formatValue
          ? item.formatValue(entry.value)
          : Array.isArray(entry.value)
            ? entry.value.join(" – ")
            : entry.value;
      if (!format) {
        const fraction = normalizedValue?.(entry);
        if (fraction !== undefined && Number.isFinite(fraction * 100))
          value = (
            <>
              {formatPercent(fraction)} ({value})
            </>
          );
      }
      hasVisibleValue = true;
    }
    return (
      <TooltipItem
        inactive={Boolean(
          entry.hide ||
            (entry.graphicalItemId && line?.hiddenItems.get(entry.graphicalItemId)) ||
            (visibleSeries !== undefined && !visibleSeries.includes(key)) ||
            (interaction.selected !== null &&
              Object.hasOwn(config, key) &&
              interaction.selected !== key),
        )}
        key={entry.graphicalItemId ?? `${key}-${index}`}
        data-kind-ui="chart-tooltip-item"
        data-series={key}
        data-projected={projected || undefined}
      >
        {!hideIndicator &&
          (item?.icon ? (
            <span
              aria-hidden="true"
              data-kind-ui="chart-icon"
              className="inline-flex shrink-0 items-center [&>svg]:w-[12px] [&>svg]:h-[12px]"
            >
              <item.icon />
            </span>
          ) : (
            <span
              aria-hidden="true"
              data-kind-ui="chart-indicator"
              data-indicator={indicator}
              className={chartClasses(
                "inline-block shrink-0 w-[3px] h-[12px] rounded-[1px] [background:var(--kind-ui-chart-indicator-background,var(--kind-ui-chart-indicator-color,currentColor))]",
                indicator === "dot" && "w-[8px] h-[8px] rounded-[2px]",
                indicator === "dashed" &&
                  "[background:transparent] border-l-[2px] border-dashed border-[color:var(--kind-ui-chart-indicator-color,currentColor)] w-0 rounded-none",
              )}
              style={
                {
                  "--kind-ui-chart-indicator-background": item
                    ? `var(${colorStopToken(key, "gradient")})`
                    : (entry.color ?? "currentColor"),
                  "--kind-ui-chart-indicator-color": item
                    ? `var(--color-${key})`
                    : (entry.color ?? "currentColor"),
                } as CSSProperties
              }
            />
          ))}
        <span>{name}</span>
        {projected && <span data-kind-ui="projection-status">{projectedLabel}</span>}
        <strong data-kind-ui="chart-tooltip-value">
          {valueAnimation === "shuffle" &&
          typeof entry.value === "number" &&
          Number.isFinite(entry.value) &&
          (typeof value === "string" || (typeof value === "number" && Number.isFinite(value))) ? (
            <TooltipNumber value={value} />
          ) : (
            value
          )}
        </strong>
      </TooltipItem>
    );
  });
  if (!hasVisibleValue) return null;
  return (
    <div
      role={accessibilityLayer ? "status" : undefined}
      aria-live={accessibilityLayer ? "assertive" : undefined}
      aria-atomic="true"
      {...props}
      className={chartClasses(
        "py-[6px] px-[8px] [background:var(--kind-ui-chart-popover,var(--popover,Canvas))] text-[color:var(--kind-ui-chart-popover-foreground,var(--popover-foreground,CanvasText))] border border-solid border-[color:var(--kind-ui-chart-border,var(--border,GrayText))] rounded-[var(--kind-ui-chart-radius,var(--radius,8px))] text-[12px] leading-[16px]",
        props.className,
      )}
      data-kind-ui="chart-tooltip"
    >
      {entries.length > 0 && (
        <>
          {!hideLabel && (
            <strong data-kind-ui="chart-tooltip-label" className="font-medium">
              {labelFormatter ? labelFormatter(label, entries) : label}
            </strong>
          )}
          <ul data-kind-ui="chart-tooltip-list" className="list-none p-0 mx-0 mb-0 mt-[2px]">
            {items}
          </ul>
        </>
      )}
    </div>
  );
}

export function TooltipItem({
  inactive,
  children,
  ...props
}: {
  inactive: boolean;
  children: ReactNode;
  "data-kind-ui"?: string;
  "data-series"?: string;
  "data-dimension"?: string;
  "data-projected"?: boolean | undefined;
}) {
  const opacity = useInteractionOpacity(inactive ? 0.28 : 1);
  return (
    <motion.li
      {...props}
      className="flex items-center gap-[4px] mt-[1px] [&>span:last-of-type]:text-[color:var(--kind-ui-chart-muted-foreground,var(--muted-foreground,inherit))] [&_[data-kind-ui=chart-tooltip-value]]:font-medium [&_[data-kind-ui=chart-tooltip-value]]:ml-auto [&_[data-kind-ui=chart-tooltip-value]]:pl-[4px] [&_[data-kind-ui=chart-tooltip-value]]:tabular-nums"
      data-inactive={inactive || undefined}
      initial={false}
      style={{ opacity }}
    >
      {children}
    </motion.li>
  );
}
