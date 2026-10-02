"use client";

import { type ReactElement, use, useId } from "react";
import { type BarShapeProps, Rectangle, useXAxisScale } from "recharts";
import type { BarMaterial } from "./bar-material.js";
import { BarSeries, type BarSeriesProps } from "./bar-series.js";
import { HistogramContext } from "./histogram-chart.js";
import type { HistogramBin } from "./histogram-data.js";
import { HistogramMaterialFilter } from "./histogram-material.js";

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
  /** Static finish on corrected native bin rectangles; custom paint retains ownership. */
  material?: BarMaterial | undefined;
  /** Native shape extension with corrected quantitative x/width and original bin. */
  shape?: ((props: HistogramShapeProps) => ReactElement) | undefined;
};

function HistogramShape({
  shape,
  materialFilter,
  ...props
}: BarShapeProps & Pick<HistogramSeriesProps, "shape"> & { materialFilter?: string | undefined }) {
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
      radius={0}
      {...(materialFilter && props.filter === undefined && props.style?.filter === undefined
        ? { filter: materialFilter }
        : {})}
      data-kind-ui="histogram-bin"
      data-lower={bin.lower}
      data-upper={bin.upper}
      data-count={bin.count}
    />
  );
}

/** Reuses Bar visibility, native events/Cells, shared tooltip and interrupted/reduced Motion. */
export function HistogramSeries({
  shape,
  material = "plain",
  seriesKey = "count",
  ...props
}: HistogramSeriesProps) {
  const id = `kind-ui-histogram-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}-material`;
  const measure = use(HistogramContext);
  if (measure === null) throw new Error("HistogramSeries requires HistogramChart");
  const materialized =
    material !== "plain" &&
    shape === undefined &&
    props.filter === undefined &&
    props.style?.filter === undefined;
  const renderShape = (native: BarShapeProps) => (
    <HistogramShape
      {...native}
      shape={shape}
      materialFilter={materialized ? `url(#${id})` : undefined}
    />
  );
  return (
    <>
      {materialized && (
        <defs data-kind-ui="histogram-material" data-material={material} pointerEvents="none">
          <HistogramMaterialFilter material={material} id={id} />
        </defs>
      )}
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
    </>
  );
}
