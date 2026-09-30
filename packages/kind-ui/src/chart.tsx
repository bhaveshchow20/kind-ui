"use client";

import {
  type ComponentPropsWithRef,
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
} from "react";
import type { TooltipContentProps, TooltipValueType } from "recharts";

export type ChartConfig = Readonly<
  Record<
    string,
    {
      label: string;
      color: string;
      formatValue?: (value: TooltipValueType) => ReactNode;
    }
  >
>;
type Visibility = {
  visibleSeries?: readonly string[];
  onVisibleSeriesChange?: (next: string[]) => void;
};
type ChartContextValue = Visibility & { config: ChartConfig };
const ChartContext = createContext<ChartContextValue | null>(null);
function useChart() {
  const chart = useContext(ChartContext);
  if (!chart) throw new Error("ChartLegend and ChartTooltipContent must be inside ChartContainer");
  return chart;
}
export type ChartContainerProps = ComponentPropsWithRef<"div"> & { config: ChartConfig } & (
    | { visibleSeries?: undefined; onVisibleSeriesChange?: never }
    | { visibleSeries: readonly string[]; onVisibleSeriesChange?: (next: string[]) => void }
  );

/** Scopes presentation metadata and CSS colors; the consumer owns chart geometry and state. */
export function ChartContainer({
  config,
  visibleSeries,
  onVisibleSeriesChange,
  style,
  children,
  ...props
}: ChartContainerProps) {
  if (onVisibleSeriesChange && !visibleSeries)
    throw new Error("ChartContainer requires visibleSeries when onVisibleSeriesChange is provided");
  const colors: Record<string, string> = {};
  for (const [key, item] of Object.entries(config)) {
    if (!/^[a-zA-Z][\w-]*$/.test(key))
      throw new Error(
        `Chart series key "${key}" must start with a letter and contain only letters, numbers, underscores or hyphens`,
      );
    colors[`--color-${key}`] = item.color;
  }
  const value: ChartContextValue = {
    config,
    ...(visibleSeries ? { visibleSeries } : {}),
    ...(onVisibleSeriesChange ? { onVisibleSeriesChange } : {}),
  };
  return (
    <ChartContext value={value}>
      <div
        {...props}
        data-kind-ui="chart"
        style={{ width: "100%", minWidth: 0, ...colors, ...style }}
      >
        {children}
      </div>
    </ChartContext>
  );
}

export type ChartLegendProps = Omit<ComponentPropsWithRef<"ul">, "children">;
const legendStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  listStyle: "none",
  margin: "12px 0",
  padding: 0,
};
const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid currentColor",
  borderRadius: 6,
  background: "var(--chart-legend-background, transparent)",
  color: "inherit",
  padding: "6px 10px",
  font: "inherit",
  cursor: "pointer",
};

/** Displays configured series; becomes interactive only when a controlled change callback exists. */
export function ChartLegend({ style, ...props }: ChartLegendProps) {
  const { config, visibleSeries, onVisibleSeriesChange } = useChart();
  return (
    <ul aria-label="Chart legend" {...props} style={{ ...legendStyle, ...style }}>
      {Object.entries(config).map(([key, item]) => {
        const visible = visibleSeries?.includes(key) ?? true;
        const content = (
          <>
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                display: "inline-block",
                background: `var(--color-${key})`,
              }}
            />
            {item.label}
          </>
        );
        return (
          <li key={key}>
            {onVisibleSeriesChange && visibleSeries ? (
              <button
                type="button"
                aria-pressed={visible}
                style={{ ...buttonStyle, textDecoration: visible ? "none" : "line-through" }}
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

export type ChartTooltipContentProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** Pass the upstream content callback's props here so engine-only props never reach the DOM. */
  tooltip: TooltipContentProps;
  missingValue?: ReactNode;
};

/** Default tooltip UI using the containing chart's labels, formats, colors and visibility. */
export function ChartTooltipContent({
  tooltip,
  missingValue = "No data",
  style,
  ...props
}: ChartTooltipContentProps) {
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
  return (
    <div
      role={accessibilityLayer ? "status" : undefined}
      aria-live={accessibilityLayer ? "assertive" : undefined}
      aria-atomic="true"
      {...props}
      style={{
        padding: "10px 12px",
        background: "Canvas",
        color: "CanvasText",
        border: "1px solid GrayText",
        borderRadius: 8,
        fontSize: 13,
        ...style,
      }}
    >
      {entries.length > 0 && (
        <>
          <strong>{labelFormatter ? labelFormatter(label, entries) : label}</strong>
          <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0" }}>
            {entries.map((entry, index) => {
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
              }
              return (
                <li
                  key={entry.graphicalItemId ?? `${key}-${index}`}
                  style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      background: item ? `var(--color-${key})` : (entry.color ?? "currentColor"),
                    }}
                  />
                  <span>{name}</span>
                  <strong style={{ marginLeft: "auto" }}>{value}</strong>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
