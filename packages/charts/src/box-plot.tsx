"use client";

import {
  type ComponentPropsWithRef,
  type ReactNode,
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type BarShapeProps, useChartLayout, useXAxisScale, useYAxisScale } from "recharts";
import { BarChartImplementation, type BarChartProps } from "./bar-chart.js";
import { BarSeries, type BarSeriesProps } from "./bar-series.js";
import { BoxMaterialFilter, type BoxPlotMaterial } from "./box-material.js";

/** Caller-computed statistics; no sample, quartile or fence convention is inferred. */
export type BoxPlotSummary = {
  lowerWhisker: number;
  q1: number;
  median: number;
  q3: number;
  upperWhisker: number;
  outliers?: readonly number[];
};
const fields = ["lowerWhisker", "q1", "median", "q3", "upperWhisker"] as const;

/** Null/undefined mean missing. Malformed present summaries throw rather than fabricate values. */
export function validateBoxPlotSummary(value: unknown): BoxPlotSummary | null {
  if (value == null) return null;
  if (typeof value !== "object") throw new Error("BoxPlot summary must be an object or null");
  const record = value as Record<string, unknown>;
  for (const field of fields) {
    if (typeof record[field] !== "number" || !Number.isFinite(record[field]))
      throw new Error(`BoxPlot ${field} must be a finite number`);
  }
  const summary = value as BoxPlotSummary;
  if (
    summary.lowerWhisker > summary.q1 ||
    summary.q1 > summary.median ||
    summary.median > summary.q3 ||
    summary.q3 > summary.upperWhisker
  )
    throw new Error("BoxPlot requires lowerWhisker <= q1 <= median <= q3 <= upperWhisker");
  if (summary.outliers !== undefined) {
    if (!Array.isArray(summary.outliers)) throw new Error("BoxPlot outliers must be an array");
    for (const outlier of summary.outliers) {
      if (typeof outlier !== "number" || !Number.isFinite(outlier))
        throw new Error("BoxPlot outliers must be finite numbers");
      if (outlier >= summary.lowerWhisker && outlier <= summary.upperWhisker)
        throw new Error("BoxPlot outliers must lie strictly outside the whiskers");
    }
  }
  return summary;
}

/** The complete native range includes every explicitly supplied outlier. */
export function boxPlotExtent(summary: BoxPlotSummary): [number, number] {
  validateBoxPlotSummary(summary);
  let low = summary.lowerWhisker;
  let high = summary.upperWhisker;
  for (const value of summary.outliers ?? []) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  return [low, high];
}

export type BoxPlotChartProps = BarChartProps;
/** Public Bar composition; Recharts owns axes, layout, domains and keyboard selection. */
export function BoxPlotChart(props: BoxPlotChartProps) {
  return <BarChartImplementation chartProps={props} family="box-plot" />;
}

