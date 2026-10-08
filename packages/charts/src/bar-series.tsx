"use client";

import { motion } from "motion/react";
import {
  Children,
  type ComponentProps,
  cloneElement,
  isValidElement,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  Bar,
  type BarShapeProps,
  Cell,
  DefaultZIndexes,
  Rectangle,
  useActiveTooltipDataPoints,
  useActiveTooltipLabel,
  useChartLayout,
  useIsTooltipActive,
  usePlotArea,
  useXAxisDomain,
  useXAxisScale,
  useYAxisDomain,
  useYAxisScale,
  ZIndexLayer,
} from "recharts";
import { InteractionPaint } from "./animation.js";
import { useBarCategoryHover } from "./bar-category.js";
import { BarMotion } from "./bar-chart.js";
import { type BarMaterial, BarMaterialFilter } from "./bar-material.js";
import { useChart } from "./chart-context.js";
import { useEmphasis } from "./emphasis.js";
import { type FillPattern, FillPatternDefinition, patternResourceId } from "./fill-pattern.js";
import { useChartKeyboard, useLineInteraction } from "./line-chart.js";
import { SeriesEscapePaint } from "./series-escape-paint.js";
import { SeriesInteractionLayer, useSeriesInteraction } from "./series-interaction.js";
import { visibilityLabel, visibilityLabelChildren } from "./visibility-labels.js";

/** Caller-owned identity selection; this component never computes forecast values. */
export type BarProjection<DataPoint> = {
  isProjected: (datum: DataPoint) => boolean;
  pattern: FillPattern;
};

export type BarSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Bar<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Metadata/visibility key, required for controlled function or numeric data keys. */
  seriesKey?: string;
  /** Stable category identity for numeric domains or independently supplied series rows. */
  emphasisKey?: ((payload: unknown) => string | number | undefined) | undefined;
  /** Finish on native rectangles; custom shapes and filters retain ownership. */
  material?: BarMaterial | undefined;
  /** Static encoding for implicit fills; explicit fills/Cells/custom shapes retain ownership. */
  pattern?: FillPattern | false | undefined;
  /** Pattern selected rows; selection remains caller-owned. */
  projection?: BarProjection<DataPoint> | undefined;
};

