"use client";

import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";
import { Area } from "recharts";
import { ActiveMarker } from "./animation.js";
import { type AreaMaterial, MaterialArea } from "./area-material.js";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";
import { PointMarker, type PointStyle } from "./point-marker.js";

export type AreaSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Area<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Metadata/visibility key, required only for function or numeric data keys. */
  seriesKey?: string;
  /** Optional point paint; explicit native dot takes precedence. */
  pointStyle?: PointStyle;
  /** Independent active point paint; explicit native activeDot takes precedence. */
  activePointStyle?: PointStyle;
  /** Finish on the native area; explicit shape/filter retain consumer ownership. */
  material?: AreaMaterial;
};

/** A registered Recharts Area with Root colors and controlled visibility. */
export function AreaSeries<DataPoint = unknown, Value = unknown>({
  seriesKey,
  pointStyle = "default",
  activePointStyle = "default",
  material = "plain",
  hide,
  stroke,
  fill,
  className,
  ...props
}: AreaSeriesProps<DataPoint, Value>) {
  // Diagnose unsupported JavaScript/spread input without adding it to the public Area API.
  const { dashAnimation, ...nativeProps } = props as typeof props & { dashAnimation?: unknown };
  useLayoutEffect(() => {
    if (dashAnimation !== undefined && process.env.NODE_ENV === "development")
      console.warn(
        "AreaSeries does not support dashAnimation. Remove it or use LineSeries with strokeDasharray for animated dashes.",
      );
  }, [dashAnimation]);
  const { config, visibleSeries } = useChart();
  const { registerSeries, invalidate } = useLineInteraction();
  const generatedId = useId();
  const id = props.id || generatedId;
  const key = seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const effectiveHide =
    hide === true || (visibleSeries !== undefined && !visibleSeries.includes(key ?? ""));
  const previous = useRef({ data: props.data, hide: effectiveHide });
  useLayoutEffect(() => {
    if (props.data !== previous.current.data || effectiveHide !== previous.current.hide)
      invalidate();
    previous.current = { data: props.data, hide: effectiveHide };
  }, [props.data, effectiveHide, invalidate]);
  useLayoutEffect(() => {
    if (key === undefined) return;
    return registerSeries(id, key);
  }, [id, key, registerSeries]);
  if (key === undefined && visibleSeries !== undefined)
    throw new Error("AreaSeries requires seriesKey for controlled non-string dataKey");
  const color = stroke ?? (key && Object.hasOwn(config, key) ? `var(--color-${key})` : undefined);
  return (
    <Area
      activeDot={<ActiveMarker variant={activePointStyle} />}
      {...nativeProps}
      {...(props.dot === undefined && pointStyle !== "default"
        ? { dot: <PointMarker variant={pointStyle} /> }
        : {})}
      {...(material !== "plain" && props.shape === undefined && props.filter === undefined
        ? { shape: <MaterialArea material={material} filterId={`${generatedId}-area-material`} /> }
        : {})}
      isAnimationActive={false}
      id={id}
      hide={effectiveHide}
      {...(color !== undefined ? { stroke: color } : {})}
      {...(fill !== undefined ? { fill } : color !== undefined ? { fill: color } : {})}
      className={["kind-ui-area-series", className].filter(Boolean).join(" ")}
    />
  );
}
