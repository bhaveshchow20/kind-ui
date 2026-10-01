"use client";

import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";
import type { TooltipContentProps as UpstreamTooltipContentProps } from "recharts";
import { useChart } from "./chart-context.js";

export type TooltipContentProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** Pass the upstream content callback's props here so engine-only props never reach the DOM. */
  tooltip: UpstreamTooltipContentProps;
  missingValue?: ReactNode;
};

/** Default tooltip UI using the containing chart's labels, formats, colors and visibility. */
export function TooltipContent({
  tooltip,
  missingValue = "No data",
  ...props
}: TooltipContentProps) {
  const { config, visibleSeries } = useChart();
  const { active, payload, label, formatter, labelFormatter, accessibilityLayer } = tooltip;
  const entries = active
    ? payload.filter(
        (item) =>
          item.type !== "none" &&
          !item.hide &&
          (visibleSeries === undefined ||
            visibleSeries.includes(String(item.dataKey ?? item.name))),
      )
    : [];
  if (!entries.some((entry) => entry.value != null)) return null;
  let hasVisibleValue = false;
  const items = entries.map((entry, index) => {
    const key = String(entry.dataKey ?? entry.name ?? index);
    const item = Object.hasOwn(config, key) ? config[key] : undefined;
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
      hasVisibleValue = true;
    }
    return (
      <li
        key={entry.graphicalItemId ?? `${key}-${index}`}
        data-kind-ui="chart-tooltip-item"
        data-series={key}
      >
        <span
          aria-hidden="true"
          data-kind-ui="chart-indicator"
          style={
            {
              "--kind-ui-chart-indicator-color": item
                ? `var(--color-${key})`
                : (entry.color ?? "currentColor"),
            } as CSSProperties
          }
        />
        <span>{name}</span>
        <strong data-kind-ui="chart-tooltip-value">{value}</strong>
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
          <strong data-kind-ui="chart-tooltip-label">
            {labelFormatter ? labelFormatter(label, entries) : label}
          </strong>
          <ul data-kind-ui="chart-tooltip-list">{items}</ul>
        </>
      )}
    </div>
  );
}