export type BoxPlotMarkProps = Omit<ComponentPropsWithRef<"g">, "children"> & {
  /** Screen coordinates, already mapped by the consumer's numeric axis. */
  coordinates: BoxPlotSummary;
  /** Center and width on the category axis, in chart pixels. */
  center: number;
  size: number;
  orientation?: "vertical" | "horizontal";
  outlierRadius?: number | undefined;
  /** Static finish; explicit filters/styles retain consumer ownership. */
  material?: BoxPlotMaterial | undefined;
};
/** A reusable SVG mark. Zero IQR remains a line; no minimum numeric extent is invented. */
export function BoxPlotMark({
  coordinates: c,
  center,
  size,
  orientation = "vertical",
  outlierRadius = 3,
  strokeWidth = 1.5,
  material = "plain",
  ...props
}: BoxPlotMarkProps) {
  const id = `kind-ui-box-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const node = useRef<SVGGElement>(null);
  useImperativeHandle(props.ref, () => {
    if (!node.current) throw new Error("Missing BoxPlot mark ref");
    return node.current;
  }, []);
  const width = props.style?.strokeWidth ?? strokeWidth;
  const resolvedWidth = Number.parseFloat(String(width));
  const miter = Number(props.style?.strokeMiterlimit ?? props.strokeMiterlimit ?? 4);
  const initialPadding =
    Number.isFinite(resolvedWidth) && Number.isFinite(miter)
      ? (Math.max(0, resolvedWidth) * Math.max(1, miter)) / 2
      : 0;
  const [paintPadding, setPaintPadding] = useState(initialPadding);
  const materialized =
    material !== "plain" && props.filter === undefined && props.style?.filter === undefined;
  // Native child selectors can change individual stroke widths. Read their resolved
  // paint after layout, before first paint, without moving the marks or their refs.
  useLayoutEffect(() => {
    const mark = node.current;
    if (!materialized || !mark) return;
    const measure = () => {
      let padding = initialPadding;
      for (const part of Array.from(mark.querySelectorAll<SVGElement>("[data-box-part]"))) {
        const style = getComputedStyle(part);
        let width = Number.parseFloat(style.strokeWidth);
        if (style.strokeWidth.endsWith("%")) {
          const svg = part.ownerSVGElement;
          const viewport = svg?.viewBox.baseVal;
          const w = viewport?.width || svg?.width.baseVal.value || 0;
          const h = viewport?.height || svg?.height.baseVal.value || 0;
          width = ((width / 100) * Math.hypot(w, h)) / Math.SQRT2;
        }
        const limit = Number.parseFloat(style.strokeMiterlimit);
        if (Number.isFinite(width))
          padding = Math.max(
            padding,
            (width * (Number.isFinite(limit) ? Math.max(1, limit) : 4)) / 2,
          );
      }
      setPaintPadding((previous) => (previous === padding ? previous : padding));
    };
    measure();
    // Stylesheets and ancestor theme classes can change paint without a React
    // update. Observe the actual ownership chain, plus stylesheet loads/edits.
    const observer = new MutationObserver(measure);
    observer.observe(mark, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class", "style", "stroke", "stroke-width", "stroke-miterlimit"],
    });
    for (let ancestor = mark.parentElement; ancestor; ancestor = ancestor.parentElement)
      observer.observe(ancestor, { attributes: true, attributeFilter: ["class", "style"] });
    if (mark.ownerSVGElement)
      observer.observe(mark.ownerSVGElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "style", "stroke", "stroke-width", "stroke-miterlimit"],
      });
    observer.observe(mark.ownerDocument.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    const resize = new ResizeObserver(measure);
    if (mark.ownerSVGElement) resize.observe(mark.ownerSVGElement);
    const view = mark.ownerDocument.defaultView;
    view?.addEventListener("resize", measure);
    mark.ownerDocument.addEventListener("load", measure, true);
    mark.addEventListener("pointerover", measure);
    mark.addEventListener("pointerout", measure);
    const dark = view?.matchMedia("(prefers-color-scheme: dark)");
    dark?.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      resize.disconnect();
      view?.removeEventListener("resize", measure);
      mark.ownerDocument.removeEventListener("load", measure, true);
      mark.removeEventListener("pointerover", measure);
      mark.removeEventListener("pointerout", measure);
      dark?.removeEventListener("change", measure);
    };
  });
  const horizontal = orientation === "horizontal";
  const start = center - size / 2;
  const low = Math.min(c.q1, c.q3);
  const length = Math.abs(c.q3 - c.q1);
  const line = (a: number, b: number, value: number, key: string) => (
    <line
      key={key}
      data-box-part={key}
      {...(horizontal
        ? { x1: value, x2: value, y1: a, y2: b }
        : { x1: a, x2: b, y1: value, y2: value })}
    />
  );
  const parts = (
    <>
      <line
        data-box-part="whisker"
        {...(horizontal
          ? { x1: c.lowerWhisker, x2: c.upperWhisker, y1: center, y2: center }
          : { y1: c.lowerWhisker, y2: c.upperWhisker, x1: center, x2: center })}
      />
      {line(center - size / 4, center + size / 4, c.lowerWhisker, "lower-cap")}
      {line(center - size / 4, center + size / 4, c.upperWhisker, "upper-cap")}
      <rect
        data-box-part="box"
        fillOpacity={
          props.fillOpacity === undefined && props.style?.fillOpacity === undefined
            ? 0.18
            : undefined
        }
        {...(horizontal
          ? { x: low, y: start, width: length, height: size }
          : { x: start, y: low, width: size, height: length })}
      />
      {length === 0 && line(start, start + size, c.q1, "collapsed-box")}
      {line(start, start + size, c.median, "median")}
      {(c.outliers ?? []).map((value, index) => (
        <circle
          // Stateless duplicate observations retain their separate marks.
          // biome-ignore lint/suspicious/noArrayIndexKey: Explicit duplicate outliers have no unique identity.
          key={`${index}/${value}`}
          data-box-part="outlier"
          fill="none"
          r={outlierRadius}
          {...(horizontal ? { cx: value, cy: center } : { cx: center, cy: value })}
        />
      ))}
    </>
  );
  return (
    <g
      data-kind-ui="box-plot-mark"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      {...props}
      {...(materialized ? { filter: `url(#${id})` } : {})}
      ref={node}
    >
      {materialized && (
        <defs data-kind-ui="box-material" data-material={material} pointerEvents="none">
          <BoxMaterialFilter
            material={material}
            id={id}
            coordinates={c}
            center={center}
            size={size}
            horizontal={horizontal}
            outlierRadius={outlierRadius}
            strokePadding={Math.max(initialPadding, paintPadding)}
          />
        </defs>
      )}
      {parts}
    </g>
  );
}

