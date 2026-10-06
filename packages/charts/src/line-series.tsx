"use client";

import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";
import { DefaultZIndexes, Line, ZIndexLayer } from "recharts";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";
import { type LineMaterial, MaterialCurve } from "./line-material.js";
import { SeriesInteractionLayer, useSeriesInteraction } from "./series-interaction.js";
import { PointMarker, type PointStyle } from "./point-marker.js";

// Preserve the legacy native defaults while allowing explicit row/value parameters.
type DefaultLineDataKey = Extract<ComponentProps<typeof Line>["dataKey"], (row: never) => unknown>;
export type LineSeriesProps<
  DataPoint = Parameters<DefaultLineDataKey>[0],
  Value = ReturnType<DefaultLineDataKey>,
> = ComponentProps<typeof Line<DataPoint, Value>> & {
  /** Metadata/visibility key, required only for function or numeric data keys. */
  seriesKey?: string;
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
  pointStyle = "default",
  activePointStyle: _activePointStyle,
  hide,
  stroke,
  className,
  material = "plain",
  renderWhileHidden = false,
  ...props
}: LineSeriesProps<DataPoint, Value> & { renderWhileHidden?: boolean }) {
  const { config, paints, visibleSeries } = useChart();
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
  const interaction = useSeriesInteraction(key, effectiveHide, hide === true, props.data);
  const color = stroke ?? (key && Object.hasOwn(config, key) ? paints[key] : undefined);
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.line}>
      <SeriesInteractionLayer seriesKey={key} hidden={effectiveHide}>
        <Line<DataPoint, Value>
          isAnimationActive={false}
          {...props}
          {...(props.dot === undefined && pointStyle !== "default" ? { dot: <PointMarker variant={pointStyle} /> } : {})}
          onClick={interaction.compose(props.onClick)}
          {...(material !== "plain" && props.shape === undefined && props.filter === undefined
            ? {
                shape: (
                  <MaterialCurve
                    material={material}
                    filterId={`${generatedId}-material`}
                    materialWidth={
                      props.strokeWidth ??
                      (material === "clay" ? 6 : material === "paper" ? 2.5 : 3)
                    }
                  />
                ),
                strokeLinecap: props.strokeLinecap ?? (props.strokeDasharray ? "butt" : "round"),
                strokeLinejoin: props.strokeLinejoin ?? "round",
              }
            : {})}
          id={id}
          zIndex={0}
          hide={renderedHide}
          {...(color !== undefined ? { stroke: color } : {})}
          className={["kind-ui-line-series", className].filter(Boolean).join(" ")}
        />
      </SeriesInteractionLayer>
    </ZIndexLayer>
  );
}
