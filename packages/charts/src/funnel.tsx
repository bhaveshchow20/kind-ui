"use client";

import { animate as animateValue, type MotionValue, useMotionValue } from "motion/react";
import {
  type ComponentPropsWithRef,
  type ComponentType,
  createContext,
  memo,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type FunnelTrapezoidItem,
  Funnel as NativeFunnel,
  FunnelChart as NativeFunnelChart,
  usePlotArea,
} from "recharts";
import { useChart } from "./chart-context.js";
import {
  type ChartInteractionConfig,
  useChartInteraction,
  useInteractionFocus,
} from "./chart-interaction.js";
import {
  type ChartName,
  type FamilyOptions,
  FamilyRoot,
  familyFrame,
  OutsidePlot,
} from "./family-root.js";
import {
  createFunnelModel,
  type FunnelAccessors,
  type FunnelDatum,
  type FunnelDenominator,
  type FunnelModel,
  type FunnelStage,
} from "./funnel-model.js";
import { Legend, type LegendProps } from "./legend.js";
import { LoadingSkeletonSurface, LoadingStatus, useLoadingSeed } from "./loading-skeleton.js";
import { useReducedMotion } from "./motion-preference.js";
import { SeriesColorDefinitions, SeriesPaintBoundary } from "./series-paint.js";
import type { TooltipContentProps } from "./tooltip-content.js";
import { TooltipNumber } from "./tooltip-number.js";
import { cn } from "./utils.js";

export interface FunnelAnimation {
  revealDurationMs?: number;
}
export type FunnelInteraction = {
  onBeforeInteraction?: NonNullable<ChartInteractionConfig["onBeforeInteraction"]>;
  markActivation?: "none" | "matching-legend";
} & (
  | {
      selected?: undefined;
      defaultSelected?: string | null;
      onSelectionChange?: (next: string | null) => void;
    }
  | {
      selected: string | null;
      defaultSelected?: never;
      onSelectionChange: (next: string | null) => void;
    }
);
type Inspection =
  | {
      activeId?: undefined;
      defaultActiveId?: string | null;
      onActiveIdChange?: (next: string | null) => void;
    }
  | {
      activeId: string | null;
      defaultActiveId?: never;
      onActiveIdChange: (next: string | null) => void;
    };
type NativeOptions = Omit<
  ComponentPropsWithRef<typeof NativeFunnelChart>,
  "data" | "children" | "layout" | "accessibilityLayer" | "ref"
>;
export type FunnelChartProps<T = FunnelDatum> = NativeOptions &
  Omit<
    FamilyOptions,
    "interaction" | "visibleSeries" | "defaultVisibleSeries" | "onVisibleSeriesChange"
  > &
  ChartName &
  Inspection & {
    "aria-describedby"?: string;
    data: readonly T[];
    denominator?: FunnelDenominator<T>;
    scaleMax?: number;
    orientation?: "vertical" | "horizontal";
    interaction?: FunnelInteraction;
    formatValue?: (value: number) => string;
    formatRatio?: (ratio: number) => string;
    ratioLabel?: string;
    missingLabel?: string;
    animate?: boolean | FunnelAnimation;
    loading?: boolean;
    loadingLabel?: string;
    empty?: ReactNode;
    children: Exclude<ReactNode, undefined>;
    ref?: React.Ref<SVGSVGElement>;
  } & ([T] extends [FunnelDatum]
    ? { accessors?: FunnelAccessors<T> }
    : { accessors: FunnelAccessors<T> });

