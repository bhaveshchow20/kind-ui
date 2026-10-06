"use client";

import { type ComponentProps, useId, useLayoutEffect, useMemo, useRef } from "react";
import { Line } from "recharts";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";
import { type LineMaterial, MaterialCurve } from "./line-material.js";
import { getProjectedStart, type LineProjection } from "./line-projection.js";
import { PointMarker, type PointStyle } from "./point-marker.js";
import { ProjectedCurve } from "./projected-curve.js";

// Preserve the legacy native defaults while allowing explicit row/value parameters.
type DefaultLineDataKey = Extract<ComponentProps<typeof Line>["dataKey"], (row: never) => unknown>;
export type LineSeriesProps<
  DataPoint = Parameters<DefaultLineDataKey>[0],
  Value = ReturnType<DefaultLineDataKey>,
> = ComponentProps<typeof Line<DataPoint, Value>> & {
  /** Metadata/visibility key, required only for function or numeric data keys. */
  seriesKey?: string;
  /** Caller flags a trailing suffix of projected rows; never generates forecasts. */
  projected?: LineProjection<DataPoint>;
  /** Optional point paint; explicit native dot takes precedence. */
  pointStyle?: PointStyle;
  /** Independent active point paint; explicit native activeDot takes precedence. */
  activePointStyle?: PointStyle;
  /** Material on the default SVG curve; custom shape/filter retain consumer ownership. */
  material?: LineMaterial;
};

/** A registered Recharts Line with Root colors and controlled visibility. */
export function LineSeries<
  DataPoint = Parameters<DefaultLineDataKey>[0],
  Value = ReturnType<DefaultLineDataKey>,
>({
  seriesKey,
  projected,
  pointStyle = "default",
  activePointStyle: _activePointStyle,
  hide,
  stroke,
  className,
  material = "plain",
  renderWhileHidden = false,
  ...props
}: LineSeriesProps<DataPoint, Value> & { renderWhileHidden?: boolean }) {
  const { config, visibleSeries } = useChart();
  const { registerSeries, registerProjection, data, invalidate } = useLineInteraction();
  const generatedId = useId();
  const id = props.id || generatedId;
  // Shared context erases row generics; chart-owned rows follow this series
  // caller-declared native data contract, just like a function dataKey.
  const rows = props.data ?? (data as typeof props.data);
  const isProjected = projected?.isProjected;
  const projection = useMemo(() => {
    const start = isProjected && rows ? getProjectedStart(rows, isProjected) : (rows?.length ?? 0);
    return { start, projectedRows: new Set<unknown>(rows?.slice(start)) };
  }, [rows, isProjected]);
  const { start, projectedRows } = projection;
  useLayoutEffect(() => {
    if (!isProjected) return;
    return registerProjection(id, (datum, activeIndex) => {
      const index =
        typeof activeIndex === "string" || typeof activeIndex === "number"
          ? Number(activeIndex)
          : NaN;
      // Index disambiguates repeated payloads; separate series data may use another index space.
      if (Number.isInteger(index) && rows?.[index] === datum) return index >= start;
      return projectedRows.has(datum);
    });
  }, [id, isProjected, rows, start, projectedRows, registerProjection]);
  const key = seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const effectiveHide =
    hide === true || (visibleSeries !== undefined && !visibleSeries.includes(key ?? ""));
  const renderedHide = hide === true || (!renderWhileHidden && effectiveHide);
  const previous = useRef({ data: props.data, hide: effectiveHide, renderedHide });
  useLayoutEffect(() => {
    if (
      props.data !== previous.current.data ||
      effectiveHide !== previous.current.hide ||
      renderedHide !== previous.current.renderedHide
    )
      invalidate();
    previous.current = { data: props.data, hide: effectiveHide, renderedHide };
  }, [props.data, effectiveHide, renderedHide, invalidate]);
  useLayoutEffect(() => {
    if (key === undefined) return;
    return registerSeries(id, key);
  }, [id, key, registerSeries]);
  if (key === undefined && visibleSeries !== undefined)
    throw new Error("LineSeries requires seriesKey for controlled non-string dataKey");
  const color = stroke ?? (key && Object.hasOwn(config, key) ? `var(--color-${key})` : undefined);
  return (
    <Line<DataPoint, Value>
      isAnimationActive={false}
      {...props}
      {...(props.dot === undefined && pointStyle !== "default"
        ? { dot: <PointMarker variant={pointStyle} /> }
        : {})}
      {...(material !== "plain" && props.shape === undefined && props.filter === undefined
        ? {
            shape: (
              <MaterialCurve
                material={material}
                filterId={`${generatedId}-material`}
                materialWidth={
                  props.strokeWidth ?? (material === "clay" ? 6 : material === "paper" ? 2.5 : 3)
                }
              />
            ),
            strokeLinecap: props.strokeLinecap ?? (props.strokeDasharray ? "butt" : "round"),
            strokeLinejoin: props.strokeLinejoin ?? "round",
          }
        : {})}
      {...(projected !== undefined && props.shape === undefined
        ? {
            shape: (
              <ProjectedCurve
                projectedRows={projectedRows}
                projectedDasharray={projected.strokeDasharray ?? "4 4"}
                material={props.filter === undefined ? material : "plain"}
                filterId={`${generatedId}-projection`}
                materialWidth={
                  props.strokeWidth ?? (material === "clay" ? 6 : material === "paper" ? 2.5 : 3)
                }
              />
            ),
          }
        : {})}
      id={id}
      hide={renderedHide}
      {...(color !== undefined ? { stroke: color } : {})}
      className={["kind-ui-line-series", className].filter(Boolean).join(" ")}
    />
  );
}