/** A registered native Bar; axes, shape, cells, labels and handlers stay consumer-owned. */
export function BarSeries<DataPoint = unknown, Value = unknown>({
  seriesKey,
  emphasisKey,
  hide,
  fill,
  className,
  style,
  material = "plain",
  pattern,
  projection,
  children,
  ...props
}: BarSeriesProps<DataPoint, Value>) {
  const { config, paints, visibleSeries } = useChart();
  const { registerSeries, invalidate, data, categoryEmphasis, registerCategoryEligibility } =
    useLineInteraction();
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
  const usablePlot =
    area &&
    zero !== undefined &&
    area.width > 0 &&
    area.height > 0 &&
    [area.x, area.y, area.width, area.height, zero].every(Number.isFinite);
  const geometry = usablePlot
    ? `${area.x}/${area.y}/${area.width}/${area.height}/${zero}/${xScale?.(1)}/${yScale?.(1)}/${JSON.stringify([xDomain, yDomain, axisCoordinates])}/${layout}`
    : undefined;
  const inputs = {
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
  const layoutEstablished = useRef(false);
  useLayoutEffect(() => {
    if (geometry === undefined || layoutEstablished.current) return;
    // Native axes register and measure auto tick widths in layout effects. Treat
    // that pre-frame geometry as provisional, then preserve normal interruption.
    const frame = requestAnimationFrame(() => {
      layoutEstablished.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [geometry]);
  useLayoutEffect(() => {
    const old = previous.current;
    if (
      props.dataKey !== old.dataKey ||
      props.stackId !== old.stackId ||
      props.xAxisId !== old.xAxisId ||
      props.yAxisId !== old.yAxisId ||
      props.minPointSize !== old.minPointSize ||
      props.barSize !== old.barSize ||
      props.maxBarSize !== old.maxBarSize ||
      (layoutEstablished.current && old.geometry !== undefined && geometry !== old.geometry)
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
  const configuredPattern = key && Object.hasOwn(config, key) ? config[key]?.pattern : undefined;
  const resolvedPattern = pattern === false ? undefined : (pattern ?? configuredPattern);
  const patternId = patternResourceId(generatedId);
  const patterned =
    resolvedPattern !== undefined &&
    fill === undefined &&
    style?.fill === undefined &&
    props.shape === undefined &&
    (props.activeBar === undefined || typeof props.activeBar === "boolean");
  const interaction = useSeriesInteraction(
    key,
    effectiveHide,
    hide === true,
    undefined,
    props.onClick,
  );
  const projectionId = `${patternId}-projection`;
  // Explicit Cell composition owns per-datum paint, including nested native Cells.
  // Do not override consumer Cells or flatten their markup.
  const hasCells = (nodes: typeof children): boolean =>
    Children.toArray(nodes).some(
      (node) =>
        isValidElement<{ children?: typeof children }>(node) &&
        (node.type === Cell || hasCells(node.props.children)),
    );
  const projectionPaint =
    projection !== undefined &&
    pattern !== false &&
    fill === undefined &&
    style?.fill === undefined &&
    props.shape === undefined &&
    (props.activeBar === undefined || typeof props.activeBar === "boolean") &&
    !hasCells(children);
  const color = fill ?? (key && Object.hasOwn(config, key) ? paints[key] : undefined);
  const nativeRows =
    (!("data" in props) &&
      data?.every((row: unknown) => {
        if (
          typeof props.dataKey !== "string" ||
          typeof row !== "object" ||
          row === null ||
          !Object.hasOwn(row, props.dataKey)
        )
          return false;
        const value = (row as Record<string, unknown>)[props.dataKey];
        return typeof value === "number" && Number.isFinite(value) && value !== baseline;
      })) ??
    false;
  const categoryDomain = horizontal ? yDomain : xDomain;
  const explicitIdentities = emphasisKey ? data?.map(emphasisKey) : undefined;
  const semanticCategories = emphasisKey
    ? // biome-ignore lint/complexity/useOptionalChain: This guard must produce boolean false, not undefined, for category eligibility.
      explicitIdentities !== undefined &&
      explicitIdentities.every((key) => key !== undefined) &&
      new Set(explicitIdentities.map(String)).size === explicitIdentities.length
    : categoryDomain !== undefined &&
      categoryDomain.length === data?.length &&
      categoryDomain.every((value) => typeof value === "string") &&
      new Set(categoryDomain).size === categoryDomain.length;
  const eligible =
    nativeRows &&
    semanticCategories &&
    props.shape === undefined &&
    (props.activeBar === undefined || typeof props.activeBar === "boolean");
  useLayoutEffect(
    () => registerCategoryEligibility(id, eligible, effectiveHide),
    [id, eligible, effectiveHide, registerCategoryEligibility],
  );
  const categoryShape = useCallback(
    (shapeProps: BarShapeProps) => {
      // Select the actual displayed payload, not the Cell index: native Brush
      // slices and missing-value filtering must not shift projection identity.
      const datum = shapeProps.payload as DataPoint | null | undefined;
      const datumPaint =
        typeof datum === "object" && datum !== null
          ? (datum as { fill?: unknown; style?: { fill?: unknown } })
          : undefined;
      const projected =
        projectionPaint &&
        datum != null &&
        projection.isProjected(datum) &&
        datumPaint?.fill === undefined &&
        datumPaint?.style?.fill === undefined;
      const nativeProps = projected ? { ...shapeProps, fill: `url(#${projectionId})` } : shapeProps;
      return categoryEmphasis && eligible ? (
        <CategoryBar
          {...nativeProps}
          seriesKey={key}
          emphasisKey={emphasisKey}
          axisId={horizontal ? props.yAxisId : props.xAxisId}
        />
      ) : (
        <Rectangle {...nativeProps} />
      );
    },
    [
      key,
      emphasisKey,
      horizontal,
      props.xAxisId,
      props.yAxisId,
      projectionPaint,
      projection,
      projectionId,
      categoryEmphasis,
      eligible,
    ],
  );
  const clipped = reveal && !effectiveHide && usablePlot;
  const nativeChildren = useMemo(
    () => visibilityLabelChildren(children, effectiveHide, undefined, key),
    [children, effectiveHide, key],
  );
  const nativeLabel = useMemo(
    () =>
      props.label === undefined
        ? undefined
        : visibilityLabel(props.label, effectiveHide, undefined, key),
    [props.label, effectiveHide, key],
  );
  return (
    <>
      {/* Bar marks render through Recharts portals; put the variable on their generated class. */}
      <style>{`.${selector} { --kind-ui-bar-clip: ${clipped ? `url(#${clipId})` : "none"}; }`}</style>
      {clipped && (
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <motion.rect
              key={geometry}
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
      {patterned && (
        <defs pointerEvents="none">
          <FillPatternDefinition
            id={patternId}
            pattern={resolvedPattern}
            baseColor={
              key && Object.hasOwn(config, key) ? `var(--color-${key})` : (color ?? "currentColor")
            }
          />
        </defs>
      )}
      {projectionPaint && (
        <defs pointerEvents="none">
          <FillPatternDefinition
            id={projectionId}
            pattern={projection.pattern}
            baseColor={
              key && Object.hasOwn(config, key) ? `var(--color-${key})` : (color ?? "currentColor")
            }
          />
        </defs>
      )}
      {materialized && (
        <defs data-kind-ui="bar-material" data-material={material} pointerEvents="none">
          <BarMaterialFilter material={material} id={filterId} horizontal={horizontal} />
        </defs>
      )}
      <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.bar}>
        <SeriesInteractionLayer seriesKey={key} hidden={effectiveHide}>
          <Bar<DataPoint, Value>
            {...props}
            {...(interaction.onClick !== undefined ? { onClick: interaction.onClick } : {})}
            {...(projectionPaint || (categoryEmphasis && eligible)
              ? {
                  shape: categoryShape,
                }
              : {})}
            {...(materialized ? { filter: `url(#${filterId})` } : {})}
            id={id}
            zIndex={0}
            // Keep full-data native layout; the interaction layer suppresses hidden paint.
            hide={false}
            {...(nativeLabel !== undefined ? { label: nativeLabel } : {})}
            {...(props.background
              ? {
                  background: {
                    ...(
                      <BackgroundPaint
                        option={props.background}
                        hidden={effectiveHide}
                        seriesKey={key}
                      />
                    ),
                    ...(typeof props.background === "object" && "zIndex" in props.background
                      ? { zIndex: props.background.zIndex }
                      : {}),
                  },
                }
              : {})}
            activeBar={interaction.inactive ? false : (props.activeBar ?? false)}
            {...(patterned
              ? { fill: `url(#${patternId})` }
              : color !== undefined
                ? { fill: color }
                : {})}
            className={["kind-ui-bar-series", selector, className].filter(Boolean).join(" ")}
            style={style}
            isAnimationActive={false}
          >
            {nativeChildren}
          </Bar>
        </SeriesInteractionLayer>
      </ZIndexLayer>
    </>
  );
}

function CategoryBar({
  seriesKey,
  emphasisKey,
  axisId,
  ...props
}: BarShapeProps & {
  seriesKey: string | undefined;
  emphasisKey: BarSeriesProps["emphasisKey"];
  axisId: BarSeriesProps["xAxisId"];
}) {
  const { emphasisScope, pointer } = useLineInteraction();
  const keyboard = useChartKeyboard();
  const hover = useBarCategoryHover();
  const layout = useChartLayout();
  const xDomain = useXAxisDomain(axisId);
  const yDomain = useYAxisDomain(axisId);
  const domain = layout === "vertical" ? yDomain : xDomain;
  const semantic = emphasisKey ? emphasisKey(props.payload) : domain?.[props.originalDataIndex];
  // Native index-only domains cannot promise identity across data reorder.
  const eligible =
    emphasisKey !== undefined ? semantic !== undefined : typeof semantic === "string";
  const activeLabel = useActiveTooltipLabel();
  const activePoints = useActiveTooltipDataPoints();
  const nativeActive = useIsTooltipActive();
  const active =
    nativeActive && (activePoints?.includes(props.payload) || activeLabel === semantic);
  const emphasis = useEmphasis(
    {
      kind: "category",
      key: String(semantic),
      scope: `${emphasisScope}/${String(axisId ?? 0)}`,
      seriesKey,
    },
    eligible,
    false,
  );
  // Native axis inspection owns the category, including whitespace above and between bars.
  // A painted mark's leave must not clear a category while the cursor remains in its band.
  useLayoutEffect(() => {
    if (active && keyboard) emphasis.enter("keyboard");
    if (active && pointer && !keyboard && hover) emphasis.enter("pointer");
    else if (!hover || (pointer && !active)) emphasis.leave("pointer");
  }, [active, keyboard, pointer, hover, emphasis.enter, emphasis.leave]);
  return (
    <g data-kind-ui="emphasis-mark" data-emphasis={emphasis.dimmed ? "dimmed" : "baseline"}>
      <InteractionPaint
        data-kind-ui="emphasis-paint"
        opacity={emphasis.active?.kind === "series" ? 1 : emphasis.factor}
      >
        <Rectangle {...props} />
      </InteractionPaint>
    </g>
  );
}

function BackgroundPaint({
  option,
  hidden,
  seriesKey,
  ...props
}: Partial<BarShapeProps> & {
  option: BarSeriesProps["background"];
  hidden: boolean;
  seriesKey: string | undefined;
}) {
  const paint = isValidElement<BarShapeProps>(option) ? (
    cloneElement(option, { ...props, ...option.props })
  ) : typeof option === "function" ? (
    option(props as BarShapeProps)
  ) : (
    <Rectangle
      {...props}
      {...(typeof option === "object" && !isValidElement(option) ? option : {})}
    />
  );
  return (
    <SeriesEscapePaint seriesKey={seriesKey} hidden={hidden}>
      {paint}
    </SeriesEscapePaint>
  );
}