type Context<T> = {
  model: FunnelModel<T>;
  orientation: "vertical" | "horizontal";
  loading: boolean;
  activeId: string | null;
  inspect: (id: string | null) => void;
  dismiss: () => void;
  interrupt: () => void;
  opacity: MotionValue<number>;
  formatValue: (value: number) => string;
  formatRatio: (ratio: number) => string;
  ratioLabel: string;
  missingLabel: string;
  tooltipId: string;
  tooltipMounted: boolean;
  setTooltipMounted: (value: boolean) => void;
  restoredFocus: React.RefObject<string | null>;
};
const FunnelContext = createContext<Context<unknown> | null>(null);
function useFunnel<T>() {
  const context = use(FunnelContext);
  if (!context) throw new Error("Funnel parts require FunnelChart");
  return context as Context<T>;
}
const defaultValue = (value: number) => String(value);
const ratioFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});
const defaultRatio = (ratio: number) => ratioFormatter.format(ratio);
/** Ordered preaggregated stages; native Funnel owns bands and numeric scaling. */
function FunnelChartRoot<T = FunnelDatum>(props: FunnelChartProps<T>) {
  const {
    data,
    accessors,
    denominator,
    scaleMax,
    config,
    frameProps,
    interaction,
    emphasis,
    nonce,
    legendPosition,
    orientation = "vertical",
    formatValue = defaultValue,
    formatRatio = defaultRatio,
    ratioLabel = "Ratio",
    missingLabel = "Unknown",
    animate = false,
    loading = false,
    loadingLabel,
    empty = "No stages",
    children,
    activeId: controlled,
    defaultActiveId,
    onActiveIdChange,
    ...native
  } = props;
  if (children === undefined) throw new Error("FunnelChart requires explicit children");
  if (Object.hasOwn(props, "rootProps")) throw new Error("FunnelChart does not accept rootProps");
  for (const key of ["visibleSeries", "defaultVisibleSeries", "onVisibleSeriesChange"])
    if (Object.hasOwn(props, key)) throw new Error("FunnelChart supports focus, not visibility");
  if (orientation !== "vertical" && orientation !== "horizontal")
    throw new Error("FunnelChart orientation must be vertical or horizontal");
  if (
    interaction &&
    (("kind" in interaction && interaction.kind !== "category") ||
      ("mode" in interaction && interaction.mode !== "focus"))
  )
    throw new Error("FunnelChart interaction requires category focus");
  const duration = typeof animate === "object" ? (animate.revealDurationMs ?? 700) : 700;
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error("Funnel animation duration must be finite and nonnegative");
  const ownership = useRef(controlled !== undefined);
  if (ownership.current !== (controlled !== undefined))
    throw new Error("Funnel inspection ownership cannot change during a mount");
  if (controlled !== undefined && !onActiveIdChange)
    throw new Error("Controlled Funnel inspection requires its callback");
  if (controlled !== undefined && defaultActiveId !== undefined)
    throw new Error("Funnel inspection cannot be controlled and defaulted");
  const model = useMemo(() => {
    const options = {
      data,
      ...(denominator !== undefined ? { denominator } : {}),
      ...(scaleMax !== undefined ? { scaleMax } : {}),
    };
    return accessors === undefined
      ? (createFunnelModel({
          ...options,
          data: data as readonly FunnelDatum[],
          denominator: denominator as FunnelDenominator<FunnelDatum>,
        }) as unknown as FunnelModel<T>)
      : createFunnelModel<T>({ ...options, accessors });
  }, [data, accessors, denominator, scaleMax]);
  if (!config || typeof config !== "object" || Array.isArray(config))
    throw new Error("FunnelChart requires config");
  for (const stage of model.stages) {
    if (!Object.hasOwn(config, stage.id))
      throw new Error(`FunnelChart config requires stage "${stage.id}"`);
  }
  const keys = useMemo(() => model.stages.map((stage) => stage.id), [model]);
  const [internal, setInternal] = useState(defaultActiveId ?? null);
  const [dismissed, setDismissed] = useState(false);
  const requested = controlled === undefined ? internal : controlled;
  const activeId =
    !loading && !dismissed && requested !== null && keys.includes(requested) ? requested : null;
  const reduced = useReducedMotion();
  const [finished, setFinished] = useState(false);
  const opacity = useMotionValue(1);
  const interrupt = useCallback(() => {
    opacity.set(1);
    setFinished(true);
  }, [opacity]);
  const previous = useRef({ model, orientation, loading });
  useLayoutEffect(() => {
    const old = previous.current;
    if (old.loading && !loading) setFinished(false);
    else if (old.model !== model || old.orientation !== orientation) interrupt();
    previous.current = { model, orientation, loading };
  }, [model, orientation, loading, interrupt]);
  useLayoutEffect(() => {
    if (!animate || reduced || loading || finished || duration === 0) {
      opacity.set(1);
      return;
    }
    opacity.set(0);
    const controls = animateValue(opacity, 1, {
      duration: duration / 1000,
      ease: "easeOut",
      onComplete: () => setFinished(true),
    });
    return () => controls.stop();
  }, [animate, reduced, loading, finished, duration, opacity]);
  const inspect = useCallback(
    (id: string | null) => {
      if (loading) return;
      interrupt();
      setDismissed(false);
      if (controlled === undefined) setInternal(id);
      if (requested !== id) onActiveIdChange?.(id);
    },
    [loading, interrupt, controlled, requested, onActiveIdChange],
  );
  const dismiss = useCallback(() => {
    interrupt();
    setDismissed(true);
    if (controlled === undefined) setInternal(null);
    if (requested !== null) onActiveIdChange?.(null);
  }, [interrupt, controlled, requested, onActiveIdChange]);
  const tooltipId = useId();
  const instructionsId = useId();
  const loadingSeed = useLoadingSeed(loading);
  const [tooltipMounted, setTooltipMounted] = useState(false);
  const restoredFocus = useRef<string | null>(null);
  const chartProps = native as ComponentPropsWithRef<typeof NativeFunnelChart>;
  const context: Context<T> = {
    model,
    orientation,
    loading,
    activeId,
    inspect,
    dismiss,
    interrupt,
    opacity,
    formatValue,
    formatRatio,
    ratioLabel,
    missingLabel,
    tooltipId,
    tooltipMounted,
    setTooltipMounted,
    restoredFocus,
  };
  return (
    <FamilyRoot
      family="FunnelChart"
      config={config}
      name={props}
      loading={loading}
      interaction={{ ...interaction, kind: "category", mode: "focus", eligibleKeys: keys }}
      {...(frameProps !== undefined ? { frameProps } : {})}
      {...(emphasis !== undefined ? { emphasis } : {})}
      {...(nonce !== undefined ? { nonce } : {})}
      {...(legendPosition ? { legendPosition } : {})}
      instructions={{
        id: instructionsId,
        text: "Use arrow keys, Home and End to inspect stages. Enter or Space highlights a stage. Escape dismisses the readout and clears highlighting.",
      }}
    >
      <FunnelContext value={context as Context<unknown>}>
        <NativeFunnelChart
          {...chartProps}
          {...familyFrame(chartProps)}
          responsive={chartProps.responsive ?? true}
          accessibilityLayer={false}
          aria-describedby={cn(props["aria-describedby"], instructionsId)}
          className={cn(familyFrame(chartProps).className, "kind-ui-funnel-chart")}
          data-kind-ui="funnel-chart"
          aria-busy={loading || undefined}
        >
          <FunnelLifecycle />
          {loading ? (
            <LoadingSkeletonSurface
              family="funnel"
              seed={loadingSeed}
              design={() => (
                <g fill="currentColor">
                  <rect x="48" y="20" width="540" height="36" />
                  <rect x="96" y="76" width="444" height="36" />
                  <rect x="144" y="132" width="348" height="36" />
                  <rect x="192" y="188" width="252" height="36" />
                </g>
              )}
            />
          ) : null}
          {children}
        </NativeFunnelChart>
        <LoadingStatus loading={loading} label={loadingLabel} />
        {!loading && !model.stages.length ? (
          <OutsidePlot>
            <div data-kind-ui="funnel-empty">{empty}</div>
          </OutsidePlot>
        ) : null}
      </FunnelContext>
    </FamilyRoot>
  );
}
function FunnelLifecycle() {
  const { interrupt } = useFunnel();
  const plot = usePlotArea();
  const previous = useRef<{ width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    if (!plot) return;
    if (
      previous.current &&
      (previous.current.width !== plot.width || previous.current.height !== plot.height)
    )
      interrupt();
    previous.current = { width: plot.width, height: plot.height };
  }, [plot, interrupt]);
  return null;
}

