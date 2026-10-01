import * as Chart from "@kind-ui/charts";
import { motion, type Transition } from "motion/react";
import { type CSSProperties, useId, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotionPreference } from "./use-reduced-motion.js";

export type TrendPoint = { period: string; value: number | null };
export type ComparisonPoint = { period: string; current: number | null; previous: number | null };
/** Recipe-local mark reveal; omit to keep marks static. Duration is in milliseconds. */
export type LineReveal = { durationMs?: number; easing?: Transition["ease"] };
function revealStyle(id: string, enabled: boolean): CSSProperties {
  return { "--line-reveal-clip": enabled ? `url(#${id}-reveal)` : "none" } as CSSProperties;
}
function Reveal({ id, reveal }: { id: string; reveal: LineReveal }) {
  return (
    <defs>
      <clipPath id={`${id}-reveal`} clipPathUnits="userSpaceOnUse">
        <motion.rect
          x={0}
          y={0}
          height="100%"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: Math.max(0, reveal.durationMs ?? 500) / 1000,
            ease: reveal.easing ?? [0.22, 1, 0.36, 1],
          }}
        />
      </clipPath>
    </defs>
  );
}
type TrendProps = {
  data: TrendPoint[];
  label: string;
  formatValue: (value: number) => string;
  reveal?: LineReveal | undefined;
};

/** Copyable composition: the host supplies data, copy, units and motion policy. */
export function TrendLine({ data, label, formatValue, reveal }: TrendProps) {
  const helpId = useId();
  const reducedMotion = useReducedMotionPreference();
  const [interacted, setInteracted] = useState(false);
  const enabled = reveal !== undefined && !reducedMotion && !interacted;
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
      data-reveal={enabled ? "on" : "off"}
      style={revealStyle(helpId, enabled)}
      onFocusCapture={() => setInteracted(true)}
    >
      <p id={helpId} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip.
      </p>
      <ResponsiveContainer width="100%" height={144}>
        <LineChart
          data={data}
          accessibilityLayer
          aria-label={label}
          aria-describedby={helpId}
          margin={{ top: 12, right: 12, left: 12, bottom: 0 }}
        >
          {enabled && reveal && <Reveal id={helpId} reveal={reveal} />}
          <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip
            filterNull={false}
            isAnimationActive={false}
            content={(tooltip) => <Chart.TooltipContent tooltip={tooltip} />}
          />
          <Line
            dataKey="value"
            type="linear"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-value)", stroke: "var(--card)" }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}

export function TargetLine({
  data,
  label,
  formatValue,
  target,
  targetLabel,
  reveal,
}: TrendProps & { target: number; targetLabel: string }) {
  const helpId = useId();
  const reducedMotion = useReducedMotionPreference();
  const [interacted, setInteracted] = useState(false);
  const enabled = reveal !== undefined && !reducedMotion && !interacted;
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
      data-reveal={enabled ? "on" : "off"}
      style={revealStyle(helpId, enabled)}
      onFocusCapture={() => setInteracted(true)}
    >
      <p id={helpId} className="recipe-help">
        Use left and right arrow keys to explore. Escape dismisses the tooltip. {targetLabel}:{" "}
        {formatValue(target)}.
      </p>
      <ResponsiveContainer width="100%" height={196}>
        <LineChart
          data={data}
          accessibilityLayer
          aria-label={label}
          aria-describedby={helpId}
          margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
        >
          {enabled && reveal && <Reveal id={helpId} reveal={reveal} />}
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
            filterNull={false}
            isAnimationActive={false}
            content={(tooltip) => <Chart.TooltipContent tooltip={tooltip} />}
          />
          <Line
            dataKey="value"
            type="linear"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-value)", stroke: "var(--card)" }}
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
  reveal,
}: {
  data: ComparisonPoint[];
  config: Chart.SeriesConfig & Record<"current" | "previous", Chart.SeriesConfig[string]>;
  visibleSeries: string[];
  onVisibleSeriesChange: (keys: string[]) => void;
  label: string;
  reveal?: LineReveal | undefined;
}) {
  const helpId = useId();
  const reducedMotion = useReducedMotionPreference();
  const [interacted, setInteracted] = useState(false);
  const enabled = reveal !== undefined && !reducedMotion && !interacted;
  return (
    <Chart.Root
      config={config}
      visibleSeries={visibleSeries}
      onVisibleSeriesChange={onVisibleSeriesChange}
      className="recipe-chart"
      data-reveal={enabled ? "on" : "off"}
      style={revealStyle(helpId, enabled)}
      onFocusCapture={() => setInteracted(true)}
    >
      <Chart.Legend aria-label={`${label} series`} />
      <p id={helpId} className="recipe-help">
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
            aria-describedby={helpId}
            margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
          >
            {enabled && reveal && <Reveal id={helpId} reveal={reveal} />}
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="period" axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis width={36} axisLine={false} tickLine={false} domain={[0, "auto"]} />
            <Tooltip
              filterNull={false}
              isAnimationActive={false}
              content={(tooltip) => <Chart.TooltipContent tooltip={tooltip} />}
            />
            <Line
              dataKey="current"
              type="linear"
              stroke="var(--color-current)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-current)" }}
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
              dot={{ r: 3, fill: "var(--card)", strokeWidth: 2 }}
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
