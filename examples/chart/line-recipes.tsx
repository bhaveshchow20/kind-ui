import * as Chart from "@kind-ui/charts";
import type { ComponentProps, ReactNode } from "react";
import {
  CartesianGrid,
  type DotProps,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActiveMarker,
  type LineMotion,
  LineReveal,
  MovingTooltip,
  useLineMotion,
} from "./line-motion.js";

export type { LineMotion } from "./line-motion.js";
export type TrendPoint = { period: string; value: number | null };
export type ComparisonPoint = { period: string; current: number | null; previous: number | null };
export type TrendProps = {
  data: TrendPoint[];
  label: string;
  formatValue: (value: number) => string;
  motion?: LineMotion | undefined;
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

// These single-series recipes repeat the same measured frame, tooltip and motion wiring.
// The engine's Line props remain explicit at each recipe, rather than encoded in a chart schema.
function SingleSeriesLine({
  data,
  label,
  formatValue,
  motion,
  type,
  dot,
  children,
}: TrendProps &
  Required<Pick<ComponentProps<typeof Line>, "type" | "dot">> & { children?: ReactNode }) {
  const animation = useLineMotion(motion);
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
      data-reveal={animation.reveal ? "on" : "off"}
      style={animation.style}
      onFocusCapture={animation.finishReveal}
      onPointerDownCapture={animation.finishReveal}
      onPointerMoveCapture={animation.finishReveal}
    >
      <p id={animation.id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip.
      </p>
      <ResponsiveContainer width="100%" height={196}>
        <LineChart
          data={data}
          accessibilityLayer
          aria-label={label}
          aria-describedby={animation.id}
          margin={{ top: 28, right: 16, left: 16, bottom: 0 }}
        >
          {animation.reveal && motion && <LineReveal id={animation.id} options={motion} />}
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip
            position={{ x: 0, y: 0 }}
            cursor={false}
            filterNull={false}
            isAnimationActive={false}
            content={(tooltip) => (
              <MovingTooltip
                key={animation.animate ? "animated" : "static"}
                tooltip={tooltip}
                transition={animation.transition}
              />
            )}
          />
          <Line
            dataKey="value"
            type={type}
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={dot}
            activeDot={
              <ActiveMarker
                key={animation.animate ? "animated" : "static"}
                transition={animation.transition}
              />
            }
            connectNulls={false}
            isAnimationActive={false}
          >
            {children}
          </Line>
        </LineChart>
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
  motion,
}: TrendProps & { target: number; targetLabel: string }) {
  const animation = useLineMotion(motion);
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
      data-reveal={animation.reveal ? "on" : "off"}
      style={animation.style}
      onFocusCapture={animation.finishReveal}
      onPointerDownCapture={animation.finishReveal}
      onPointerMoveCapture={animation.finishReveal}
    >
      <p id={animation.id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip. {targetLabel}:{" "}
        {formatValue(target)}.
      </p>
      <ResponsiveContainer width="100%" height={196}>
        <LineChart
          data={data}
          accessibilityLayer
          aria-label={label}
          aria-describedby={animation.id}
          margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
        >
          {animation.reveal && motion && <LineReveal id={animation.id} options={motion} />}
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis width={44} axisLine={false} tickLine={false} domain={[0, "auto"]} />
          <ReferenceLine
            y={target}
            ifOverflow="extendDomain"
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
          />
          <Tooltip
            position={{ x: 0, y: 0 }}
            cursor={false}
            filterNull={false}
            isAnimationActive={false}
            content={(tooltip) => (
              <MovingTooltip
                key={animation.animate ? "animated" : "static"}
                tooltip={tooltip}
                transition={animation.transition}
              />
            )}
          />
          <Line
            dataKey="value"
            type="linear"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={solidDot}
            activeDot={
              <ActiveMarker
                key={animation.animate ? "animated" : "static"}
                transition={animation.transition}
              />
            }
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
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
  motion,
}: {
  data: ComparisonPoint[];
  config: Chart.SeriesConfig & Record<"current" | "previous", Chart.SeriesConfig[string]>;
  visibleSeries: string[];
  onVisibleSeriesChange: (keys: string[]) => void;
  label: string;
  motion?: LineMotion | undefined;
}) {
  const animation = useLineMotion(motion);
  return (
    <Chart.Root
      config={config}
      visibleSeries={visibleSeries}
      onVisibleSeriesChange={onVisibleSeriesChange}
      className="recipe-chart"
      data-reveal={animation.reveal ? "on" : "off"}
      style={animation.style}
      onFocusCapture={animation.finishReveal}
      onPointerDownCapture={animation.finishReveal}
      onPointerMoveCapture={animation.finishReveal}
    >
      <Chart.Legend aria-label={`${label} series`} />
      <p id={animation.id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip. Previous values use
        a dashed line.
      </p>
      {visibleSeries.length === 0 ? (
        <p role="status" className="recipe-empty">
          Select a series to show it.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={196}>
          <LineChart
            data={data}
            accessibilityLayer
            aria-label={label}
            aria-describedby={animation.id}
            margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
          >
            {animation.reveal && motion && <LineReveal id={animation.id} options={motion} />}
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis width={36} axisLine={false} tickLine={false} domain={[0, "auto"]} />
            <Tooltip
              position={{ x: 0, y: 0 }}
              cursor={false}
              filterNull={false}
              isAnimationActive={false}
              content={(tooltip) => (
                <MovingTooltip
                  key={animation.animate ? "animated" : "static"}
                  tooltip={tooltip}
                  transition={animation.transition}
                />
              )}
            />
            <Line
              dataKey="current"
              type="linear"
              stroke="var(--color-current)"
              strokeWidth={2}
              dot={{ r: 3.5, fill: "var(--color-current)", strokeDasharray: "none" }}
              activeDot={
                <ActiveMarker
                  key={animation.animate ? "animated" : "static"}
                  transition={animation.transition}
                />
              }
              hide={!visibleSeries.includes("current")}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="previous"
              type="linear"
              stroke="var(--color-previous)"
              strokeDasharray="5 4"
              strokeWidth={2}
              dot={{ r: 3.5, fill: "var(--card)", strokeWidth: 2, strokeDasharray: "none" }}
              activeDot={
                <ActiveMarker
                  key={animation.animate ? "animated" : "static"}
                  transition={animation.transition}
                />
              }
              hide={!visibleSeries.includes("previous")}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Chart.Root>
  );
}