export interface FunnelGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Cross-section dimensions; widths in vertical orientation, heights in horizontal. */
  upperWidth: number;
  lowerWidth: number;
  orientation: "vertical" | "horizontal";
  points: readonly (readonly [number, number])[];
}
export interface FunnelShapeProps<T = FunnelDatum> {
  stage: FunnelStage<T>;
  geometry: FunnelGeometry;
  fill: string;
  selected: boolean;
  active: boolean;
}
export type FunnelStagesProps<T = FunnelDatum> = {
  geometry?: "rectangle" | "trapezoid";
  Shape?: ComponentType<FunnelShapeProps<T>>;
  stageProps?: (stage: FunnelStage<T>) => ComponentPropsWithRef<"g">;
};
const FunnelStageOptions = createContext<FunnelStagesProps<unknown> | null>(null);
type NativeStageData = { id: string; index: number; value: number };
const nativeStageShape = (native: FunnelTrapezoidItem) => <FunnelStageMark native={native} />;

// Native Funnel keys its marks by its computed array even with animation disabled.
// Keep that renderer stable while inspection and consumer handlers update through context.
const FunnelNativeStages = memo(function FunnelNativeStages({
  stages,
  loading,
}: {
  stages: readonly NativeStageData[];
  loading: boolean;
}) {
  return (
    <SeriesPaintBoundary>
      <SeriesColorDefinitions />
      <NativeFunnel
        data={stages}
        dataKey="value"
        nameKey="id"
        isAnimationActive={false}
        lastShapeType="rectangle"
        activeShape={false}
        hide={loading}
        shape={nativeStageShape}
      />
    </SeriesPaintBoundary>
  );
});

