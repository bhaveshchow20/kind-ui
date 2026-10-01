"use client";

import { motion } from "motion/react";
import { type ComponentProps, use, useId, useLayoutEffect, useRef } from "react";
import {
  Bar,
  useChartLayout,
  usePlotArea,
  useXAxisDomain,
  useXAxisScale,
  useYAxisDomain,
  useYAxisScale,
} from "recharts";
import { BarMotion } from "./bar-chart.js";
import { type BarMaterial, BarMaterialFilter } from "./bar-material.js";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";

export type BarSeriesProps = Omit<ComponentProps<typeof Bar>, "isAnimationActive"> & {
  /** Metadata/visibility key, required for controlled function or numeric data keys. */
  seriesKey?: string;
  /** Finish on native rectangles; custom shapes and filters retain ownership. */
  material?: BarMaterial | undefined;
};

/** A registered native Bar; axes, shape, cells, labels and handlers stay consumer-owned. */
export function BarSeries({
  seriesKey,
  hide,
  fill,
  className,
  style,
  material = "plain",
  ...props
}: BarSeriesProps) {
  const { config, visibleSeries } = useChart();
  const { registerSeries, invalidate } = useLineInteraction();
  const { reveal, options, finish } = use(BarMotion);
  const generatedId = useId();
  const id = props.id || generatedId;
  const selector = `kind-ui-bar-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const clipId = `${selector}-reveal`;
  const filterId = `${selector}-material`;
  const materialized =
    material !== "plain" &&
    props.shape === undefined &&
    props.filter === undefined &&
    (props.activeBar === undefined || typeof props.activeBar === "boolean");
  const key = seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const effectiveHide =
    hide === true || (visibleSeries !== undefined && !visibleSeries.includes(key ?? ""));
  const area = usePlotArea();
  const layout = useChartLayout();
  const xScale = useXAxisScale(props.xAxisId);
  const yScale = useYAxisScale(props.yAxisId);
  const horizontal = layout === "vertical";
  const xDomain = useXAxisDomain(props.xAxisId);
  const yDomain = useYAxisDomain(props.yAxisId);
  const numericDomain = horizontal ? xDomain : yDomain;
  const domainValues = numericDomain?.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const baseline =
    domainValues?.length === 2
      ? Math.max(Math.min(...domainValues), Math.min(0, Math.max(...domainValues)))
      : 0;
  // Clamp the VALUE before scaling: native domain-edge baselines include axis padding.
  const zero = horizontal ? xScale?.(baseline) : yScale?.(baseline);
  // Sample real domain values and both band edges: numeric probes miss string categories.
  const axisCoordinates = [
    xDomain?.map((value) => [
      xScale?.(value, { position: "start" }),
      xScale?.(value, { position: "end" }),
    ]),
    yDomain?.map((value) => [
      yScale?.(value, { position: "start" }),
      yScale?.(value, { position: "end" }),
    ]),
  ];
  const geometry =
    area && zero !== undefined
      ? `${area.x}/${area.y}/${area.width}/${area.height}/${zero}/${xScale?.(1)}/${yScale?.(1)}/${JSON.stringify([xDomain, yDomain, axisCoordinates])}/${layout}`
      : undefined;
  const inputs = {
    hide: effectiveHide,
    dataKey: props.dataKey,
    stackId: props.stackId,
    xAxisId: props.xAxisId,
    yAxisId: props.yAxisId,
    minPointSize: props.minPointSize,
    barSize: props.barSize,
    maxBarSize: props.maxBarSize,
    geometry,
  };
  const previous = useRef(inputs);
  useLayoutEffect(() => {
    const old = previous.current;
    if (
      effectiveHide !== old.hide ||
      props.dataKey !== old.dataKey ||
      props.stackId !== old.stackId ||
      props.xAxisId !== old.xAxisId ||
      props.yAxisId !== old.yAxisId ||
      props.minPointSize !== old.minPointSize ||
      props.barSize !== old.barSize ||
      props.maxBarSize !== old.maxBarSize ||
      (old.geometry !== undefined && geometry !== old.geometry)
    )
      invalidate();
    previous.current = inputs;
  });
  useLayoutEffect(() => {
    if (key === undefined) return;
    return registerSeries(id, key);
  }, [id, key, registerSeries]);
  if (key === undefined && visibleSeries !== undefined)
    throw new Error("BarSeries requires seriesKey for controlled non-string dataKey");
  const color = fill ?? (key && Object.hasOwn(config, key) ? `var(--color-${key})` : undefined);
  const clipped = reveal && !effectiveHide && area && zero !== undefined && Number.isFinite(zero);
  return (
    <>
      {/* Bar marks render through Recharts portals; put the variable on their generated class. */}
      <style>{`.${selector} { --kind-ui-bar-clip: ${clipped ? `url(#${clipId})` : "none"}; }`}</style>
      {clipped && (
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <motion.rect
              data-kind-ui="bar-reveal"
              initial={
                horizontal
                  ? { x: zero, y: area.y, width: 0, height: area.height }
                  : { x: area.x, y: zero, height: 0, width: area.width }
              }
              animate={{ x: area.x, y: area.y, width: area.width, height: area.height }}
              transition={{
                duration: Math.max(0, options.revealDurationMs ?? 1000) / 1000,
                ease: options.revealEasing ?? [0.25, 0.1, 0.25, 1],
              }}
              onAnimationComplete={finish}
            />
          </clipPath>
        </defs>
      )}
      {materialized && (
        <defs data-kind-ui="bar-material" data-material={material} pointerEvents="none">
          <BarMaterialFilter material={material} id={filterId} />
        </defs>
      )}
      <Bar
        {...props}
        {...(materialized ? { filter: `url(#${filterId})` } : {})}
        id={id}
        hide={effectiveHide}
        {...(color !== undefined ? { fill: color } : {})}
        className={["kind-ui-bar-series", selector, className].filter(Boolean).join(" ")}
        style={style}
        isAnimationActive={false}
      />
    </>
  );
}
