"use client";

import { animate, motion, useMotionValue } from "motion/react";
import {
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  memo,
  type ReactElement,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type ActiveDotProps,
  DefaultZIndexes,
  Dot,
  Polygon,
  Radar,
  RadialBar,
  Sector,
  ZIndexLayer,
} from "recharts";
import {
  ActiveMarker,
  InteractionPaint,
  InteractionPaintScope,
  useInteractionOpacity,
} from "./animation.js";
import { categoryCells, preserveCategoryRows } from "./category-cells.js";
import { useChart } from "./chart-context.js";
import { useChartInteraction, useInteractionFocus } from "./chart-interaction.js";
import { EmphasisMark, useEmphasis } from "./emphasis.js";
import { useLineInteraction } from "./line-chart.js";
import { PolarMotion, RadarMotion, RadialMotion } from "./polar-chart.js";
import { type PolarMaterial, PolarMaterialFilter } from "./polar-material.js";
import { RadarSelectionLayer, useRadarSelectionDot } from "./radar-interaction.js";
import { RadialCategory } from "./radial-category.js";
import { SeriesInteractionLayer, useSeriesInteraction } from "./series-interaction.js";
import { visibilityLabel, visibilityLabelChildren } from "./visibility-labels.js";

// Native Radar uses a props-identity animation key even with animation disabled.
// Avoid replacing its polygon for unrelated frame state during a pointer press.
const StableRadar = memo(Radar) as typeof Radar;
const RadarActivePaint = createContext<{
  inactive: boolean;
  option: ComponentProps<typeof Radar>["activeDot"];
}>({ inactive: false, option: undefined });
function RadarActiveDot(props: Partial<ActiveDotProps>) {
  const { inactive, option } = use(RadarActivePaint);
  if (inactive || option === false) return null;
  if (typeof option === "function") return option(props as ActiveDotProps);
  if (option === undefined) return <ActiveMarker {...props} />;
  const options: Partial<ActiveDotProps> = isValidElement(option)
    ? (option.props as Partial<ActiveDotProps>)
    : typeof option === "object"
      ? (option as Partial<ActiveDotProps>)
      : {};
  // Native ActivePoints passes the option and event to option-owned handlers.
  const events = Object.fromEntries(
    Object.entries(options).flatMap(([name, handler]) =>
      /^on[A-Z]/.test(name) && typeof handler === "function"
        ? [[name, (event: unknown) => handler(options, event)]]
        : [],
    ),
  );
  const paint = { ...props, ...options, ...events };
  return isValidElement(option) ? (
    cloneElement(option as ReactElement<Partial<ActiveDotProps>>, paint)
  ) : (
    <Dot {...paint} />
  );
}
const radarActiveDot = <RadarActiveDot />;

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
  const interactionOwner = useChartInteraction();
  const { registerSeries, registerHiddenItem, invalidate } = useLineInteraction();
  const { reveal, options } = use(PolarMotion);
  const generatedId = useId();
  const id = props.id || generatedId;
  const key = props.seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const hide =
    props.hide === true ||
    (interactionOwner.kind === "series" &&
      visibleSeries !== undefined &&
      !visibleSeries.includes(key ?? ""));
  useLayoutEffect(() => registerHiddenItem(id, hide), [registerHiddenItem, id, hide]);
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
  const interaction = useSeriesInteraction(
    seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined),
    series.hide,
    hide === true,
    undefined,
    props.onClick,
  );
  const key = seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const nativeLabel = useMemo(
    () =>
      props.label === undefined
        ? undefined
        : visibilityLabel(props.label, series.hide, undefined, key),
    [props.label, series.hide, key],
  );
  const nativeChildren = useMemo(
    () => visibilityLabelChildren(props.children, series.hide, undefined, key),
    [props.children, series.hide, key],
  );
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
      <SeriesInteractionLayer
        seriesKey={seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined)}
        hidden={series.hide}
      >
        <RadarSelectionLayer
          seriesKey={seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined)}
          hidden={series.hide}
        >
          <motion.g
            data-kind-ui="radar-reveal"
            initial={false}
            pointerEvents={series.hide ? "none" : undefined}
          >
            <RadarActivePaint
              value={{
                inactive: interaction.inactive,
                option: props.activeDot ?? (Object.hasOwn(props, "activeDot") ? true : undefined),
              }}
            >
              <StableRadar<DataPoint, Value>
                {...props}
                activeDot={radarActiveDot}
                {...(interaction.onClick !== undefined ? { onClick: interaction.onClick } : {})}
                {...(props.shape === undefined ? { shape: renderRadarEntrance } : {})}
                {...(selectionDot !== undefined ? { dot: selectionDot } : {})}
                {...(nativeLabel !== undefined ? { label: nativeLabel } : {})}
                id={series.id}
                hide={false}
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
              >
                {nativeChildren}
              </StableRadar>
            </RadarActivePaint>
          </motion.g>
        </RadarSelectionLayer>
      </SeriesInteractionLayer>
    </ZIndexLayer>
  );
}