/** Explicit marks; unknown and zero stages retain independent inspection hit targets. */
export function FunnelStages<T = FunnelDatum>(props: FunnelStagesProps<T>) {
  const context = useFunnel<T>();
  const encoded = JSON.stringify(
    context.model.stages.map((stage) => ({
      id: stage.id,
      index: stage.index,
      value: stage.value ?? 0,
    })),
  );
  const nativeStages = useMemo(() => JSON.parse(encoded) as NativeStageData[], [encoded]);
  const geometry = props.geometry ?? "rectangle";
  if (geometry !== "rectangle" && geometry !== "trapezoid")
    throw new Error("FunnelStages geometry must be rectangle or trapezoid");
  return (
    <FunnelStageOptions value={props as FunnelStagesProps<unknown>}>
      <FunnelNativeStages stages={nativeStages} loading={context.loading} />
    </FunnelStageOptions>
  );
}
function FunnelStageMark<T>({ native }: { native: FunnelTrapezoidItem }) {
  const options = use(FunnelStageOptions) as FunnelStagesProps<T> | null;
  if (!options) throw new Error("Funnel stage requires FunnelChart.Stages");
  const { geometry: mode = "rectangle", Shape, stageProps } = options;
  const context = useFunnel<T>();
  const interaction = useChartInteraction();
  const { paints } = useChart();
  const index = (native.payload as { index?: number } | undefined)?.index;
  const stage = index === undefined ? undefined : context.model.stages[index];
  const focusRef = useInteractionFocus(stage?.id, !context.loading);
  if (!stage) return null;
  const props = stageProps?.(stage) ?? {};
  const parent = native.parentViewBox;
  const ratio = context.model.maximum / context.model.scaleMax;
  const crossScale = context.orientation === "vertical" ? 1 : parent.height / parent.width;
  const upperWidth = native.upperWidth * ratio * crossScale;
  const next = context.model.stages[stage.index + 1];
  const lowerWidth =
    mode === "trapezoid" && next?.value !== null && next !== undefined
      ? native.lowerWidth * ratio * crossScale
      : upperWidth;
  const extent =
    context.orientation === "vertical"
      ? native.height
      : (native.height * parent.width) / parent.height;
  const start =
    context.orientation === "vertical"
      ? native.y
      : parent.x + ((native.y - parent.y) * parent.width) / parent.height;
  const center =
    context.orientation === "vertical" ? parent.x + parent.width / 2 : parent.y + parent.height / 2;
  const points: readonly (readonly [number, number])[] =
    context.orientation === "vertical"
      ? [
          [center - upperWidth / 2, start],
          [center + upperWidth / 2, start],
          [center + lowerWidth / 2, start + extent],
          [center - lowerWidth / 2, start + extent],
        ]
      : [
          [start, center - upperWidth / 2],
          [start + extent, center - lowerWidth / 2],
          [start + extent, center + lowerWidth / 2],
          [start, center + upperWidth / 2],
        ];
  const geometry: FunnelGeometry = {
    x: context.orientation === "vertical" ? center - Math.max(upperWidth, lowerWidth) / 2 : start,
    y: context.orientation === "vertical" ? start : center - Math.max(upperWidth, lowerWidth) / 2,
    width: context.orientation === "vertical" ? Math.max(upperWidth, lowerWidth) : extent,
    height: context.orientation === "vertical" ? extent : Math.max(upperWidth, lowerWidth),
    upperWidth,
    lowerWidth,
    orientation: context.orientation,
    points,
  };
  const finite = [
    geometry.x,
    geometry.y,
    geometry.width,
    geometry.height,
    upperWidth,
    lowerWidth,
    extent,
    ...points.flat(),
  ].every(Number.isFinite);
  const entryRepresentable =
    context.orientation === "vertical"
      ? points[0]?.[0] !== points[1]?.[0]
      : points[0]?.[1] !== points[3]?.[1];
  const exitRepresentable =
    lowerWidth === 0 ||
    (context.orientation === "vertical"
      ? points[2]?.[0] !== points[3]?.[0]
      : points[1]?.[1] !== points[2]?.[1]);
  if (
    !finite ||
    extent <= 0 ||
    (stage.value !== null &&
      stage.value > 0 &&
      (upperWidth <= 0 || !entryRepresentable || !exitRepresentable))
  )
    throw new Error(
      `Funnel stage "${stage.id}" cannot be represented at this viewport; use rescaled units or a different scale maximum`,
    );
  const hit =
    context.orientation === "vertical"
      ? { x: parent.x, y: start, width: parent.width, height: extent }
      : { x: start, y: parent.y, width: extent, height: parent.height };
  const formatted = stage.value === null ? context.missingLabel : context.formatValue(stage.value);
  const label = `${stage.label}: ${formatted}${stage.ratio === null ? "" : `; ${context.ratioLabel}: ${context.formatRatio(stage.ratio)}`}`;
  const selected = interaction.selected === stage.id;
  const active = context.activeId === stage.id;
  const activate = (event: React.SyntheticEvent<SVGGElement>) => {
    if (!event.defaultPrevented && !context.loading) {
      context.inspect(stage.id);
      interaction.activate({ kind: "category", key: stage.id }, "mark", event);
    }
  };
  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG stage groups provide a single keyboard target and retain SVG consumer refs.
    <g
      {...props}
      ref={(node) => {
        focusRef(node);
        const cleanup = typeof props.ref === "function" ? props.ref(node) : undefined;
        if (props.ref && typeof props.ref !== "function") props.ref.current = node;
        if (node)
          return () => {
            const restoring = node === document.activeElement;
            if (restoring) context.restoredFocus.current = stage.id;
            focusRef(null);
            if (restoring)
              queueMicrotask(() => {
                if (context.restoredFocus.current === stage.id)
                  context.restoredFocus.current = null;
              });
            if (typeof cleanup === "function") cleanup();
            else if (typeof props.ref === "function") props.ref(null);
            else if (props.ref) props.ref.current = null;
          };
      }}
      role="button"
      tabIndex={context.loading ? -1 : 0}
      aria-label={label}
      aria-pressed={selected}
      aria-disabled={context.loading || undefined}
      aria-describedby={active && context.tooltipMounted ? context.tooltipId : undefined}
      data-kind-ui="funnel-stage"
      data-stage-id={stage.id}
      data-stage-index={stage.index}
      data-value-state={stage.value === null ? "unknown" : stage.value === 0 ? "zero" : "known"}
      data-interaction-focus-key={stage.id}
      className={cn("outline-none [&:focus-visible>rect]:stroke-current", props.className)}
      onPointerEnter={(event) => {
        props.onPointerEnter?.(event);
        if (!event.defaultPrevented) context.inspect(stage.id);
      }}
      onFocus={(event) => {
        props.onFocus?.(event);
        if (!event.defaultPrevented && context.restoredFocus.current !== stage.id)
          context.inspect(stage.id);
      }}
      onClick={(event) => {
        props.onClick?.(event);
        activate(event);
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented || context.loading) return;
        if (event.key === "Escape") {
          context.dismiss();
          interaction.reset(event);
          event.preventDefault();
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          activate(event);
          event.preventDefault();
          return;
        }
        const movement =
          event.key === "ArrowRight" || event.key === "ArrowDown"
            ? 1
            : event.key === "ArrowLeft" || event.key === "ArrowUp"
              ? -1
              : 0;
        const targetIndex =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? context.model.stages.length - 1
              : movement
                ? Math.max(0, Math.min(context.model.stages.length - 1, stage.index + movement))
                : null;
        if (targetIndex !== null) {
          event.preventDefault();
          const target = context.model.stages[targetIndex];
          if (!target) return;
          const svg = event.currentTarget.ownerSVGElement;
          const node = Array.from(
            svg?.querySelectorAll<SVGGElement>('[data-kind-ui="funnel-stage"]') ?? [],
          ).find((node) => node.dataset.stageId === target.id);
          // Focus emits no event at a clamped endpoint or Home on the current stage.
          if (node === document.activeElement) context.inspect(target.id);
          else node?.focus();
        }
      }}
    >
      <rect {...hit} fill="transparent" stroke="transparent" pointerEvents="all" />
      {!context.loading && stage.value === null ? (
        <rect
          {...hit}
          fill="none"
          stroke="currentColor"
          strokeDasharray="4 4"
          opacity="0.35"
          pointerEvents="none"
          data-kind-ui="funnel-unknown"
        />
      ) : null}
      {!context.loading && stage.value !== null && stage.value > 0 ? (
        <FunnelPaint opacity={context.opacity}>
          <g
            data-inactive={(interaction.selected !== null && !selected) || undefined}
            className="data-[inactive=true]:opacity-40"
          >
            {Shape ? (
              <Shape
                stage={stage}
                geometry={geometry}
                fill={paints[stage.id] ?? "currentColor"}
                selected={selected}
                active={active}
              />
            ) : (
              <polygon
                data-kind-ui="funnel-mark"
                data-upper-width={upperWidth}
                data-lower-width={lowerWidth}
                points={points.map((point) => point.join(",")).join(" ")}
                fill={paints[stage.id] ?? "currentColor"}
                stroke="var(--background,white)"
                strokeWidth="1"
              />
            )}
          </g>
        </FunnelPaint>
      ) : null}
    </g>
  );
}

