"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { type ComponentProps, memo, use, useId, useLayoutEffect, useRef, useState } from "react";
import { DefaultZIndexes, Polygon, Radar, RadialBar, Sector, ZIndexLayer } from "recharts";
import { ActiveMarker } from "./animation.js";
import { categoryCells } from "./category-cells.js";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";
import { PolarMotion, RadarMotion, RadialMotion } from "./polar-chart.js";
import { type PolarMaterial, PolarMaterialFilter } from "./polar-material.js";
import { RadarSelectionLayer, useRadarSelectionDot } from "./radar-interaction.js";
import { RadialCategory } from "./radial-category.js";

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
  const { config, paints, visibleSeries } = useChart();
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
  const color = key !== undefined && Object.hasOwn(config, key) ? paints[key] : undefined;
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

// Recharts computes every arc; the entrance masks its paint without changing its path.
function RadialEntranceSector(props: ComponentProps<typeof Sector>) {
  const { reveal, progress, direction } = use(RadialMotion);
  const id = `kind-ui-radial-entrance-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const group = useRef<SVGGElement>(null);
  const [nativeTransform, setNativeTransform] = useState<boolean>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: class/id changes can change stylesheet transforms.
  useLayoutEffect(() => {
    const path = group.current?.querySelector("path:not([data-kind-ui])");
    if (!path) return;
    const css = getComputedStyle(path);
    setNativeTransform(
      css.transform !== "none" ||
        css.translate !== "none" ||
        css.rotate !== "none" ||
        css.scale !== "none",
    );
  }, [props.className, props.style, props.transform, props.id]);
  const { cx = 0, cy = 0, outerRadius = 0, startAngle = 0, endAngle = 0 } = props;
  const nativeSpan = Math.max(-360, Math.min(360, endAngle - startAngle));
  const clockwise = direction === "clockwise";
  const fromStart = clockwise ? nativeSpan < 0 : nativeSpan >= 0;
  const start = fromStart ? startAngle : startAngle + nativeSpan;
  const span = Math.abs(nativeSpan) * (clockwise ? -1 : 1);
  const radius =
    outerRadius + 16 + (Number(props.style?.strokeWidth ?? props.strokeWidth) || 0) / 2;
  const mask =
    reveal &&
    nativeTransform === false &&
    props.transform === undefined &&
    props.style?.transform === undefined;
  return (
    <g ref={group}>
      {mask && (
        <defs>
          <mask
            id={id}
            maskUnits="userSpaceOnUse"
            x={cx - radius}
            y={cy - radius}
            width={radius * 2}
            height={radius * 2}
            style={{ maskType: "alpha" }}
          >
            <Sector
              data-kind-ui="radial-entrance-window"
              data-direction={direction}
              fill="white"
              cx={cx}
              cy={cy}
              innerRadius={0}
              outerRadius={radius}
              startAngle={start}
              endAngle={start + span * progress}
            />
          </mask>
        </defs>
      )}
      <g mask={mask ? `url(#${id})` : undefined}>
        <Sector {...props} />
      </g>
    </g>
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
  const categories = use(RadialCategory);
  const { config, paints } = useChart();
  const children = categories
    ? categoryCells(categories.data, categories.key, config, paints, props.children, fill)
    : props.children;
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
      <motion.g data-kind-ui="radial-bar-reveal" initial={false}>
        <RadialBar<DataPoint, Value>
          {...props}
          {...(props.shape === undefined ? { shape: RadialEntranceSector } : {})}
          {...(props.background === true
            ? { background: { fill: "var(--kind-ui-radial-track, #f1f1f1)" } }
            : {})}
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
        >
          {children}
        </RadialBar>
      </motion.g>
    </ZIndexLayer>
  );
}
