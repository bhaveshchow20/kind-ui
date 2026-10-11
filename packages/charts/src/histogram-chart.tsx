"use client";

import { type ComponentProps, createContext, use, useMemo } from "react";
import type { XAxis, YAxis } from "recharts";
import { BarChartImplementation, type BarChartProps } from "./bar-chart.js";
import { XAxis as StyledXAxis, YAxis as StyledYAxis } from "./cartesian-parts.js";
import { type HistogramBin, type HistogramMeasure, validateHistogram } from "./histogram-data.js";

export type HistogramChartProps = Omit<
  BarChartProps,
  "data" | "layout" | "stackOffset" | "barSize" | "barCategoryGap" | "barGap" | "reverseStackOrder"
> & {
  bins: readonly HistogramBin[];
  /** Required: count height or normalized probability density (area sums to one). */
  measure: HistogramMeasure;
};
export type HistogramXAxisProps = Omit<
  ComponentProps<typeof XAxis>,
  "dataKey" | "type" | "domain" | "scale" | "xAxisId" | "allowDataOverflow" | "reversed"
>;
export type HistogramYAxisProps = Omit<
  ComponentProps<typeof YAxis>,
  "dataKey" | "type" | "domain" | "scale" | "yAxisId" | "allowDataOverflow" | "reversed"
>;
const HistogramGeometry = createContext<number[] | null>(null);
export function HistogramXAxis(props: HistogramXAxisProps) {
  const domain = use(HistogramGeometry);
  if (!domain) throw new Error("HistogramChart.XAxis requires HistogramChart");
  return (
    <StyledXAxis
      {...props}
      xAxisId={0}
      dataKey="midpoint"
      type="number"
      scale="linear"
      domain={domain}
      allowDataOverflow
      reversed={false}
    />
  );
}
export function HistogramYAxis(props: HistogramYAxisProps) {
  const domain = use(HistogramGeometry);
  if (!domain) throw new Error("HistogramChart.YAxis requires HistogramChart");
  return (
    <StyledYAxis
      {...props}
      yAxisId={0}
      type="number"
      scale="linear"
      domain={[0, "dataMax"]}
      reversed={false}
    />
  );
}
export const HistogramContext = createContext<HistogramMeasure | null>(null);

/** Bounded vertical histogram geometry; axes and series are explicit children. */
export function HistogramChart({ bins, measure, children, ...props }: HistogramChartProps) {
  if (["xAxisProps", "yAxisProps"].some((key) => Object.hasOwn(props, key)))
    throw new Error(
      "HistogramChart uses explicit XAxis and YAxis parts; root axis options are unsupported",
    );
  const total = validateHistogram(bins);
  if (measure !== "count" && measure !== "density")
    throw new Error("Histogram requires count or density measure");
  const data = useMemo(
    () =>
      bins.map((bin) => {
        const value =
          measure === "count"
            ? bin.count
            : total === 0
              ? 0
              : bin.count / total / (bin.upper - bin.lower);
        if (!Number.isFinite(value) || (bin.count > 0 && value === 0))
          throw new Error("Histogram density exceeds finite positive numeric range");
        return { ...bin, midpoint: bin.lower + (bin.upper - bin.lower) / 2, value };
      }),
    [bins, measure, total],
  );
  const domain = bins.length ? [bins[0]?.lower ?? 0, bins[bins.length - 1]?.upper ?? 1] : [0, 1];
  if (!Number.isFinite((domain[1] ?? 1) - (domain[0] ?? 0)))
    throw new Error("Histogram domain must have a finite span");
  return (
    <HistogramGeometry value={domain}>
      <HistogramContext value={measure}>
        <BarChartImplementation
          family="histogram"
          chartProps={{
            ...props,
            data,
            layout: "horizontal",
            barCategoryGap: 0,
            barGap: 0,
            children,
          }}
        />
      </HistogramContext>
    </HistogramGeometry>
  );
}