/** Bind the Motion value to settled SVG paint without replacing consumer animation context. */
function FunnelPaint({ opacity, children }: { opacity: MotionValue<number>; children: ReactNode }) {
  const ref = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    const update = (value: number) => ref.current?.style.setProperty("opacity", String(value));
    update(opacity.get());
    return opacity.on("change", update);
  }, [opacity]);
  return (
    <g ref={ref} pointerEvents="none" data-kind-ui="funnel-stage-paint">
      {children}
    </g>
  );
}

export type FunnelLabelsProps<T = FunnelDatum> = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  render?: (stage: FunnelStage<T>) => ReactNode;
};
export function FunnelLabels<T = FunnelDatum>({ render, ...props }: FunnelLabelsProps<T>) {
  const context = useFunnel<T>();
  return (
    <OutsidePlot>
      <ul
        {...props}
        hidden={context.loading || props.hidden || undefined}
        data-kind-ui="funnel-labels"
        className={cn("list-none mx-0 mt-1 mb-2 p-0 [&[hidden]]:hidden", props.className)}
      >
        {context.model.stages.map((stage) => (
          <li key={stage.id} data-stage-id={stage.id}>
            {render ? (
              render(stage)
            ) : (
              <>
                <span>{stage.label}</span>
                {": "}
                <span className="tabular-nums">
                  {stage.value === null ? context.missingLabel : context.formatValue(stage.value)}
                </span>
                {stage.ratio === null ? null : (
                  <span>{`; ${context.ratioLabel}: ${context.formatRatio(stage.ratio)}`}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </OutsidePlot>
  );
}
export interface FunnelTooltipContentProps<T = FunnelDatum> {
  stage: FunnelStage<T>;
  formattedValue: string;
  formattedRatio: string | null;
  ratioLabel: string;
}
export type FunnelTooltipProps<T = FunnelDatum> = Omit<ComponentPropsWithRef<"div">, "children"> & {
  Content?: ComponentType<FunnelTooltipContentProps<T>>;
  valueAnimation?: TooltipContentProps["valueAnimation"];
};
export function FunnelTooltip<T = FunnelDatum>({
  Content,
  valueAnimation,
  ...props
}: FunnelTooltipProps<T>) {
  const context = useFunnel<T>();
  useEffect(() => {
    context.setTooltipMounted(true);
    return () => context.setTooltipMounted(false);
  }, [context.setTooltipMounted]);
  const stage = context.model.stages.find((item) => item.id === context.activeId);
  const formattedValue =
    stage?.value === null ? context.missingLabel : stage ? context.formatValue(stage.value) : "";
  const formattedRatio = stage?.ratio === null || !stage ? null : context.formatRatio(stage.ratio);
  return (
    <OutsidePlot>
      <div
        {...props}
        id={context.tooltipId}
        role="tooltip"
        data-kind-ui="funnel-tooltip"
        hidden={!stage || context.loading || props.hidden || undefined}
        className={cn(
          "mt-[0.75rem] rounded-[var(--radius,0.5rem)] border border-solid border-[var(--border,#d1d5db)] px-[0.8rem] py-[0.6rem] text-[0.8rem] wrap-anywhere [&[hidden]]:hidden",
          props.className,
        )}
      >
        {stage ? (
          Content ? (
            <Content
              stage={stage}
              formattedValue={formattedValue}
              formattedRatio={formattedRatio}
              ratioLabel={context.ratioLabel}
            />
          ) : (
            <>
              {stage.label}
              {": "}
              {valueAnimation === "shuffle" && stage.value !== null ? (
                <TooltipNumber value={formattedValue} />
              ) : (
                formattedValue
              )}
              {formattedRatio === null ? null : `; ${context.ratioLabel}: ${formattedRatio}`}
            </>
          )
        ) : null}
      </div>
    </OutsidePlot>
  );
}
export interface FunnelDataColumn<T = FunnelDatum> {
  id: string;
  header: ReactNode;
  render: (stage: FunnelStage<T>) => ReactNode;
}
export type FunnelDataTableProps<T = FunnelDatum> = Omit<
  ComponentPropsWithRef<"table">,
  "children"
> & { caption: string; columns?: readonly FunnelDataColumn<T>[] };
export function FunnelDataTable<T = FunnelDatum>({
  caption,
  columns = [],
  ...props
}: FunnelDataTableProps<T>) {
  const context = useFunnel<T>();
  const ratios = context.model.stages.some((stage) => stage.denominator !== null);
  return (
    <OutsidePlot>
      <div
        className="w-full min-w-0 overflow-auto [&[hidden]]:hidden"
        hidden={context.loading || undefined}
      >
        <table
          {...props}
          data-kind-ui="funnel-data-table"
          className={cn(
            "w-full border-collapse text-[0.8rem] [&_th]:border [&_th]:border-solid [&_th]:border-[var(--border,#d1d5db)] [&_th]:p-[0.5rem] [&_th]:text-left [&_td]:border [&_td]:border-solid [&_td]:border-[var(--border,#d1d5db)] [&_td]:p-[0.5rem] [&_td]:text-left",
            props.className,
          )}
        >
          <caption className="py-[0.75rem] text-left">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Stage</th>
              <th scope="col">Value</th>
              {ratios ? (
                <>
                  <th scope="col">Denominator</th>
                  <th scope="col">{context.ratioLabel}</th>
                </>
              ) : null}
              {columns.map((column) => (
                <th scope="col" key={column.id}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {context.model.stages.map((stage) => (
              <tr key={stage.id} data-stage-id={stage.id}>
                <th scope="row">{stage.label}</th>
                <td>
                  {stage.value === null ? context.missingLabel : context.formatValue(stage.value)}
                </td>
                {ratios ? (
                  <>
                    <td>
                      {stage.denominator === null
                        ? context.missingLabel
                        : context.formatValue(stage.denominator)}
                    </td>
                    <td>
                      {stage.ratio === null
                        ? context.missingLabel
                        : context.formatRatio(stage.ratio)}
                    </td>
                  </>
                ) : null}
                {columns.map((column) => (
                  <td key={column.id}>{column.render(stage)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OutsidePlot>
  );
}
export function FunnelLegend(props: LegendProps) {
  useFunnel();
  return (
    <OutsidePlot>
      <Legend {...props} />
    </OutsidePlot>
  );
}
export function FunnelContent({ children }: { children: ReactNode }) {
  useFunnel();
  return <OutsidePlot>{children}</OutsidePlot>;
}

/** Explicit parts remain independently exported for typed consumer composition. */
export const FunnelChart = Object.assign(FunnelChartRoot, {
  Stages: FunnelStages,
  Labels: FunnelLabels,
  Tooltip: FunnelTooltip,
  DataTable: FunnelDataTable,
  Legend: FunnelLegend,
  Content: FunnelContent,
});
