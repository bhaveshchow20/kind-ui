"use client";

import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";
import { Line } from "recharts";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";

export type LineSeriesProps = ComponentProps<typeof Line> & {
  /** Metadata/visibility key, required only for function or numeric data keys. */
  seriesKey?: string;
};

/** A registered Recharts Line with Root colors and controlled visibility. */
export function LineSeries({ seriesKey, hide, stroke, className, ...props }: LineSeriesProps) {
  const { config, visibleSeries } = useChart();
  const { registerSeries, invalidate } = useLineInteraction();
  const generatedId = useId();
  const id = props.id || generatedId;
  const key = seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const previousData = useRef(props.data);
  useLayoutEffect(() => {
    if (props.data !== previousData.current) invalidate();
    previousData.current = props.data;
  }, [props.data, invalidate]);
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
      id={id}
      hide={hide === true || (visibleSeries !== undefined && !visibleSeries.includes(key ?? ""))}
      {...(color !== undefined ? { stroke: color } : {})}
      className={["kind-ui-line-series", className].filter(Boolean).join(" ")}
    />
  );
}
