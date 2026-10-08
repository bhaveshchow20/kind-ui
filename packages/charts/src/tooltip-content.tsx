"use client";

import { type ComponentPropsWithRef, type CSSProperties, type ReactNode, use } from "react";
import type { TooltipContentProps as UpstreamTooltipContentProps } from "recharts";
import { useChart } from "./chart-context.js";
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
  const line = use(LineInteraction);
  const identity = (entry: UpstreamTooltipContentProps["payload"][number]) =>
    itemKey?.(entry) ??
    (entry.graphicalItemId
      ? line?.categoryKeys.get(entry.graphicalItemId)?.(Number(tooltip.activeIndex))
      : undefined) ??
    (entry.graphicalItemId ? line?.seriesKeys.get(entry.graphicalItemId) : undefined) ??
    String(entry.dataKey ?? entry.name);
  const { active, payload, label, formatter, labelFormatter, accessibilityLayer } = tooltip;
  const entries = active
    ? payload.filter(
        (item) =>
          item.type !== "none" &&
          !item.hide &&
          !(item.graphicalItemId && line?.hiddenItems.get(item.graphicalItemId)) &&
          (visibleSeries === undefined || visibleSeries.includes(identity(item))),
      )
    : [];
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
      <li
        key={entry.graphicalItemId ?? `${key}-${index}`}
        data-kind-ui="chart-tooltip-item"
        data-series={key}
        data-projected={projected || undefined}
      >
        {!hideIndicator &&
          (item?.icon ? (
            <span aria-hidden="true" data-kind-ui="chart-icon">
              <item.icon />
            </span>
          ) : (
            <span
              aria-hidden="true"
              data-kind-ui="chart-indicator"
              data-indicator={indicator}
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
      </li>
    );
  });
  if (!hasVisibleValue) return null;
  return (
    <div
      role={accessibilityLayer ? "status" : undefined}
      aria-live={accessibilityLayer ? "assertive" : undefined}
      aria-atomic="true"
      {...props}
      data-kind-ui="chart-tooltip"
    >
      {entries.length > 0 && (
        <>
          {!hideLabel && (
            <strong data-kind-ui="chart-tooltip-label">
              {labelFormatter ? labelFormatter(label, entries) : label}
            </strong>
          )}
          <ul data-kind-ui="chart-tooltip-list">{items}</ul>
        </>
      )}
    </div>
  );
}