const RadialSeriesPaint = createContext<{ hidden: boolean; key: string | undefined }>({
  hidden: false,
  key: undefined,
});
type RadialPaintProps = ComponentProps<typeof Sector> & { payload?: unknown; index?: number };
function RadialOwnedPaint({
  option,
  backgroundPaint = false,
  activePaint = false,
  ...props
}: RadialPaintProps & { option?: unknown; backgroundPaint?: boolean; activePaint?: boolean }) {
  const series = use(RadialSeriesPaint);
  const categories = use(RadialCategory);
  const interaction = useChartInteraction();
  const category = categories?.bound ? categories.key(props.payload) : undefined;
  const hidden =
    series.hidden ||
    (category !== undefined &&
      interaction.visible !== undefined &&
      !interaction.visible.includes(category));
  const key = category ?? series.key;
  const emphasis = useEmphasis(
    {
      kind: category === undefined ? "series" : "category",
      key: key ?? "",
      scope: category === undefined ? "series" : "radial",
      seriesKey: key,
    },
    key !== undefined &&
      !hidden &&
      interaction.configured &&
      interaction.kind === (category === undefined ? "series" : "category") &&
      interaction.eligible.includes(key),
  );
  if (activePaint && (hidden || (interaction.selected !== null && interaction.selected !== key)))
    return null;
  let content: ReactNode;
  if (isValidElement(option)) content = cloneElement(option, props);
  else if (typeof option === "function")
    content = (option as (props: RadialPaintProps) => ReactNode)(props);
  else if (!backgroundPaint && (option === undefined || typeof option === "boolean"))
    content = <RadialEntranceSector {...props} />;
  else
    content = (
      <Sector
        {...({
          ...props,
          ...(typeof option === "object" && option !== null ? option : {}),
        } as ComponentProps<typeof Sector>)}
      />
    );
  return (
    <g
      pointerEvents={hidden ? "none" : undefined}
      aria-hidden={hidden || undefined}
      data-kind-ui={backgroundPaint ? "radial-background-visibility" : "radial-sector-visibility"}
      data-series={series.key}
      data-category={category}
      data-native-index={props.index}
    >
      <InteractionPaint
        identity={JSON.stringify([
          backgroundPaint ? "background" : "sector",
          category ?? series.key,
          props.index,
        ])}
        opacity={
          hidden
            ? 0
            : backgroundPaint ||
                (category !== undefined && option !== undefined && typeof option !== "boolean")
              ? emphasis.factor
              : 1
        }
      >
        {content}
      </InteractionPaint>
    </g>
  );
}

