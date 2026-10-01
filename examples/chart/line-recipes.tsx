import type { LineAnimation } from "@kind-ui/charts";
import * as Chart from "@kind-ui/charts";
import * as Line from "@kind-ui/charts";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import {
  CartesianGrid,
  type DotProps,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export type { LineAnimation } from "@kind-ui/charts";
export type TrendPoint = { period: string; value: number | null };
export type ComparisonPoint = { period: string; current: number | null; previous: number | null };
export type TrendProps = {
  data: TrendPoint[];
  label: string;
  formatValue: (value: number) => string;
  animate?: boolean | LineAnimation | undefined;
};

const solidDot = {
  r: 3.5,
  fill: "var(--color-value)",
  stroke: "var(--card)",
  strokeWidth: 1.5,
  strokeDasharray: "none",
};
function Diamond({ cx, cy }: Pick<DotProps, "cx" | "cy">) {
  if (cx == null || cy == null) return <g />;
  return (
    <path
      data-recipe-marker="diamond"
      d={`M ${cx} ${cy - 5} l 5 5 -5 5 -5 -5 Z`}
      fill="var(--card)"
      stroke="var(--color-value)"
      strokeWidth={1.5}
      strokeDasharray="none"
    />
  );
}

// Examples own their data, layout and native Recharts geometry.
// Shared interaction, visibility and animation come from the package.
function SingleSeriesLine({
  data,
  label,
  formatValue,
  animate,
  type,
  dot,
  children,
}: TrendProps &
  Required<Pick<ComponentProps<typeof Line.LineSeries>, "type" | "dot">> & {
    children?: ReactNode;
  }) {
  const id = useId();
  return (
    <Chart.Root
      config={{
        value: {
          label,
          color: "var(--chart-1)",
          formatValue: (value) => (typeof value === "number" ? formatValue(value) : "No data"),
        },
      }}
      className="recipe-chart"
    >
      <p id={id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip.
      </p>
      <ResponsiveContainer width="100%" height={196}>
        <Line.LineChart
          data={data}
          animate={animate}
          accessibilityLayer
          aria-label={label}
          aria-describedby={id}
          margin={{ top: 28, right: 16, left: 16, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis hide domain={[0, "auto"]} />
          <Line.Tooltip />
          <Line.LineSeries
            dataKey="value"
            type={type}
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={dot}
            connectNulls={false}
          >
            {children}
          </Line.LineSeries>
        </Line.LineChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
export function TrendLine(props: TrendProps) {
  return <SingleSeriesLine {...props} type="linear" dot={false} />;
}
export function SmoothLine(props: TrendProps) {
  return <SingleSeriesLine {...props} type="monotone" dot={false} />;
}
export function StepLine(props: TrendProps) {
  return <SingleSeriesLine {...props} type="stepAfter" dot={false} />;
}
export function DotsLine(props: TrendProps) {
  return <SingleSeriesLine {...props} type="monotone" dot={solidDot} />;
}
export function CustomMarkerLine(props: TrendProps) {
  return <SingleSeriesLine {...props} type="linear" dot={<Diamond />} />;
}
export function LabeledLine(props: TrendProps) {
  return (
    <SingleSeriesLine {...props} type="monotone" dot={solidDot}>
      <LabelList
        dataKey="value"
        position="top"
        offset={12}
        fill="var(--foreground)"
        fontSize={11}
      />
    </SingleSeriesLine>
  );
}

export function TargetLine({
  data,
  label,
  formatValue,
  target,
  targetLabel,
  animate,
}: TrendProps & { target: number; targetLabel: string }) {
  const id = useId();
  return (
    <Chart.Root
      config={{
        value: {
          label,
          color: "var(--chart-1)",
          formatValue: (value) => (typeof value === "number" ? formatValue(value) : "No data"),
        },
      }}
      className="recipe-chart"
    >
      <p id={id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip. {targetLabel}:{" "}
        {formatValue(target)}.
      </p>
      <ResponsiveContainer width="100%" height={196}>
        <Line.LineChart
          data={data}
          animate={animate}
          accessibilityLayer
          aria-label={label}
          aria-describedby={id}
          margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis width={44} axisLine={false} tickLine={false} domain={[0, "auto"]} />
          <ReferenceLine
            y={target}
            ifOverflow="extendDomain"
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
          />
          <Line.Tooltip />
          <Line.LineSeries
            dataKey="value"
            type="linear"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={solidDot}
            connectNulls={false}
          />
        </Line.LineChart>
      </ResponsiveContainer>
      <p className="recipe-target">
        Dashed line · {targetLabel}: {formatValue(target)}
      </p>
    </Chart.Root>
  );
}

export function ComparisonLine({
  data,
  config,
  visibleSeries,
  onVisibleSeriesChange,
  label,
  animate,
}: {
  data: ComparisonPoint[];
  config: Chart.SeriesConfig & Record<"current" | "previous", Chart.SeriesConfig[string]>;
  visibleSeries: string[];
  onVisibleSeriesChange: (keys: string[]) => void;
  label: string;
  animate?: boolean | LineAnimation | undefined;
}) {
  const id = useId();
  return (
    <Chart.Root
      config={config}
      visibleSeries={visibleSeries}
      onVisibleSeriesChange={onVisibleSeriesChange}
      className="recipe-chart"
    >
      <Chart.Legend aria-label={`${label} series`} />
      <p id={id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip. Previous values use
        a dashed line.
      </p>
      {visibleSeries.length === 0 ? (
        <p role="status" className="recipe-empty">
          Select a series to show it.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={196}>
          <Line.LineChart
            data={data}
            animate={animate}
            accessibilityLayer
            aria-label={label}
            aria-describedby={id}
            margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis width={36} axisLine={false} tickLine={false} domain={[0, "auto"]} />
            <Line.Tooltip />
            <Line.LineSeries
              dataKey="current"
              type="linear"
              stroke="var(--color-current)"
              strokeWidth={2}
              dot={{ r: 3.5, fill: "var(--color-current)", strokeDasharray: "none" }}
              connectNulls={false}
            />
            <Line.LineSeries
              dataKey="previous"
              type="linear"
              stroke="var(--color-previous)"
              strokeDasharray="5 4"
              strokeWidth={2}
              dot={{ r: 3.5, fill: "var(--card)", strokeWidth: 2, strokeDasharray: "none" }}
              connectNulls={false}
            />
          </Line.LineChart>
        </ResponsiveContainer>
      )}
    </Chart.Root>
  );
}
