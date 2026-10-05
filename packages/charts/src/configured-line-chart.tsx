"use client";

import { type ReactNode, useContext, useId, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  type CartesianGridProps,
  type DataKey,
  XAxis,
  type XAxisProps,
  YAxis,
  type YAxisProps,
} from "recharts";
import {
  LineChart as ComposedLineChart,
  type LineChartProps as ComposedLineChartProps,
  LineSeries,
  type LineSeriesProps,
  Tooltip,
  type TooltipProps,
} from "./animation.js";
import { ChartContext } from "./chart-context.js";
import { Legend, type LegendProps } from "./legend.js";
import { Root, type RootProps } from "./root.js";
import type { SeriesConfig } from "./types.js";

type DefaultDataPoint = Parameters<Extract<LineSeriesProps["dataKey"], (row: never) => unknown>>[0];
export type ConfiguredLineSeries<DataPoint = DefaultDataPoint> = LineSeriesProps<DataPoint> & {
  /** Explicit metadata identity; required for numeric and function data keys too. */
  seriesKey: string;
  dataKey: NonNullable<LineSeriesProps<DataPoint>["dataKey"]>;
};
type Visibility =
  | {
      visibleSeries: readonly string[];
      defaultVisibleSeries?: never;
      onVisibleSeriesChange?: (next: string[]) => void;
    }
  | {
      visibleSeries?: undefined;
      defaultVisibleSeries?: readonly string[];
      onVisibleSeriesChange?: (next: string[]) => void;
    };
type Name =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-labelledby": string; "aria-label"?: string };
type GeneratedParts<DataPoint> = {
  children?: undefined;
  layout?: "horizontal";
  xDataKey: DataKey<DataPoint>;
  curve?: LineSeriesProps["type"];
  material?: LineSeriesProps["material"];
  xAxis?: false | XAxisProps<DataPoint>;
  yAxis?: false | YAxisProps<DataPoint>;
  grid?: false | CartesianGridProps;
  tooltip?: false | TooltipProps;
  series?: readonly ConfiguredLineSeries<DataPoint>[];
};
type ExplicitParts = {
  layout?: NonNullable<ComposedLineChartProps["layout"]>;
  children: Exclude<ReactNode, undefined>;
  curve?: never;
  material?: never;
  xDataKey?: never;
  xAxis?: never;
  yAxis?: never;
  grid?: never;
  tooltip?: never;
  series?: never;
};
export type ConfiguredLineChartProps<DataPoint = DefaultDataPoint> = Omit<
  ComposedLineChartProps,
  "data" | "children" | "layout"
> & {
  config: SeriesConfig;
  data: readonly DataPoint[];
  "aria-describedby"?: string;
  legend?: false | LegendProps;
  rootProps?: Omit<RootProps, "config" | "children" | "visibleSeries" | "onVisibleSeriesChange">;
} & Name &
  Visibility &
  (GeneratedParts<DataPoint> | ExplicitParts);

// Preserve the existing exported prop contract for native composition consumers.
export type LineChartProps = ComposedLineChartProps;
type CompositionLineChartProps = LineChartProps & {
  config?: never;
  xDataKey?: never;
  xAxis?: never;
  yAxis?: never;
  grid?: never;
  tooltip?: never;
  curve?: never;
  material?: never;
  series?: never;
  legend?: never;
  rootProps?: never;
  visibleSeries?: never;
  defaultVisibleSeries?: never;
  onVisibleSeriesChange?: never;
};

/** Existing composition unchanged; config explicitly opts into package-owned composition. */
export function LineChart<DataPoint = DefaultDataPoint>(
  props: CompositionLineChartProps | ConfiguredLineChartProps<DataPoint>,
) {
  if ("config" in props && props.config !== undefined) return <ConfiguredLineChart {...props} />;
  return <ComposedLineChart {...props} />;
}