/** Backgrounds live in a native ZIndex portal and retain native arc registrations. */
function RadialBackgroundPaint({
  paintClass,
  index,
  paintKey,
  hidden,
  opacity,
}: {
  paintClass: string;
  index?: number;
  paintKey: string | undefined;
  hidden: boolean;
  opacity?: number | string | undefined;
}) {
  const ref = useRef<SVGGElement>(null);
  const owner = useChartInteraction();
  const inactive = paintKey !== undefined && owner.selected !== null && owner.selected !== paintKey;
  const value = useInteractionOpacity(
    hidden ? 0 : inactive ? 0.28 : 1,
    `background/${paintClass}/${index ?? "series"}`,
  );
  useLayoutEffect(() => {
    const svg = ref.current?.ownerSVGElement;
    if (!svg) return;
    const apply = () => {
      const marks = Array.from(svg.getElementsByClassName(paintClass));
      for (const [position, mark] of marks.entries()) {
        if (index !== undefined && position !== index) continue;
        if (!(mark instanceof SVGElement)) continue;
        mark.style.opacity = String(value.get() * Number(opacity ?? 1));
        if (hidden) {
          mark.setAttribute("aria-hidden", "true");
          mark.style.pointerEvents = "none";
        } else {
          mark.removeAttribute("aria-hidden");
          mark.style.removeProperty("pointer-events");
        }
      }
    };
    apply();
    const unsubscribe = value.on("change", apply);
    const observer = new MutationObserver(apply);
    observer.observe(svg, { childList: true, subtree: true });
    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, [paintClass, index, hidden, opacity, value]);
  return <g ref={ref} data-kind-ui="radial-background-controller" />;
}

// Recharts computes every arc; the entrance masks its paint without changing its path.
function RadialEntranceSector(props: ComponentProps<typeof Sector> & { payload?: unknown }) {
  const categories = use(RadialCategory);
  const interaction = useChartInteraction();
  const key = categories?.bound ? categories.key(props.payload) : undefined;
  const content = useRadialSector(props);
  const interactive =
    key !== undefined &&
    interaction.interactive &&
    interaction.markActivation &&
    interaction.eligible.includes(key) &&
    (interaction.visible === undefined || interaction.visible.includes(key));
  const focusRef = useInteractionFocus(key, interactive);
  return key === undefined ? (
    content
  ) : (
    <EmphasisMark
      enabled={
        interaction.eligible.includes(key) &&
        (interaction.visible === undefined || interaction.visible.includes(key))
      }
      ref={focusRef}
      data-interaction-focus-key={interactive ? key : undefined}
      target={{ kind: "category", key, scope: "radial", seriesKey: key }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive ? `${interaction.mode === "focus" ? "Highlight" : "Toggle"} ${key}` : undefined
      }
      aria-pressed={
        interactive
          ? interaction.mode === "focus"
            ? interaction.selected === key
            : true
          : undefined
      }
      onKeyDown={(event) => {
        if (
          interactive &&
          event.target === event.currentTarget &&
          !event.defaultPrevented &&
          (event.key === "Enter" || event.key === " ")
        ) {
          if (!event.repeat) interaction.activate({ kind: "category", key }, "mark", event);
          event.preventDefault();
        }
      }}
    >
      {content}
    </EmphasisMark>
  );
}

function useRadialSector(props: ComponentProps<typeof Sector>) {
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
  const owner = useChartInteraction();
  const filtered = categories?.bound
    ? preserveCategoryRows(categories.originalData, categories.key, undefined, props.children)
    : undefined;
  const children = categories
    ? categoryCells(
        categories.data,
        categories.key,
        config,
        paints,
        filtered?.children ?? props.children,
        fill,
      )
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
  const { registerCategoryKeys } = useLineInteraction();
  const categoryAt = useCallback(
    (index: number) => {
      const row = categories?.originalData[index];
      return row === undefined ? undefined : categories?.key(row);
    },
    [categories?.originalData, categories?.key],
  );
  useLayoutEffect(() => {
    if (!categories?.bound) return;
    return registerCategoryKeys(series.id, categoryAt);
  }, [categories?.bound, registerCategoryKeys, series.id, categoryAt]);
  const interaction = useSeriesInteraction(
    seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined),
    series.hide,
    hide === true,
    undefined,
    props.onClick,
  );
  const filterId = `kind-ui-polar-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const materialized =
    material !== "plain" &&
    (props.shape === undefined || typeof props.shape === "boolean") &&
    (props.activeShape === undefined || typeof props.activeShape === "boolean") &&
    props.filter === undefined &&
    props.style?.filter === undefined;
  const hiddenRows = categories?.bound
    ? categories.originalData.map(
        (row) => owner.visible !== undefined && !owner.visible.includes(categories.key(row)),
      )
    : undefined;
  const labelCategoryKeys = categories?.bound
    ? categories.originalData.map(categories.key)
    : undefined;
  const nativeShape = useMemo(
    () => (paint: RadialPaintProps) => <RadialOwnedPaint {...paint} option={props.shape} />,
    [props.shape],
  );
  const nativeActiveShape = useMemo(
    () => (paint: RadialPaintProps) => (
      <RadialOwnedPaint {...paint} activePaint option={props.activeShape ?? props.shape} />
    ),
    [props.activeShape, props.shape],
  );
  const backgroundClass = `${filterId}-background`;
  const backgroundOptions = isValidElement<ComponentProps<typeof Sector>>(props.background)
    ? props.background.props
    : typeof props.background === "object"
      ? props.background
      : undefined;
  const nativeBackground = useMemo(() => {
    if (!props.background) return props.background;
    const option =
      props.background === true
        ? { fill: "var(--kind-ui-radial-track, #f1f1f1)" }
        : backgroundOptions;
    // Native RadialBar accepts background SVG props, not a shape renderer.
    return { ...option, className: [option?.className, backgroundClass].filter(Boolean).join(" ") };
  }, [props.background, backgroundClass, backgroundOptions]);
  const onClick: RadialBarSeriesProps<DataPoint, Value>["onClick"] = categories?.bound
    ? (...args) => {
        props.onClick?.(...args);
        owner.activate({ kind: "category", key: categories.key(args[0].payload) }, "mark", args[2]);
      }
    : interaction.onClick;
  return (
    <InteractionPaintScope>
      <RadialSeriesPaint
        value={{
          hidden: series.hide,
          key: seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined),
        }}
      >
        <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.bar}>
          {props.background &&
            (categories?.bound ? (
              categories.originalData.map((row, index) => (
                <RadialBackgroundPaint
                  key={categories.key(row)}
                  paintClass={backgroundClass}
                  index={index}
                  paintKey={categories.key(row)}
                  hidden={series.hide || Boolean(hiddenRows?.[index])}
                  opacity={backgroundOptions?.opacity}
                />
              ))
            ) : (
              <RadialBackgroundPaint
                paintClass={backgroundClass}
                paintKey={
                  seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined)
                }
                hidden={series.hide}
                opacity={backgroundOptions?.opacity}
              />
            ))}
          {materialized && <PolarMaterialFilter material={material} id={filterId} />}
          <SeriesInteractionLayer
            seriesKey={seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined)}
            hidden={series.hide}
          >
            <motion.g
              data-kind-ui="radial-bar-reveal"
              initial={false}
              pointerEvents={series.hide ? "none" : undefined}
            >
              <RadialBar<DataPoint, Value>
                {...props}
                {...(onClick !== undefined ? { onClick } : {})}
                shape={nativeShape}
                activeShape={
                  props.activeShape === undefined || props.activeShape === false
                    ? false
                    : nativeActiveShape
                }
                {...(nativeBackground !== undefined ? { background: nativeBackground } : {})}
                {...(materialized ? { filter: `url(#${filterId})` } : {})}
                {...(props.label !== undefined
                  ? {
                      label: visibilityLabel(
                        props.label,
                        series.hide,
                        hiddenRows,
                        seriesKey ??
                          (typeof props.dataKey === "string" ? props.dataKey : undefined),
                        labelCategoryKeys,
                      ),
                    }
                  : {})}
                id={series.id}
                hide={false}
                isAnimationActive={false}
                zIndex={0}
                {...(fill !== undefined
                  ? { fill }
                  : series.color !== undefined
                    ? { fill: series.color }
                    : {})}
                className={["kind-ui-radial-bar-series", className].filter(Boolean).join(" ")}
              >
                {visibilityLabelChildren(
                  children,
                  series.hide,
                  hiddenRows,
                  seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined),
                  labelCategoryKeys,
                )}
              </RadialBar>
            </motion.g>
          </SeriesInteractionLayer>
        </ZIndexLayer>
      </RadialSeriesPaint>
    </InteractionPaintScope>
  );
}
