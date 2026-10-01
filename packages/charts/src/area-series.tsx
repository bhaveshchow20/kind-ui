"use client";

import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";
import { Area } from "recharts";
import { ActiveMarker } from "./animation.js";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";

export type AreaSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Area<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Metadata/visibility key, required only for function or numeric data keys. */
  seriesKey?: string;
};

/** A registered Recharts Area with Root colors and controlled visibility. */
export function AreaSeries<DataPoint = unknown, Value = unknown>({
  seriesKey,
  hide,
  stroke,
  fill,
  className,
  ...props
}: AreaSeriesProps<DataPoint, Value>) {
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
      activeDot={<ActiveMarker />}
      {...props}
      isAnimationActive={false}
      id={id}
      hide={effectiveHide}
      {...(color !== undefined ? { stroke: color } : {})}
      {...(fill !== undefined ? { fill } : color !== undefined ? { fill: color } : {})}
      className={["kind-ui-area-series", className].filter(Boolean).join(" ")}
    />
  );
}
