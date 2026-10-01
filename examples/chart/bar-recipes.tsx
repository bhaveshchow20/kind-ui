import * as Chart from "@kind-ui/charts";
import { type ReactNode, useId } from "react";
import {
  type BarShapeProps,
  CartesianGrid,
  Cell,
  LabelList,
  type LabelProps,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from "recharts";

export type BarPoint = { category: string; value: number | null };
export type GroupedBarPoint = {
  category: string;
  primary: number | null;
  secondary: number | null;
};
/** A stack is a total: supply complete, nonnegative segments. */
export type StackedBarPoint = { category: string; primary: number; secondary: number };
export type BarMotion = Chart.BarAnimation;
type SingleProps = {
  data: BarPoint[];
  label: string;
  formatValue: (value: number) => string;
  motion?: BarMotion | undefined;
};
type PairConfig = Record<"primary" | "secondary", Chart.SeriesConfig[string]>;
type PairProps = {
  data: GroupedBarPoint[];
  label: string;
  config: PairConfig;
  motion?: BarMotion | undefined;
};

// Shared only where measuring, motion and tooltip wiring are identical. Engine marks stay explicit.
function BarFrame<T extends { category: string }>({
  data,
  label,
  config,
  horizontal = false,
  motion: options,
  children,
  legend,
  formatCategory,
  colorForCategory,
}: {
  data: T[];
  label: string;
  config: Chart.SeriesConfig;
  horizontal?: boolean;
  motion?: BarMotion | undefined;
  children: ReactNode;
  legend?: ReactNode;
  formatCategory?: ((value: string) => string) | undefined;
  colorForCategory?: (category: string) => string | undefined;
}) {
  const id = useId();
  return (
    <Chart.Root config={config} className="recipe-chart">
      {legend}
      <p id={id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <Chart.BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          animate={options ?? false}
          accessibilityLayer
          aria-label={label}
          aria-describedby={id}
          margin={{ top: 24, right: 32, left: 0, bottom: 0 }}
          barCategoryGap="28%"
          barGap={4}
        >
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke="var(--border)" />
          {children}
          <Chart.Tooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            labelFormatter={(value) =>
              formatCategory ? formatCategory(String(value)) : String(value)
            }
            {...(colorForCategory
              ? {
                  content: (tooltip) => (
                    <Chart.TooltipContent
                      tooltip={{
                        ...tooltip,
                        payload: tooltip.payload.map((entry) => {
                          const color = colorForCategory(String(tooltip.label));
                          return color ? { ...entry, color } : entry;
                        }),
                      }}
                    />
                  ),
                }
              : {})}
          />
        </Chart.BarChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
const zeroDomain = ([min, max]: readonly [number, number]): [number, number] => [
  Math.min(0, min),
  Math.max(0, max),
];
function VerticalAxes({
  formatCategory,
}: {
  formatCategory?: ((value: string) => string) | undefined;
}) {
  return (
    <>
      <XAxis
        dataKey="category"
        axisLine={false}
        tickLine={false}
        minTickGap={12}
        {...(formatCategory ? { tickFormatter: formatCategory } : {})}
      />
      <YAxis
        domain={zeroDomain}
        width={36}
        axisLine={false}
        tickLine={false}
        allowDecimals={false}
      />
    </>
  );
}
function HorizontalAxes() {
  return (
    <>
      <XAxis
        type="number"
        domain={zeroDomain}
        axisLine={false}
        tickLine={false}
        allowDecimals={false}
      />
      <YAxis type="category" dataKey="category" width={68} axisLine={false} tickLine={false} />
    </>
  );
}
function singleConfig(label: string, formatValue: SingleProps["formatValue"]): Chart.SeriesConfig {
  return {
    value: {
      label,
      color: "var(--chart-1)",
      formatValue: (value) => (typeof value === "number" ? formatValue(value) : "No data"),
    },
  };
}
export function VerticalBars({ label, formatValue, ...props }: SingleProps) {
  return (
    <BarFrame {...props} label={label} config={singleConfig(label, formatValue)}>
      <VerticalAxes />
      <Chart.BarSeries dataKey="value" fill="var(--color-value)" maxBarSize={40} radius={3} />
    </BarFrame>
  );
}
export function HorizontalBars({ label, formatValue, ...props }: SingleProps) {
  return (
    <BarFrame {...props} label={label} config={singleConfig(label, formatValue)} horizontal>
      <HorizontalAxes />
      <Chart.BarSeries dataKey="value" fill="var(--color-value)" maxBarSize={40} radius={3} />
    </BarFrame>
  );
}
export function GroupedBars(props: PairProps) {
  return (
    <BarFrame {...props} legend={<Chart.Legend />}>
      <VerticalAxes />
      <Chart.BarSeries dataKey="primary" fill="var(--color-primary)" maxBarSize={40} radius={3} />
      <Chart.BarSeries
        dataKey="secondary"
        fill="var(--color-secondary)"
        maxBarSize={40}
        radius={3}
      />
    </BarFrame>
  );
}
export function StackedBars(props: Omit<PairProps, "data"> & { data: StackedBarPoint[] }) {
  return (
    <BarFrame {...props} legend={<Chart.Legend />}>
      <VerticalAxes />
      <Chart.BarSeries
        dataKey="primary"
        fill="var(--color-primary)"
        maxBarSize={40}
        stackId="total"
      />
      <Chart.BarSeries
        dataKey="secondary"
        fill="var(--color-secondary)"
        maxBarSize={40}
        stackId="total"
      />
    </BarFrame>
  );
}
// Recharts omits zero-height bar labels. Annotate known zero with public scales, without inventing a bar.
function ZeroValueLabels({ data }: { data: BarPoint[] }) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  return (
    <g>
      {data
        .filter((point) => point.value === 0)
        .map((point) => {
          const x = xScale?.(point.category, { position: "middle" }),
            y = yScale?.(0);
          return x === undefined || y === undefined ? null : (
            <text
              key={point.category}
              data-bar-zero-label=""
              x={x}
              y={y - 8}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize={11}
            >
              0
            </text>
          );
        })}
    </g>
  );
}
export function LabeledBars({ label, formatValue, ...props }: SingleProps) {
  return (
    <BarFrame {...props} label={label} config={singleConfig(label, formatValue)}>
      <VerticalAxes />
      <ZeroValueLabels data={props.data} />
      <Chart.BarSeries dataKey="value" fill="var(--color-value)" maxBarSize={40} radius={3}>
        <LabelList
          dataKey="value"
          position="top"
          offset={8}
          fill="var(--foreground)"
          fontSize={11}
        />
      </Chart.BarSeries>
    </BarFrame>
  );
}
function CategoryLabel({ viewBox, value }: LabelProps) {
  if (!viewBox || !("width" in viewBox) || typeof value !== "string") return null;
  const { x = 0, y = 0, width = 0, height = 0 } = viewBox;
  // Keep text readable when a short bar cannot contain the category.
  const inside = width >= value.length * 7 + 16;
  return (
    <text
      data-bar-category-label=""
      x={inside ? x + 8 : x}
      y={inside ? y + height / 2 : y - 5}
      dominantBaseline={inside ? "middle" : "auto"}
      fill={inside ? "var(--card)" : "var(--foreground)"}
      fontSize={11}
    >
      {value}
    </text>
  );
}
export function CustomLabelBars({ label, formatValue, ...props }: SingleProps) {
  return (
    <BarFrame {...props} label={label} config={singleConfig(label, formatValue)} horizontal>
      <XAxis
        type="number"
        domain={zeroDomain}
        axisLine={false}
        tickLine={false}
        allowDecimals={false}
      />
      <YAxis type="category" dataKey="category" hide />
      <Chart.BarSeries dataKey="value" fill="var(--color-value)" maxBarSize={30} radius={3}>
        <LabelList dataKey="category" content={<CategoryLabel />} />
        <LabelList
          dataKey="value"
          position="right"
          offset={8}
          fill="var(--foreground)"
          fontSize={11}
        />
      </Chart.BarSeries>
    </BarFrame>
  );
}
export type ColoredBarPoint = BarPoint & { color: string };
export function CategoryBars({
  data,
  label,
  formatValue,
  ...props
}: Omit<SingleProps, "data"> & { data: ColoredBarPoint[] }) {
  return (
    <BarFrame
      {...props}
      data={data}
      label={label}
      config={{}}
      horizontal
      colorForCategory={(category) => data.find((point) => point.category === category)?.color}
    >
      <HorizontalAxes />
      <Chart.BarSeries
        name={label}
        formatter={(value) => (typeof value === "number" ? formatValue(value) : "No data")}
        dataKey="value"
        maxBarSize={40}
        radius={3}
      >
        {data.map((point) => (
          <Cell key={point.category} fill={point.color} />
        ))}
      </Chart.BarSeries>
    </BarFrame>
  );
}
function Highlight({
  x,
  y,
  width,
  height,
  fill,
  index,
  selectedIndex,
}: BarShapeProps & { selectedIndex: number }) {
  return (
    <Rectangle
      data-highlighted={index === selectedIndex ? "true" : "false"}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      radius={3}
      stroke={index === selectedIndex ? "var(--foreground)" : "none"}
      strokeWidth={2}
      strokeDasharray={index === selectedIndex ? "4 3" : "none"}
      fillOpacity={index === selectedIndex ? 0.65 : 1}
    />
  );
}
export function HighlightedBars({
  label,
  formatValue,
  highlightedCategory,
  ...props
}: SingleProps & { highlightedCategory: string | null }) {
  const selectedIndex = props.data.findIndex((point) => point.category === highlightedCategory);
  return (
    <BarFrame {...props} label={label} config={singleConfig(label, formatValue)}>
      <VerticalAxes />
      <Chart.BarSeries
        dataKey="value"
        fill="var(--color-value)"
        maxBarSize={40}
        shape={(shape) => <Highlight {...shape} selectedIndex={selectedIndex} />}
      />
    </BarFrame>
  );
}
export function SignedBars({ data, label, formatValue, ...props }: SingleProps) {
  return (
    <BarFrame
      {...props}
      data={data}
      label={label}
      config={{}}
      colorForCategory={(category) =>
        (data.find((point) => point.category === category)?.value ?? 0) < 0
          ? "var(--chart-2)"
          : "var(--chart-1)"
      }
    >
      <VerticalAxes />
      <ReferenceLine y={0} stroke="var(--foreground)" strokeWidth={1} />
      <Chart.BarSeries
        name={label}
        formatter={(value) => (typeof value === "number" ? formatValue(value) : "No data")}
        dataKey="value"
        maxBarSize={40}
      >
        {data.map((point) => (
          <Cell
            key={point.category}
            fill={(point.value ?? 0) < 0 ? "var(--chart-2)" : "var(--chart-1)"}
          />
        ))}
      </Chart.BarSeries>
    </BarFrame>
  );
}
export function InteractiveBars({
  activeSeries,
  formatCategory,
  ...props
}: PairProps & {
  activeSeries: "primary" | "secondary";
  formatCategory: (value: string) => string;
}) {
  // The host owns selection and summary totals; the selected engine series is explicit.
  return (
    <BarFrame {...props} formatCategory={formatCategory}>
      <VerticalAxes formatCategory={formatCategory} />
      <Chart.BarSeries dataKey={activeSeries} fill={`var(--color-${activeSeries})`} />
    </BarFrame>
  );
}