export type BoxPlotShapeProps = BoxPlotMarkProps & {
  summary: BoxPlotSummary;
  native: BarShapeProps;
};
export type BoxPlotSeriesProps<Row extends object = Record<string, unknown>> = Omit<
  BarSeriesProps,
  | "dataKey"
  | "shape"
  | "activeBar"
  | "material"
  | "stackId"
  | "minPointSize"
  | "background"
  | "radius"
> & {
  /** Direct property name or accessor. Nested paths are not interpreted. */
  dataKey: (keyof Row & string) | ((row: Row) => BoxPlotSummary | null | undefined);
  /** Required metadata/visibility key, independent of the computed native range. */
  seriesKey: string;
  material?: BoxPlotMaterial | undefined;
  shape?: (props: BoxPlotShapeProps) => ReactNode;
  markProps?: Omit<ComponentPropsWithRef<"g">, "children">;
  outlierRadius?: number | undefined;
};

function ScaledMark({
  summary,
  native,
  shape,
  markProps,
  outlierRadius,
  material,
  xAxisId,
  yAxisId,
}: {
  material: BoxPlotMaterial;
  summary: BoxPlotSummary | null;
  native: BarShapeProps;
  shape: BoxPlotSeriesProps["shape"];
  markProps: BoxPlotSeriesProps["markProps"];
  outlierRadius: number | undefined;
  xAxisId: BarSeriesProps["xAxisId"];
  yAxisId: BarSeriesProps["yAxisId"];
}) {
  const layout = useChartLayout();
  const xScale = useXAxisScale(xAxisId);
  const yScale = useYAxisScale(yAxisId);
  if (!summary) return null;
  const horizontal = layout === "vertical";
  const scale = horizontal ? xScale : yScale;
  if (!scale) return null;
  const values = fields.map((field) => scale(summary[field]));
  const outliers = (summary.outliers ?? []).map((value) => scale(value));
  if (
    [...values, ...outliers].some((value) => typeof value !== "number" || !Number.isFinite(value))
  )
    return null;
  const [lowerWhisker, q1, median, q3, upperWhisker] = values as [
    number,
    number,
    number,
    number,
    number,
  ];
  const center = horizontal ? native.y + native.height / 2 : native.x + native.width / 2;
  const size = Math.abs(horizontal ? native.height : native.width);
  const props: BoxPlotShapeProps = {
    fill: native.fill,
    stroke: native.stroke ?? native.fill,
    fillOpacity: native.fillOpacity,
    fillRule: native.fillRule,
    opacity: native.opacity,
    strokeOpacity: native.strokeOpacity,
    strokeWidth: native.strokeWidth,
    strokeDasharray: native.strokeDasharray,
    strokeDashoffset: native.strokeDashoffset,
    strokeLinecap: native.strokeLinecap,
    strokeLinejoin: native.strokeLinejoin,
    strokeMiterlimit: native.strokeMiterlimit,
    vectorEffect: native.vectorEffect,
    color: native.color,
    className: native.className,
    style: native.style,
    filter: native.filter,
    clipPath: native.clipPath,
    mask: native.mask,
    visibility: native.visibility,
    ...markProps,
    coordinates: { lowerWhisker, q1, median, q3, upperWhisker, outliers: outliers as number[] },
    center,
    size,
    orientation: horizontal ? "horizontal" : "vertical",
    outlierRadius,
    summary,
    native,
  };
  if (shape) return shape(props);
  const { summary: _summary, native: _native, ...mark } = props;
  return <BoxPlotMark {...mark} material={material} />;
}

/** Registered range Bar with truthful summary geometry through public scale hooks. */
export function BoxPlotSeries<Row extends object = Record<string, unknown>>({
  dataKey,
  seriesKey,
  shape,
  markProps,
  outlierRadius,
  material = "plain",
  ...props
}: BoxPlotSeriesProps<Row>) {
  const read = useCallback(
    (row: Row) =>
      row == null
        ? null
        : validateBoxPlotSummary(typeof dataKey === "function" ? dataKey(row) : row[dataKey]),
    [dataKey],
  );
  const extent = useCallback(
    (row: unknown) => {
      const summary = read(row as Row);
      return summary ? boxPlotExtent(summary) : null;
    },
    [read],
  );
  const render = useMemo(
    () => (native: BarShapeProps) => (
      <ScaledMark
        summary={read(native.payload)}
        native={native}
        shape={shape}
        material={material}
        markProps={markProps}
        outlierRadius={outlierRadius}
        xAxisId={props.xAxisId}
        yAxisId={props.yAxisId}
      />
    ),
    [read, shape, material, markProps, outlierRadius, props.xAxisId, props.yAxisId],
  );
  return (
    <BarSeries {...props} seriesKey={seriesKey} dataKey={extent} shape={render} activeBar={false} />
  );
}
