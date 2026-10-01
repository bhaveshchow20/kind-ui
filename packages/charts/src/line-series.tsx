"use client";

import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";
import { Line } from "recharts";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";
import { type LineMaterial, MaterialCurve } from "./line-material.js";

export type LineSeriesProps = ComponentProps<typeof Line> & {
  /** Metadata/visibility key, required only for function or numeric data keys. */
  seriesKey?: string;
  /** Material on the default SVG curve; custom shape/filter retain consumer ownership. */
  material?: LineMaterial;
};

/** A registered Recharts Line with Root colors and controlled visibility. */
export function LineSeries({
  seriesKey,
  hide,
  stroke,
  className,
  material = "plain",
  renderWhileHidden = false,
  ...props
}: LineSeriesProps & { renderWhileHidden?: boolean }) {
  const { config, visibleSeries } = useChart();
  const { registerSeries, invalidate } = useLineInteraction();
  const generatedId = useId();
  const id = props.id || generatedId;
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
    <Line
      isAnimationActive={false}
      {...props}
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
      id={id}
      hide={renderedHide}
      {...(color !== undefined ? { stroke: color } : {})}
      className={["kind-ui-line-series", className].filter(Boolean).join(" ")}
    />
  );
}
