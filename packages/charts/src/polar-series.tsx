"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { type ComponentProps, memo, use, useId, useLayoutEffect, useRef } from "react";
import { DefaultZIndexes, Polygon, Radar, RadialBar, ZIndexLayer } from "recharts";
import { ActiveMarker } from "./animation.js";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";
import { PolarMotion, RadarMotion } from "./polar-chart.js";
import { type PolarMaterial, PolarMaterialFilter } from "./polar-material.js";
import { RadarSelectionLayer, useRadarSelectionDot } from "./radar-interaction.js";

// Native Radar uses a props-identity animation key even with animation disabled.
// Avoid replacing its polygon for unrelated frame state during a pointer press.
const StableRadar = memo(Radar) as typeof Radar;
const radarActiveDot = <ActiveMarker />;

export type RadarSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Radar<DataPoint, Value>>,
  "isAnimationActive"
> & {
  seriesKey?: string;
  /** Finish on native marks; custom renderers and consumer filters retain ownership. */
  material?: PolarMaterial | undefined;
};
export type RadialBarSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof RadialBar<DataPoint, Value>>,
  "isAnimationActive"
> & {
  seriesKey?: string;
  /** Finish on native marks; custom renderers and consumer filters retain ownership. */
  material?: PolarMaterial | undefined;
};

function usePolarSeries(
  kind: string,
  props: {
    seriesKey?: string | undefined;
    dataKey?: unknown;
    id?: string | undefined;
    hide?: boolean | undefined;
  },
  geometry: readonly unknown[],
) {
  const { config, visibleSeries } = useChart();
  const { registerSeries, invalidate } = useLineInteraction();
  const { reveal, options } = use(PolarMotion);
  const generatedId = useId();
  const id = props.id || generatedId;
  const key = props.seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const hide =
    props.hide === true || (visibleSeries !== undefined && !visibleSeries.includes(key ?? ""));
  const previous = useRef([...geometry, hide]);
  useLayoutEffect(() => {
    const inputs = [...geometry, hide];
    if (inputs.some((value, index) => value !== previous.current[index])) invalidate();
    previous.current = inputs;
  });
  useLayoutEffect(() => {
    if (key === undefined) return;
    return registerSeries(id, key);
  }, [id, key, registerSeries]);
  const opacity = useMotionValue(1);
  const started = useRef(false);
  const duration = options.revealDurationMs ?? 1000;
  const easing = options.revealEasing ?? "easeOut";
  useLayoutEffect(() => {
    if (!reveal || hide) {
      opacity.set(1);
      return;
    }
    if (!started.current) {
      started.current = true;
      opacity.set(0);
    }
    const controls = animate(opacity, 1, { duration: Math.max(0, duration) / 1000, ease: easing });
    return () => {
      controls.stop();
    };
  }, [reveal, hide, opacity, duration, easing]);
  if (key === undefined && visibleSeries !== undefined)
    throw new Error(`${kind} requires seriesKey for controlled non-string dataKey`);
  const color = key !== undefined && Object.hasOwn(config, key) ? `var(--color-${key})` : undefined;
  return { id, hide, color, opacity };
}

type RadarPaintProps = Parameters<NonNullable<RadarSeriesProps["onMouseEnter"]>>[0];

// Recharts injects its original computed points and callback props into this renderer.
// Only the native default polygon is masked; dots, labels and custom renderers stay owned.
function RadarEntrancePolygon(props: RadarPaintProps) {
  const { reveal, progress } = use(RadarMotion);
  const maskId = `kind-ui-radar-entrance-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const center = props.points?.find(
    (point) => Number.isFinite(point.cx) && Number.isFinite(point.cy),
  );
  const cx = center?.cx ?? 0;
  const cy = center?.cy ?? 0;
  const points = [...(props.points ?? []), ...(props.isRange ? (props.baseLinePoints ?? []) : [])];
  const radius = Math.max(
    0,
    ...points.map((point) => Math.hypot(point.x - cx, point.y - cy)).filter(Number.isFinite),
  );
  const owned =
    props.mask !== undefined ||
    props.filter !== undefined ||
    props.transform !== undefined ||
    props.style?.transform !== undefined ||
    props.style?.mask !== undefined ||
    props.style?.filter !== undefined;
  const masked = reveal && center !== undefined && radius > 0 && !owned;
  const {
    baseLinePoints,
    onClick,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onMouseOver,
    onMouseOut,
    ...paint
  } = props;
  return (
    <>
      {masked && (
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={cx - radius - 32}
            y={cy - radius - 32}
            width={radius * 2 + 64}
            height={radius * 2 + 64}
            style={{ maskType: "alpha" }}
          >
            <circle
              data-kind-ui="radar-entrance-window"
              cx={cx}
              cy={cy}
              r={(radius + 32) * progress}
              fill="white"
            />
          </mask>
        </defs>
      )}
      <Polygon
        {...paint}
        key="paint"
        points={props.points}
        {...(onClick ? { onClick } : {})}
        {...(onMouseDown ? { onMouseDown } : {})}
        {...(onMouseUp ? { onMouseUp } : {})}
        {...(onMouseMove ? { onMouseMove } : {})}
        {...(onMouseOver ? { onMouseOver } : {})}
        {...(onMouseOut ? { onMouseOut } : {})}
        {...(props.isRange ? { baseLinePoints } : {})}
        onMouseEnter={(event) => props.onMouseEnter?.(props, event)}
        onMouseLeave={(event) => props.onMouseLeave?.(props, event)}
        {...(masked ? { mask: `url(#${maskId})` } : {})}
      />
    </>
  );
}
const renderRadarEntrance = (props: RadarPaintProps) => <RadarEntrancePolygon {...props} />;

