import * as Chart from "@kind-ui/charts";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
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
}: {
  id: string;
  horizontal: boolean;
  options: BarMotion;
}) {
  const area = usePlotArea();
  if (!area) return null;
  return (
    <defs>
      <clipPath id={`${id}-bars`} clipPathUnits="userSpaceOnUse">
        <motion.rect
          data-bar-reveal=""
          x={area.x}
          initial={
            horizontal
              ? { y: area.y, width: 0, height: area.height }
              : { y: area.y + area.height, height: 0, width: area.width }
          }
          animate={{ y: area.y, width: area.width, height: area.height }}
          transition={{
            duration: Math.max(0, options.revealDurationMs ?? 1000) / 1000,
            ease: options.revealEasing ?? [0.25, 0.1, 0.25, 1],
          }}
        />
      </clipPath>
    </defs>
  );
}

// Four recipes share the measured frame. Bars/axes remain direct engine composition.
function BarFrame({
  data,
  label,
  config,
  horizontal = false,
  paired = false,
  stacked = false,
  motion: options,
}: {
  data: BarPoint[] | GroupedBarPoint[];
  label: string;
  config: Chart.SeriesConfig;
  horizontal?: boolean;
  paired?: boolean;
  stacked?: boolean;
  motion?: BarMotion | undefined;
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
    >
      {paired && <Chart.Legend />}
      <p id={animation.id} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart<BarPoint | GroupedBarPoint>
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          accessibilityLayer
          aria-label={label}
          aria-describedby={animation.id}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          barCategoryGap="28%"
          barGap={4}
        >
          {animation.reveal && options && (
            <BarReveal id={animation.id} horizontal={horizontal} options={options} />
          )}
          <CartesianGrid vertical={horizontal} horizontal={!horizontal} stroke="var(--border)" />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                domain={[0, "auto"]}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="category"
                width={68}
                axisLine={false}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis dataKey="category" axisLine={false} tickLine={false} minTickGap={12} />
              <YAxis
                domain={[0, "auto"]}
                width={32}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            position={{ x: 0, y: 0 }}
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
          <Bar
            dataKey={paired ? "primary" : "value"}
            fill={paired ? "var(--color-primary)" : "var(--color-value)"}
            maxBarSize={40}
            radius={stacked ? 0 : 3}
            {...(stacked ? { stackId: "total" } : {})}
            isAnimationActive={false}
          />
          {paired && (
            <Bar
              dataKey="secondary"
              fill="var(--color-secondary)"
              maxBarSize={40}
              radius={stacked ? 0 : 3}
              {...(stacked ? { stackId: "total" } : {})}
              isAnimationActive={false}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Chart.Root>
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
  return <BarFrame {...props} label={label} config={singleConfig(label, formatValue)} />;
}
export function HorizontalBars({ label, formatValue, ...props }: SingleProps) {
  return <BarFrame {...props} label={label} config={singleConfig(label, formatValue)} horizontal />;
}
export function GroupedBars(props: PairProps) {
  return <BarFrame {...props} paired />;
}
export function StackedBars(props: Omit<PairProps, "data"> & { data: StackedBarPoint[] }) {
  return <BarFrame {...props} paired stacked />;
}
