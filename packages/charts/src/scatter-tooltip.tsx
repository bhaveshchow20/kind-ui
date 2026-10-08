"use client";

import { type ComponentPropsWithRef, type ReactNode, use } from "react";
import type { TooltipContentProps as NativeContentProps } from "recharts";
import { Tooltip, type TooltipProps } from "./animation.js";
import { useChart } from "./chart-context.js";
import { useChartInteraction } from "./chart-interaction.js";
import { LineInteraction } from "./line-chart.js";
import { type TooltipContentProps, TooltipItem } from "./tooltip-content.js";
import { TooltipNumber } from "./tooltip-number.js";

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
  valueAnimation?: TooltipContentProps["valueAnimation"];
};

/** Dimension metadata uses each entry's dataKey; series identity only controls visibility/title. */
export function ScatterTooltipContent<Row = unknown>({
  tooltip,
  pointLabel,
  zDimension,
  missingValue = "No data",
  valueAnimation,
  ...props
}: ScatterTooltipContentProps<Row>) {
  const { config, visibleSeries } = useChart();
  const interaction = use(LineInteraction);
  const focus = useChartInteraction();
  const seriesIdentity = (id: string | undefined) =>
    id ? (interaction?.seriesKeys.get(id) ?? id) : undefined;
  let entries = tooltip.active ? tooltip.payload.filter((entry) => entry.type !== "none") : [];
  const first = entries[0];
  if (
    zDimension &&
    first &&
    entries.length <= 2 &&
    !entries.some((entry) => entry.dataKey === zDimension.dataKey)
  ) {
    const record: unknown = first.payload;
    const raw: unknown =
      typeof zDimension.dataKey === "function"
        ? zDimension.dataKey(first.payload)
        : record !== null && typeof record === "object" && Object.hasOwn(record, zDimension.dataKey)
          ? Reflect.get(record, zDimension.dataKey)
          : undefined;
    // Native Scatter omits only zero/missing Z. Nonzero entries survive filterNull,
    // and Recharts wraps function keys, so reference equality cannot identify them.
    if (raw === 0 || raw == null) {
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
      <TooltipItem
        inactive={Boolean(
          entry.hide ||
            (entry.graphicalItemId && interaction?.hiddenItems.get(entry.graphicalItemId)) ||
            (visibleSeries !== undefined &&
              (series === undefined || !visibleSeries.includes(series))) ||
            (focus.selected !== null && series !== undefined && focus.selected !== series),
        )}
        key={`${entry.graphicalItemId ?? "point"}-${dimension}`}
        data-kind-ui="chart-tooltip-item"
        data-dimension={key}
      >
        <span>{name}</span>
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

// A stable native-content adapter retains digit/width state across consumer rerenders.
function DefaultScatterContent<Row>({
  pointLabel,
  zDimension,
  missingValue,
  valueAnimation,
  ...tooltip
}: NativeContentProps &
  Pick<
    ScatterTooltipContentProps<Row>,
    "pointLabel" | "zDimension" | "missingValue" | "valueAnimation"
  >) {
  return (
    <ScatterTooltipContent<Row>
      tooltip={tooltip}
      {...(pointLabel ? { pointLabel } : {})}
      {...(zDimension ? { zDimension } : {})}
      {...(missingValue !== undefined ? { missingValue } : {})}
      {...(valueAnimation ? { valueAnimation } : {})}
    />
  );
}
/** Shared bounded positioning/Motion with Scatter-aware default dimension content. */
export function ScatterTooltip<Row = unknown>({
  pointLabel,
  zDimension,
  missingValue,
  valueAnimation,
  content,
  ...props
}: ScatterTooltipProps<Row>) {
  return (
    <Tooltip
      {...props}
      content={
        content ?? (
          <DefaultScatterContent<Row>
            active={false}
            payload={[]}
            coordinate={undefined}
            activeIndex={undefined}
            accessibilityLayer={false}
            {...(pointLabel ? { pointLabel } : {})}
            {...(zDimension ? { zDimension } : {})}
            {...(missingValue !== undefined ? { missingValue } : {})}
            {...(valueAnimation ? { valueAnimation } : {})}
          />
        )
      }
    />
  );
}
