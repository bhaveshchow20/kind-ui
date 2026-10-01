import * as Chart from "@kind-ui/charts";
import { motion } from "motion/react";
import { type CSSProperties, type ReactNode, useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  XAxis,
  YAxis,
} from "recharts";
import { MovingTooltip, type RecipeMotion, useRecipeMotion } from "./recipe-motion.js";

export type AreaPoint = { period: string; value: number | null };
/** A complete stack has numeric values for every series at each period. */
export type StackedAreaPoint = { period: string; desktop: number; mobile: number };
export type AreaMotion = RecipeMotion;
type SingleAreaProps = {
  data: AreaPoint[];
  label: string;
  formatValue: (value: number) => string;
  motion?: AreaMotion | undefined;
};
type StackedAreaProps = {
  data: StackedAreaPoint[];
  motion?: AreaMotion | undefined;
};
type AreaSeries = "desktop" | "mobile";
type Config = Record<AreaSeries, Chart.SeriesConfig[string]>;
type AreaFrameProps<T extends { period: string }> = {
  data: T[];
  label: string;
  config: Chart.SeriesConfig;
  motion?: AreaMotion | undefined;
  children: ReactNode;
  visibleSeries?: string[];
  onVisibleSeriesChange?: (series: string[]) => void;
  offset?: "none" | "expand";
  percentage?: boolean;
  showLegend?: boolean;
  threshold?: number;
};

const stackedConfig: Config = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
};

function AreaReveal({
  id,
  options,
  onComplete,
}: {
  id: string;
  options: AreaMotion;
  onComplete: () => void;
}) {
  const area = usePlotArea();
  if (!area) return null;
  return (
    <defs>
      <clipPath id={`${id}-area`} clipPathUnits="userSpaceOnUse">
        <motion.rect
          data-area-reveal=""
          onAnimationComplete={onComplete}
          initial={{ x: area.x, y: area.y, width: 0, height: area.height }}
          animate={{ x: area.x, y: area.y, width: area.width, height: area.height }}
          transition={{
            duration: Math.max(0, options.revealDurationMs ?? 1000) / 1000,
            ease: options.revealEasing ?? [0.25, 0.1, 0.25, 1],
          }}
        />
      </clipPath>
    </defs>
  );
}

