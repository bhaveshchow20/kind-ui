"use client";

import {
  cloneElement,
  type ReactElement,
  use,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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

/** Resolve native CSS paint extent before the browser paints the material. */
function HistogramPaint({
  rectangle,
  material,
  bounds,
}: {
  rectangle: ReactElement<BarShapeProps>;
  material: Exclude<BarMaterial, "plain">;
  bounds: { x: number; y: number; width: number; height: number };
}) {
  const id = `kind-ui-histogram-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}-material`;
  const group = useRef<SVGGElement>(null);
  const [padding, setPadding] = useState(8);
  useLayoutEffect(() => {
    const path = group.current?.querySelector("path");
    if (!path) return;
    const stroke = getComputedStyle(path).strokeWidth;
    let width = Number.parseFloat(stroke);
    if (stroke.endsWith("%")) {
      const svg = path.ownerSVGElement;
      const viewBox = svg?.viewBox.baseVal;
      const width = viewBox?.width || svg?.clientWidth || 0;
      const height = viewBox?.height || svg?.clientHeight || 0;
      const diagonal = Math.hypot(width, height) / Math.SQRT2;
      // SVG percentage stroke widths use the normalized viewport diagonal.
      const percentage = Number.parseFloat(stroke);
      const resolved = (percentage / 100) * diagonal;
      setPadding(8 + (Number.isFinite(resolved) ? Math.max(0, resolved) / 2 : 0));
    } else {
      width = Number.isFinite(width) ? Math.max(0, width) : 0;
      setPadding(8 + width / 2);
    }
  });
  return (
    <g ref={group}>
      <defs data-kind-ui="histogram-material" data-material={material} pointerEvents="none">
        <HistogramMaterialFilter material={material} id={id} bounds={bounds} padding={padding} />
      </defs>
      {cloneElement(rectangle, { filter: `url(#${id})` })}
    </g>
  );
}

function HistogramShape({
  shape,
  material,
  ...props
}: BarShapeProps & Pick<HistogramSeriesProps, "shape" | "material">) {
  const scale = useXAxisScale(0);
  const bin: HistogramBin = props.payload;
  const start = scale?.(bin.lower);
  const end = scale?.(bin.upper);
  if (start === undefined || end === undefined || !Number.isFinite(start) || !Number.isFinite(end))
    return null;
  const geometry = { ...props, x: Math.min(start, end), width: Math.abs(end - start), bin };
  if (shape) return shape(geometry);
  const materialized =
    material !== undefined &&
    material !== "plain" &&
    props.filter === undefined &&
    props.style?.filter === undefined &&
    (props.height ?? 0) > 0 &&
    geometry.width > 0;
  const rectangle = (
    <Rectangle
      {...props}
      x={geometry.x}
      width={geometry.width}
      radius={0}
      data-kind-ui="histogram-bin"
      data-lower={bin.lower}
      data-upper={bin.upper}
      data-count={bin.count}
    />
  );
  return materialized ? (
    <HistogramPaint
      rectangle={rectangle}
      material={material}
      bounds={{ x: geometry.x, y: props.y ?? 0, width: geometry.width, height: props.height ?? 0 }}
    />
  ) : (
    rectangle
  );
}

/** Reuses Bar visibility, native events/Cells, shared tooltip and interrupted/reduced Motion. */
export function HistogramSeries({
  shape,
  material = "plain",
  seriesKey = "count",
  ...props
}: HistogramSeriesProps) {
  const measure = use(HistogramContext);
  if (measure === null) throw new Error("HistogramSeries requires HistogramChart");
  const materialized =
    material !== "plain" &&
    shape === undefined &&
    props.filter === undefined &&
    props.style?.filter === undefined;
  const renderShape = (native: BarShapeProps) => (
    <HistogramShape {...native} shape={shape} material={materialized ? material : undefined} />
  );
  return (
    <BarSeries
      {...props}
      seriesKey={seriesKey}
      dataKey="value"
      xAxisId={0}
      yAxisId={0}
      minPointSize={0}
      shape={renderShape}
      // Keep the corrected quantitative bin in its series paint owner during
      // inspection. Native activeBar portals escape that owner and replace the
      // hovered hit target before its click callback can run.
      activeBar={false}
    />
  );
}
