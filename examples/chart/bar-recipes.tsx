import * as Chart from "@kind-ui/charts";
import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import {
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  Cell,
  LabelList,
  type LabelProps,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
} from "recharts";
import { MovingTooltip, type RecipeMotion, useRecipeMotion } from "./recipe-motion.js";

export type BarPoint = { category: string; value: number | null };
export type GroupedBarPoint = {
  category: string;
  primary: number | null;
  secondary: number | null;
};
/** A stack is a total: supply complete, nonnegative segments. */
export type StackedBarPoint = { category: string; primary: number; secondary: number };
export type BarMotion = RecipeMotion;
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

function BarReveal({
  id,
  horizontal,
  options,
  onComplete,
}: {
  id: string;
  horizontal: boolean;
  options: BarMotion;
  onComplete: () => void;
}) {
  const area = usePlotArea();
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const zero = horizontal ? xScale?.(0) : yScale?.(0);
  if (!area || zero === undefined) return null;
  return (
    <defs>
      <clipPath id={`${id}-bars`} clipPathUnits="userSpaceOnUse">
        <motion.rect
          data-bar-reveal=""
          onAnimationComplete={onComplete}
          initial={
            horizontal
              ? { x: zero, y: area.y, width: 0, height: area.height }
              : { x: area.x, y: zero, height: 0, width: area.width }
          }
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
  const animation = useRecipeMotion(options);
  return (
    <Chart.Root
      config={config}
      className="recipe-chart"
      data-bar-reveal={animation.reveal ? "on" : "off"}
      style={
        {
          "--bar-reveal-clip": animation.reveal ? `url(#${animation.id}-bars)` : "none",
        } as CSSProperties
      }
      onFocusCapture={animation.finishReveal}
      onPointerDownCapture={animation.finishReveal}
      onPointerMoveCapture={animation.finishReveal}
      onKeyDownCapture={animation.clearPointer}
    >
      {legend}
      <p id={animation.id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          onMouseMove={animation.trackPointer}
          onMouseLeave={animation.clearPointer}
          accessibilityLayer
          aria-label={label}
          aria-describedby={animation.id}
          margin={{ top: 24, right: 32, left: 0, bottom: 0 }}
          barCategoryGap="28%"
          barGap={4}
        >
          {animation.reveal && options && (
            <BarReveal
              id={animation.id}
              horizontal={horizontal}
              options={options}
              onComplete={animation.finishReveal}
            />
          )}
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke="var(--border)" />
          {children}
          <Tooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            position={{ x: 0, y: 0 }}
            filterNull={false}
            isAnimationActive={false}
            labelFormatter={(value) =>
              formatCategory ? formatCategory(String(value)) : String(value)
            }
            content={(tooltip) => (
              <MovingTooltip
                key={animation.animate ? "animated" : "static"}
                tooltip={
                  colorForCategory
                    ? {
                        ...tooltip,
                        payload: tooltip.payload.map((entry) => {
                          const color = colorForCategory(String(tooltip.label));
                          return color ? { ...entry, color } : entry;
                        }),
                      }
                    : tooltip
                }
                transition={animation.transition}
                pointer={animation.pointer}
              />
            )}
          />
        </BarChart>
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
      <Bar
        dataKey="value"
        fill="var(--color-value)"
        maxBarSize={40}
        radius={3}
        isAnimationActive={false}
      />
    </BarFrame>
  );
}
export function HorizontalBars({ label, formatValue, ...props }: SingleProps) {
  return (
    <BarFrame {...props} label={label} config={singleConfig(label, formatValue)} horizontal>
      <HorizontalAxes />
      <Bar
        dataKey="value"
        fill="var(--color-value)"
        maxBarSize={40}
        radius={3}
        isAnimationActive={false}
      />
    </BarFrame>
  );
}
export function GroupedBars(props: PairProps) {
  return (
    <BarFrame {...props} legend={<Chart.Legend />}>
      <VerticalAxes />
      <Bar
        dataKey="primary"
        fill="var(--color-primary)"
        maxBarSize={40}
        radius={3}
        isAnimationActive={false}
      />
      <Bar
        dataKey="secondary"
        fill="var(--color-secondary)"
        maxBarSize={40}
        radius={3}
        isAnimationActive={false}
      />
    </BarFrame>
  );
}
export function StackedBars(props: Omit<PairProps, "data"> & { data: StackedBarPoint[] }) {
  return (
    <BarFrame {...props} legend={<Chart.Legend />}>
      <VerticalAxes />
      <Bar
        dataKey="primary"
        fill="var(--color-primary)"
        maxBarSize={40}
        stackId="total"
        isAnimationActive={false}
      />
      <Bar
        dataKey="secondary"
        fill="var(--color-secondary)"
        maxBarSize={40}
        stackId="total"
        isAnimationActive={false}
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
      <Bar
        dataKey="value"
        fill="var(--color-value)"
        maxBarSize={40}
        radius={3}
        isAnimationActive={false}
      >
        <LabelList
          dataKey="value"
          position="top"
          offset={8}
          fill="var(--foreground)"
          fontSize={11}
        />
      </Bar>
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
      <Bar
        dataKey="value"
        fill="var(--color-value)"
        maxBarSize={30}
        radius={3}
        isAnimationActive={false}
      >
        <LabelList dataKey="category" content={<CategoryLabel />} />
        <LabelList
          dataKey="value"
          position="right"
          offset={8}
          fill="var(--foreground)"
          fontSize={11}
        />
      </Bar>
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
      <Bar
        name={label}
        formatter={(value) => (typeof value === "number" ? formatValue(value) : "No data")}
        dataKey="value"
        maxBarSize={40}
        radius={3}
        isAnimationActive={false}
      >
        {data.map((point) => (
          <Cell key={point.category} fill={point.color} />
        ))}
      </Bar>
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
      <Bar
        dataKey="value"
        fill="var(--color-value)"
        maxBarSize={40}
        isAnimationActive={false}
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
      <Bar
        name={label}
        formatter={(value) => (typeof value === "number" ? formatValue(value) : "No data")}
        dataKey="value"
        maxBarSize={40}
        isAnimationActive={false}
      >
        {data.map((point) => (
          <Cell
            key={point.category}
            fill={(point.value ?? 0) < 0 ? "var(--chart-2)" : "var(--chart-1)"}
          />
        ))}
      </Bar>
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
      <Bar dataKey={activeSeries} fill={`var(--color-${activeSeries})`} isAnimationActive={false} />
    </BarFrame>
  );
}
