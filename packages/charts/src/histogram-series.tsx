"use client";

import { type ReactElement, use } from "react";
import { type BarShapeProps, Rectangle, useXAxisScale } from "recharts";
import { BarSeries, type BarSeriesProps } from "./bar-series.js";
import { HistogramContext } from "./histogram-chart.js";
import type { HistogramBin } from "./histogram-data.js";

export type HistogramShapeProps = BarShapeProps & { bin: HistogramBin };
export type HistogramSeriesProps = Omit<
  BarSeriesProps,
  | "data"
  | "dataKey"
  | "shape"
  | "activeBar"
  | "background"
  | "stackId"
  | "minPointSize"
  | "maxBarSize"
  | "barSize"
  | "xAxisId"
  | "yAxisId"
  | "material"
  | "label"
> & {
  /** Native shape extension with corrected quantitative x/width and original bin. */
  shape?: ((props: HistogramShapeProps) => ReactElement) | undefined;
};

function HistogramShape({ shape, ...props }: BarShapeProps & Pick<HistogramSeriesProps, "shape">) {
  const scale = useXAxisScale(0);
  const bin: HistogramBin = props.payload;
  const start = scale?.(bin.lower);
  const end = scale?.(bin.upper);
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end))
    return null;
  const geometry = { ...props, x: Math.min(start, end), width: Math.abs(end - start), bin };
  if (shape) return shape(geometry);
  return (
    <Rectangle
      {...props}
      x={geometry.x}
      width={geometry.width}
      data-kind-ui="histogram-bin"
      data-lower={bin.lower}
      data-upper={bin.upper}
      data-count={bin.count}
    />
  );
}

/** Reuses Bar visibility, native events/Cells, shared tooltip and interrupted/reduced Motion. */
export function HistogramSeries({ shape, seriesKey = "count", ...props }: HistogramSeriesProps) {
  const measure = use(HistogramContext);
  if (measure === null) throw new Error("HistogramSeries requires HistogramChart");
  const renderShape = (native: BarShapeProps) => <HistogramShape {...native} shape={shape} />;
  return (
    <BarSeries
      {...props}
      seriesKey={seriesKey}
      dataKey="value"
      xAxisId={0}
      yAxisId={0}
      minPointSize={0}
      shape={renderShape}
      activeBar={renderShape}
    />
  );
}