function AreaFrame<T extends { period: string }>({
  data,
  label,
  config,
  motion: options,
  children,
  visibleSeries,
  onVisibleSeriesChange,
  offset = "none",
  percentage = false,
  showLegend = false,
  threshold,
}: AreaFrameProps<T>) {
  const animation = useRecipeMotion(options);
  const tooltipFormatter = percentage
    ? (
        value: number | string | readonly (number | string)[] | undefined,
        name: string | number | undefined,
        _entry: unknown,
        _index: number,
        payload: readonly { value?: unknown }[],
      ) => {
        const total = payload.reduce(
          (sum, point) => sum + (typeof point.value === "number" ? point.value : 0),
          0,
        );
        const percent = typeof value === "number" && total > 0 ? (value / total) * 100 : 0;
        return [`${percent.toFixed(0)}%`, name];
      }
    : undefined;
  const rootProps = {
    config,
    className: "recipe-chart",
    "data-area-reveal": animation.reveal ? "on" : "off",
    style: {
      "--area-reveal-clip": animation.reveal ? `url(#${animation.id}-area)` : "none",
    } as CSSProperties,
    onFocusCapture: animation.finishReveal,
    onPointerDownCapture: animation.finishReveal,
    onPointerMoveCapture: animation.finishReveal,
    onKeyDownCapture: animation.clearPointer,
  };
  const content = (
    <>
      {(showLegend || (visibleSeries !== undefined && onVisibleSeriesChange !== undefined)) && (
        <Chart.Legend />
      )}
      <p id={animation.id} className="recipe-help">
        Use left and right arrow keys to explore values. Escape dismisses the tooltip.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          stackOffset={offset}
          accessibilityLayer
          aria-label={label}
          aria-describedby={animation.id}
          onMouseMove={animation.trackPointer}
          onMouseLeave={animation.clearPointer}
          margin={{ top: 20, right: 12, bottom: 0, left: 0 }}
        >
          {animation.reveal && options && (
            <AreaReveal id={animation.id} options={options} onComplete={animation.finishReveal} />
          )}
          <CartesianGrid vertical={false} stroke="var(--border)" />
          {children}
          {threshold !== undefined && (
            <ReferenceLine
              y={threshold}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={{ value: "Goal", position: "insideTopRight", fill: "var(--muted-foreground)" }}
            />
          )}
          <XAxis dataKey="period" axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis
            axisLine={false}
            tickLine={false}
            domain={
              percentage
                ? [0, 1]
                : threshold === undefined
                  ? ["auto", "auto"]
                  : ([min, max]) => [
                      Math.min(min, threshold),
                      Math.max(max, threshold) + Math.max(1, Math.abs(max - min) * 0.05),
                    ]
            }
            {...(percentage
              ? {
                  ticks: [0, 0.25, 0.5, 0.75, 1],
                  tickFormatter: (value: number) => `${Math.round(value * 100)}%`,
                }
              : {})}
            width={36}
          />
          <Tooltip
            position={{ x: 0, y: 0 }}
            cursor={false}
            filterNull={false}
            isAnimationActive={false}
            {...(tooltipFormatter ? { formatter: tooltipFormatter } : {})}
            content={(tooltip) => (
              <MovingTooltip
                key={animation.animate ? "animated" : "static"}
                tooltip={tooltip}
                transition={animation.transition}
                pointer={animation.pointer}
              />
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
  if (visibleSeries !== undefined && onVisibleSeriesChange !== undefined) {
    return (
      <Chart.Root
        {...rootProps}
        visibleSeries={visibleSeries}
        onVisibleSeriesChange={(series) =>
          onVisibleSeriesChange(
            series.filter(
              (value): value is AreaSeries => value === "desktop" || value === "mobile",
            ),
          )
        }
      >
        {content}
      </Chart.Root>
    );
  }
  return <Chart.Root {...rootProps}>{content}</Chart.Root>;
}

function SingleArea({
  data,
  label,
  formatValue,
  motion: options,
  type,
  gradient,
}: SingleAreaProps & {
  type: "linear" | "monotone" | "stepAfter";
  gradient?: string;
}) {
  const config = {
    value: {
      label,
      color: "var(--chart-1)",
      formatValue: (value) => (typeof value === "number" ? formatValue(value) : "No data"),
    },
  } satisfies Chart.SeriesConfig;
  return (
    <AreaFrame data={data} label={label} config={config} motion={options}>
      {gradient && (
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.42} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
      )}
      <Area
        dataKey="value"
        type={type}
        stroke="var(--color-value)"
        strokeWidth={2}
        fill={gradient ? `url(#${gradient})` : "var(--color-value)"}
        fillOpacity={gradient ? 1 : 0.18}
        connectNulls={false}
        isAnimationActive={false}
      />
    </AreaFrame>
  );
}

export function SmoothArea(props: SingleAreaProps) {
  return <SingleArea {...props} type="monotone" />;
}
export function LinearArea(props: SingleAreaProps) {
  return <SingleArea {...props} type="linear" />;
}
export function StepArea(props: SingleAreaProps) {
  return <SingleArea {...props} type="stepAfter" />;
}
export function GradientArea(props: SingleAreaProps) {
  const id = `area-gradient-${useId().replaceAll(":", "")}`;
  return <SingleArea {...props} type="monotone" gradient={id} />;
}
export function ThresholdArea(props: SingleAreaProps & { threshold: number }) {
  const { threshold, ...area } = props;
  const label = `${area.label} with threshold`;
  const config = {
    value: {
      label: area.label,
      color: "var(--chart-1)",
      formatValue: (value) => (typeof value === "number" ? area.formatValue(value) : "No data"),
    },
  } satisfies Chart.SeriesConfig;
  return (
    <AreaFrame
      data={area.data}
      label={label}
      config={config}
      motion={area.motion}
      threshold={threshold}
    >
      <Area
        dataKey="value"
        type="monotone"
        stroke="var(--color-value)"
        strokeWidth={2}
        fill="var(--color-value)"
        fillOpacity={0.14}
        connectNulls={false}
        isAnimationActive={false}
      />
    </AreaFrame>
  );
}

function StackedAreas({
  data,
  motion: options,
  percentage,
  interactive = false,
  visibleSeries,
  onVisibleSeriesChange,
}: StackedAreaProps & {
  percentage?: boolean;
  interactive?: boolean;
  visibleSeries?: AreaSeries[];
  onVisibleSeriesChange?: (series: AreaSeries[]) => void;
}) {
  const visibilityProps =
    visibleSeries !== undefined && onVisibleSeriesChange !== undefined
      ? {
          visibleSeries,
          onVisibleSeriesChange: (series: string[]) =>
            onVisibleSeriesChange(
              series.filter(
                (value): value is AreaSeries => value === "desktop" || value === "mobile",
              ),
            ),
        }
      : {};
  return (
    <AreaFrame
      data={data}
      label={
        percentage
          ? "Share by device"
          : interactive
            ? "Visitors by device, interactive"
            : "Visitors by device"
      }
      config={stackedConfig}
      motion={options}
      offset={percentage ? "expand" : "none"}
      percentage={percentage ?? false}
      showLegend
      {...visibilityProps}
    >
      {(["mobile", "desktop"] as const).map((key) => (
        <Area
          key={key}
          dataKey={key}
          hide={visibleSeries !== undefined && !visibleSeries.includes(key)}
          type="monotone"
          stackId="devices"
          stroke={`var(--color-${key})`}
          fill={`var(--color-${key})`}
          fillOpacity={key === "mobile" ? 0.26 : 0.58}
          connectNulls={false}
          isAnimationActive={false}
        />
      ))}
    </AreaFrame>
  );
}

export function StackedArea(props: StackedAreaProps) {
  return <StackedAreas {...props} />;
}
export function PercentArea(props: StackedAreaProps) {
  return <StackedAreas {...props} percentage />;
}
export function InteractiveArea(
  props: StackedAreaProps & {
    visibleSeries: AreaSeries[];
    onVisibleSeriesChange: (series: AreaSeries[]) => void;
  },
) {
  return <StackedAreas {...props} interactive />;
}