/** Registered native Radar; custom shapes, dots, labels and handlers remain native. */
export function RadarSeries<DataPoint = unknown, Value = unknown>({
  seriesKey,
  hide,
  stroke,
  fill,
  className,
  material = "plain",
  ...props
}: RadarSeriesProps<DataPoint, Value>) {
  const series = usePolarSeries("RadarSeries", { ...props, seriesKey, hide }, [
    props.dataKey,
    seriesKey,
    props.angleAxisId,
    props.radiusAxisId,
    props.baseLinePoints,
    props.isRange,
  ]);
  const selectionDot = useRadarSelectionDot(
    props.dot,
    seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined),
  );
  const filterId = `kind-ui-polar-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const materialized =
    material !== "plain" &&
    props.shape === undefined &&
    props.filter === undefined &&
    props.style?.filter === undefined;
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.area}>
      {materialized && (
        <>
          <PolarMaterialFilter material={material} id={filterId} />
          {/* A series filter would also reach RadarDotsWrapper. Scope to the native
            Polygon root, including its range subpaths, so custom dots stay owned. */}
          <style>{`.${filterId} .recharts-radar-polygon > .recharts-polygon { filter: url(#${filterId}); }`}</style>
        </>
      )}
      <RadarSelectionLayer
        seriesKey={seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined)}
        hidden={series.hide}
      >
        <motion.g data-kind-ui="radar-reveal" initial={false}>
          <StableRadar<DataPoint, Value>
            activeDot={radarActiveDot}
            {...props}
            {...(props.shape === undefined ? { shape: renderRadarEntrance } : {})}
            {...(selectionDot !== undefined ? { dot: selectionDot } : {})}
            id={series.id}
            hide={series.hide}
            isAnimationActive={false}
            zIndex={0}
            {...(stroke !== undefined
              ? { stroke }
              : series.color !== undefined
                ? { stroke: series.color }
                : {})}
            {...(fill !== undefined
              ? { fill }
              : series.color !== undefined
                ? { fill: series.color }
                : {})}
            className={["kind-ui-radar-series", filterId, className].filter(Boolean).join(" ")}
          />
        </motion.g>
      </RadarSelectionLayer>
    </ZIndexLayer>
  );
}

/** Series identity is independent from native category payload/Cell identity. */
export function RadialBarSeries<DataPoint = unknown, Value = unknown>({
  seriesKey,
  hide,
  fill,
  className,
  material = "plain",
  ...props
}: RadialBarSeriesProps<DataPoint, Value>) {
  const series = usePolarSeries("RadialBarSeries", { ...props, seriesKey, hide }, [
    props.dataKey,
    seriesKey,
    props.angleAxisId,
    props.radiusAxisId,
    props.stackId,
    props.barSize,
    props.maxBarSize,
    props.minPointSize,
  ]);
  const filterId = `kind-ui-polar-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const materialized =
    material !== "plain" &&
    (props.shape === undefined || typeof props.shape === "boolean") &&
    (props.activeShape === undefined || typeof props.activeShape === "boolean") &&
    props.filter === undefined &&
    props.style?.filter === undefined;
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.bar}>
      {materialized && <PolarMaterialFilter material={material} id={filterId} />}
      <motion.g
        data-kind-ui="radial-bar-reveal"
        initial={false}
        style={{ opacity: series.opacity }}
      >
        <RadialBar<DataPoint, Value>
          {...props}
          {...(materialized ? { filter: `url(#${filterId})` } : {})}
          id={series.id}
          hide={series.hide}
          isAnimationActive={false}
          zIndex={0}
          {...(fill !== undefined
            ? { fill }
            : series.color !== undefined
              ? { fill: series.color }
              : {})}
          className={["kind-ui-radial-bar-series", className].filter(Boolean).join(" ")}
        />
      </motion.g>
    </ZIndexLayer>
  );
}