function ConfiguredLineChart<DataPoint>(props: ConfiguredLineChartProps<DataPoint>) {
  const parent = useContext(ChartContext);
  const {
    config,
    data,
    children,
    xDataKey,
    curve,
    material,
    xAxis,
    yAxis,
    grid,
    tooltip,
    series,
    legend,
    rootProps,
    visibleSeries,
    defaultVisibleSeries,
    onVisibleSeriesChange,
    style,
    className,
    width,
    height,
    responsive,
    accessibilityLayer = true,
    animate = true,
    ...chartProps
  } = props;
  const controlled = visibleSeries !== undefined;
  const initialMode = useRef(controlled);
  // Undefined means all current configured keys, including keys added later.
  // A user/default selection is a whitelist; new keys then start hidden.
  const [selection, setSelection] = useState<readonly string[] | undefined>(defaultVisibleSeries);
  const instructionId = useId();
  if (parent)
    throw new Error(
      "Configured LineChart owns Root; remove the surrounding Root or omit config and compose explicitly",
    );
  if (controlled !== initialMode.current)
    throw new Error(
      "LineChart cannot switch controlled visibility mode; keep visibleSeries defined or remount with a new key",
    );
  if (visibleSeries !== undefined && defaultVisibleSeries !== undefined)
    throw new Error("LineChart accepts visibleSeries or defaultVisibleSeries, not both");
  if (
    typeof chartProps["aria-label"] !== "string" &&
    typeof chartProps["aria-labelledby"] !== "string"
  )
    throw new Error("Configured LineChart requires aria-label or aria-labelledby");
  const generated = children === undefined;
  if (
    !generated &&
    [xDataKey, curve, material, xAxis, yAxis, grid, tooltip, series].some(
      (part) => part !== undefined,
    )
  )
    throw new Error(
      "Explicit LineChart children replace generated parts; remove xDataKey and generated-part options",
    );
  if (generated && xDataKey === undefined)
    throw new Error("Configured LineChart requires xDataKey when children are omitted");
  if (generated && chartProps.layout !== undefined && chartProps.layout !== "horizontal")
    throw new Error(
      "Configured LineChart defaults use horizontal layout; supply explicit children for vertical layout",
    );
  const keys = Object.keys(config);
  const identities =
    generated && series !== undefined ? series.map((item) => item.seriesKey) : keys;
  if (new Set(identities).size !== identities.length)
    throw new Error("Configured LineChart seriesKey values must be unique");
  for (const key of identities)
    if (!Object.hasOwn(config, key))
      throw new Error(`LineChart seriesKey "${key}" must exist in config`);
  const activeConfig =
    generated && series !== undefined
      ? // biome-ignore lint/style/noNonNullAssertion: The preceding loop rejects each identity absent from config.
        Object.fromEntries(identities.map((key) => [key, config[key]!]))
      : config;
  const candidate = (visibleSeries ?? selection ?? identities).filter((key) =>
    identities.includes(key),
  );
  const visibilityKey = JSON.stringify(candidate);
  // The shared lifecycle uses reference identity to invalidate geometry. Keep
  // equal selections stable through unrelated parent/style/motion updates.
  // biome-ignore lint/correctness/useExhaustiveDependencies: visibilityKey captures the exact string-array contents.
  const visible = useMemo(() => candidate, [visibilityKey]);
  const change = controlled
    ? onVisibleSeriesChange
    : (next: string[]) => {
        setSelection(next);
        onVisibleSeriesChange?.(next);
      };
  const describedBy = [
    chartProps["aria-describedby"],
    accessibilityLayer ? instructionId : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Root
      {...rootProps}
      className={["kind-ui-configured-line-root", rootProps?.className].filter(Boolean).join(" ")}
      config={activeConfig}
      visibleSeries={visible}
      {...(change ? { onVisibleSeriesChange: change } : {})}
    >
      {accessibilityLayer && (
        <p id={instructionId} data-kind-ui="chart-instructions">
          Focus the chart and use the arrow keys to inspect values. Press Escape to dismiss the
          tooltip.
        </p>
      )}
      <ComposedLineChart
        {...chartProps}
        data={data}
        accessibilityLayer={accessibilityLayer}
        animate={animate}
        {...(describedBy ? { "aria-describedby": describedBy } : {})}
        responsive={responsive ?? true}
        {...(width !== undefined ? { width } : {})}
        {...(height !== undefined ? { height } : {})}
        className={["kind-ui-configured-line-chart", className].filter(Boolean).join(" ")}
        style={{
          ...(width !== undefined ? { width } : {}),
          ...(height !== undefined ? { height } : {}),
          ...style,
        }}
      >
        {generated ? (
          <>
            {grid !== false && (
              <CartesianGrid
                vertical={false}
                stroke="var(--kind-ui-chart-grid, #d1d5db)"
                strokeDasharray="3 3"
                {...grid}
              />
            )}
            {xAxis !== false && (
              <XAxis
                {...(xDataKey !== undefined ? { dataKey: xDataKey } : {})}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--kind-ui-chart-muted-foreground, #6b7280)" }}
                {...xAxis}
              />
            )}
            {yAxis !== false && (
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--kind-ui-chart-muted-foreground, #6b7280)" }}
                {...yAxis}
              />
            )}
            {series !== undefined
              ? series.map((item) => (
                  <LineSeries<DataPoint>
                    key={item.seriesKey}
                    type={curve ?? "monotone"}
                    material={material ?? "plain"}
                    dot={{ r: 2.5 }}
                    strokeWidth={2}
                    {...item}
                  />
                ))
              : keys.map((key) => (
                  <LineSeries
                    key={key}
                    dataKey={key}
                    seriesKey={key}
                    type={curve ?? "monotone"}
                    material={material ?? "plain"}
                    dot={{ r: 2.5 }}
                    strokeWidth={2}
                  />
                ))}
            {tooltip !== false && <Tooltip {...tooltip} />}
          </>
        ) : (
          children
        )}
      </ComposedLineChart>
      {legend !== false && (generated || legend !== undefined) && <Legend {...legend} />}
    </Root>
  );
}
