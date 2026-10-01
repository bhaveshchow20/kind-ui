"use client";

import { type ComponentPropsWithRef, type ReactNode, use } from "react";
import type { TooltipContentProps as NativeContentProps } from "recharts";
import { Tooltip, type TooltipProps } from "./animation.js";
import { useChart } from "./chart-context.js";
import { LineInteraction } from "./line-chart.js";

export type ScatterSizeDimension<Row = unknown> = {
  /** Own top-level property key, or the same typed record accessor used by ZAxis. */
  dataKey: string | ((record: Row) => number | null | undefined);
  name?: string;
  unit?: string;
};

export type ScatterTooltipContentProps<Row = unknown> = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  tooltip: NativeContentProps;
  /** Receives the selected native record, never a categorical label or chart-wide index. */
  pointLabel?: (record: Row) => ReactNode;
  /** Recovers zero/missing Z entries omitted by native Recharts, without changing marker geometry. */
  zDimension?: ScatterSizeDimension<Row>;
  missingValue?: ReactNode;
};

/** Dimension metadata uses each entry's dataKey; series identity only controls visibility/title. */
export function ScatterTooltipContent<Row = unknown>({
  tooltip,
  pointLabel,
  zDimension,
  missingValue = "No data",
  ...props
}: ScatterTooltipContentProps<Row>) {
  const { config, visibleSeries } = useChart();
  const interaction = use(LineInteraction);
  const seriesIdentity = (id: string | undefined) =>
    id ? (interaction?.seriesKeys.get(id) ?? id) : undefined;
  let entries = tooltip.active
    ? tooltip.payload.filter((entry) => {
        const series = seriesIdentity(entry.graphicalItemId);
        return (
          !entry.hide &&
          entry.type !== "none" &&
          (visibleSeries === undefined || (series !== undefined && visibleSeries.includes(series)))
        );
      })
    : [];
  const first = entries[0];
  if (zDimension && first && entries.length === 2) {
    const record: unknown = first.payload;
    const raw: unknown =
      typeof zDimension.dataKey === "function"
        ? zDimension.dataKey(first.payload)
        : record !== null && typeof record === "object" && Object.hasOwn(record, zDimension.dataKey)
          ? Reflect.get(record, zDimension.dataKey)
          : undefined;
    const { value: _nativeValue, ...identity } = first;
    entries = [
      ...entries,
      {
        ...identity,
        dataKey: zDimension.dataKey,
        name: zDimension.name ?? "Size",
        unit: zDimension.unit ?? "",
        ...(typeof raw === "number" && Number.isFinite(raw) ? { value: raw } : {}),
      },
    ];
  }

  if (!entries.some((entry) => entry.value != null)) return null;
  const series = seriesIdentity(first?.graphicalItemId);
  const seriesLabel = series !== undefined ? config[series]?.label : undefined;
  const title = pointLabel?.(first?.payload) ?? seriesLabel;
  let hasValue = false;
  const items = entries.map((entry, index) => {
    // Native Scatter payload slots are X/Y/Z identities, including equal dataKey/name pairs.
    const dimension = ["x", "y", "z"][index] ?? String(index);
    const key = String(entry.dataKey ?? entry.name ?? dimension);
    const meta = Object.hasOwn(config, key) ? config[key] : undefined;
    let name: ReactNode = meta?.label ?? entry.name ?? key;
    let value: ReactNode = missingValue;
    if (entry.value != null) {
      const format = entry.formatter ?? tooltip.formatter;
      if (format) {
        const result = format(entry.value, entry.name, entry, index, entries);
        if (result == null) return null;
        if (Array.isArray(result)) [value, name] = result;
        else value = result;
      } else
        value = meta?.formatValue
          ? meta.formatValue(entry.value)
          : Array.isArray(entry.value)
            ? entry.value.join(" – ")
            : `${entry.value}${entry.unit ?? ""}`;
      hasValue = true;
    }
    return (
      <li
        key={`${entry.graphicalItemId ?? "point"}-${dimension}`}
        data-kind-ui="chart-tooltip-item"
        data-dimension={key}
      >
        <span>{name}</span>
        <strong data-kind-ui="chart-tooltip-value">{value}</strong>
      </li>
    );
  });
  if (!hasValue) return null;
  return (
    <div
      role={tooltip.accessibilityLayer ? "status" : undefined}
      aria-live={tooltip.accessibilityLayer ? "assertive" : undefined}
      aria-atomic="true"
      {...props}
      data-kind-ui="chart-tooltip"
    >
      {title != null && (
        <strong data-kind-ui="chart-tooltip-label">
          {tooltip.labelFormatter ? tooltip.labelFormatter(title, entries) : title}
        </strong>
      )}
      <ul data-kind-ui="chart-tooltip-list">{items}</ul>
    </div>
  );
}
export type ScatterTooltipProps<Row = unknown> = TooltipProps &
  Pick<ScatterTooltipContentProps<Row>, "pointLabel" | "zDimension" | "missingValue">;
/** Shared bounded positioning/Motion with Scatter-aware default dimension content. */
export function ScatterTooltip<Row = unknown>({
  pointLabel,
  zDimension,
  missingValue,
  content,
  ...props
}: ScatterTooltipProps<Row>) {
  return (
    <Tooltip
      {...props}
      content={
        content ??
        ((tooltip) => (
          <ScatterTooltipContent<Row>
            tooltip={tooltip}
            {...(pointLabel ? { pointLabel } : {})}
            {...(zDimension ? { zDimension } : {})}
            {...(missingValue !== undefined ? { missingValue } : {})}
          />
        ))
      }
    />
  );
}
