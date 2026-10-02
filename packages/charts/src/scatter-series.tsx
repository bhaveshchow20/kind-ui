"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { type ComponentProps, use, useId, useLayoutEffect, useMemo, useRef } from "react";
import {
  DefaultZIndexes,
  Scatter,
  type ScatterShapeProps,
  type Symbols,
  usePlotArea,
  useXAxisDomain,
  useXAxisScale,
  useYAxisDomain,
  useYAxisScale,
  ZIndexLayer,
} from "recharts";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";
import { ScatterMotion } from "./scatter-chart.js";
import { type ScatterMaterial, ScatterMaterialSymbol } from "./scatter-material.js";

export type ScatterSeriesProps = Omit<ComponentProps<typeof Scatter>, "isAnimationActive"> & {
  /** Series identity is separate from numeric axis data keys. Required for controlled visibility. */
  seriesKey?: string;
  /** Finish built-in symbols; custom shapes and consumer filters retain ownership. */
  material?: ScatterMaterial | undefined;
};

/** Native Scatter owns marks, Cells, labels, handlers, axis mapping and point payloads. */
export function ScatterSeries({
  seriesKey,
  hide,
  fill,
  material = "plain",
  ...props
}: ScatterSeriesProps) {
  const { config, visibleSeries } = useChart();
  const { registerSeries, invalidate } = useLineInteraction();
  const { reveal, options } = use(ScatterMotion);
  const shapes = useMemo(() => {
    function finish(option: ScatterSeriesProps["shape"]) {
      if (
        material === "plain" ||
        (option !== undefined && typeof option !== "string" && typeof option !== "boolean")
      )
        return option;
      return (point: ScatterShapeProps) => (
        <ScatterMaterialSymbol
          material={material}
          type={typeof option === "string" ? option : "circle"}
          {...(point as ComponentProps<typeof Symbols>)}
        />
      );
    }
    return {
      shape: finish(props.shape),
      // Undefined activeShape must stay undefined: native activation/portal semantics.
      activeShape:
        props.activeShape === undefined || props.activeShape === false
          ? props.activeShape
          : finish(props.activeShape),
    };
  }, [material, props.shape, props.activeShape]);
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const key = seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const hidden =
    hide === true || (visibleSeries !== undefined && !visibleSeries.includes(key ?? ""));
  const area = usePlotArea();
  const xDomain = useXAxisDomain(props.xAxisId);
  const yDomain = useYAxisDomain(props.yAxisId);
  const xScale = useXAxisScale(props.xAxisId);
  const yScale = useYAxisScale(props.yAxisId);
  const geometry =
    area && area.width > 0 && area.height > 0 && xDomain && yDomain && xScale && yScale
      ? JSON.stringify([area, xDomain.map((v) => xScale?.(v)), yDomain.map((v) => yScale?.(v))])
      : undefined;
  const inputs = [
    props.data,
    props.dataKey,
    props.xAxisId,
    props.yAxisId,
    props.zAxisId,
    hidden,
    geometry,
  ];
  const previous = useRef(inputs);
  useLayoutEffect(() => {
    if (
      inputs.some(
        (v, i) => v !== previous.current[i] && (i !== 6 || previous.current[i] !== undefined),
      )
    )
      invalidate();
    previous.current = inputs;
  });
  useLayoutEffect(() => {
    if (key !== undefined) return registerSeries(id, key);
  }, [id, key, registerSeries]);
  const opacity = useMotionValue(reveal ? 0 : 1);
  useLayoutEffect(() => {
    if (!reveal || hidden) {
      opacity.set(1);
      return;
    }
    opacity.set(0);
    const controls = animate(opacity, 1, {
      duration: Math.max(0, options.revealDurationMs ?? 700) / 1000,
      ease: options.revealEasing ?? "easeOut",
    });
    return () => controls.stop();
  }, [reveal, hidden, options.revealDurationMs, options.revealEasing, opacity]);
  if (key === undefined && visibleSeries !== undefined)
    throw new Error("ScatterSeries requires seriesKey for controlled non-string dataKey");
  const color = fill ?? (key && Object.hasOwn(config, key) ? `var(--color-${key})` : undefined);
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.scatter}>
      <motion.g data-kind-ui="scatter-fade" initial={false} style={{ opacity }}>
        <Scatter
          {...props}
          {...(shapes.shape !== undefined ? { shape: shapes.shape } : {})}
          {...(shapes.activeShape !== undefined ? { activeShape: shapes.activeShape } : {})}
          id={id}
          hide={hidden}
          {...(color !== undefined ? { fill: color } : {})}
          zIndex={0}
          isAnimationActive={false}
        />
      </motion.g>
    </ZIndexLayer>
  );
}
