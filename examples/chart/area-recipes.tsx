import * as Chart from "@kind-ui/charts";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "@kind-ui/charts";
import { type ReactNode, useId } from "react";

export type AreaPoint = { period: string; value: number | null };
/** A complete stack has numeric values for every series at each period. */
export type StackedAreaPoint = { period: string; desktop: number; mobile: number };
export type AreaMotion = Chart.AreaAnimation;
export type AreaSeriesConfig = Record<"desktop" | "mobile", Chart.SeriesConfig[string]>;
type SingleAreaProps = {
  data: AreaPoint[];
  label: string;
  formatValue: (value: number) => string;
  motion?: AreaMotion | undefined;
  material?: Chart.AreaMaterial | undefined;
};
type StackedAreaProps = {
  data: StackedAreaPoint[];
  label: string;
  config: AreaSeriesConfig;
  motion?: AreaMotion | undefined;
  material?: Chart.AreaMaterial | undefined;
};
type AreaSeries = "desktop" | "mobile";
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
  const id = useId();
  const rawStackValues: Chart.PercentStackOptions["values"] = (entry) => {
    if (entry.dataKey !== "desktop" && entry.dataKey !== "mobile") return undefined;
    const row = entry.payload as StackedAreaPoint | undefined;
    if (!row) return undefined;
    return (["desktop", "mobile"] as const)
      .filter((key) => visibleSeries === undefined || visibleSeries.includes(key))
      .map((key) => row[key]);
  };
  const percentStack = Chart.createPercentStack({ values: rawStackValues });
  const tooltipFormatter: Chart.TooltipProps["formatter"] = (value, _name, entry) => {
    const total = rawStackValues(entry)?.reduce<number>((sum, member) => sum + (member ?? 0), 0);
    if (total === undefined || total <= 0) return "No share";
    const fraction = percentStack.normalizedValue(entry);
    return fraction === undefined ? value : `${(fraction * 100).toFixed(0)}%`;
  };
  const rootProps = {
    config,
    className: "recipe-chart",
  };
  const content = (
    <>
      {(showLegend || (visibleSeries !== undefined && onVisibleSeriesChange !== undefined)) && (
        <Chart.Legend />
      )}
      <p id={id} className="recipe-help">
        Use left and right arrow keys to explore values. Escape dismisses the tooltip.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <Chart.AreaChart
          data={data}
          stackOffset={offset}
          accessibilityLayer
          aria-label={label}
          aria-describedby={id}
          animate={options ?? false}
          margin={{ top: 20, right: 12, bottom: 0, left: 0 }}
        >
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
                  tickFormatter: percentStack.tickFormatter,
                }
              : {})}
            width={36}
          />
          <Chart.Tooltip {...(percentage ? { formatter: tooltipFormatter } : {})} />
        </Chart.AreaChart>
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
  material,
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
      <Chart.AreaSeries
        material={material ?? "plain"}
        dataKey="value"
        type={type}
        stroke="var(--color-value)"
        strokeWidth={2}
        fill={gradient ? `url(#${gradient})` : "var(--color-value)"}
        fillOpacity={gradient ? 1 : material === "clay" ? 0.65 : 0.18}
        connectNulls={false}
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
      <Chart.AreaSeries
        material={area.material ?? "plain"}
        dataKey="value"
        type="monotone"
        stroke="var(--color-value)"
        strokeWidth={2}
        fill="var(--color-value)"
        fillOpacity={area.material === "clay" ? 0.65 : 0.14}
        connectNulls={false}
      />
    </AreaFrame>
  );
}

function StackedAreas({
  data,
  label,
  config,
  motion: options,
  percentage,
  material,
  visibleSeries,
  onVisibleSeriesChange,
}: StackedAreaProps & {
  percentage?: boolean;
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
      label={label}
      config={config}
      motion={options}
      offset={percentage ? "expand" : "none"}
      percentage={percentage ?? false}
      showLegend
      {...visibilityProps}
    >
      {(["mobile", "desktop"] as const).map((key) => (
        <Chart.AreaSeries
          key={key}
          material={material ?? "plain"}
          dataKey={key}
          hide={visibleSeries !== undefined && !visibleSeries.includes(key)}
          type="monotone"
          stackId="devices"
          stroke={`var(--color-${key})`}
          fill={config[key].pattern ? undefined : `var(--color-${key})`}
          fillOpacity={key === "mobile" ? 0.26 : 0.58}
          connectNulls={false}
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
  return <StackedAreas {...props} />;
}
