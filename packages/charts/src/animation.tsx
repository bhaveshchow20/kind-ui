"use client";

import {
  animate as animateValue,
  type MotionValue,
  motion,
  type Transition,
  useMotionValue,
} from "motion/react";
import {
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DefaultZIndexes,
  type DotProps,
  LineChart as EngineLineChart,
  ZIndexLayer,
} from "recharts";
import { useChart } from "./chart-context.js";
import {
  LineChartFrame,
  type LineChartProps as StaticLineChartProps,
  useLineInteraction,
} from "./line-chart.js";
import {
  LineSeries as StaticLineSeries,
  type LineSeriesProps as StaticLineSeriesProps,
} from "./line-series.js";
import { registerPiePinComponent } from "./pie-pin-identity.js";
import { markerPaint, type PointStyle } from "./point-marker.js";
import { RevealClip, type RevealDirection } from "./reveal-clip.js";
import { TooltipBase, type TooltipFrameProps, type TooltipProps } from "./tooltip.js";

export type BaseAnimation = {
  revealDurationMs?: number;
  revealEasing?: Transition["ease"];
  hoverTransition?: Transition;
};
export type LineAnimation = BaseAnimation & {
  /** Physical horizontal entrance direction, independent of native chart layout. */
  revealDirection?: RevealDirection;
};
type DefaultLineDataKey = Extract<StaticLineSeriesProps["dataKey"], (row: never) => unknown>;
export type LineSeriesProps<
  DataPoint = Parameters<DefaultLineDataKey>[0],
  Value = ReturnType<DefaultLineDataKey>,
> = Omit<StaticLineSeriesProps<DataPoint, Value>, "isAnimationActive">;
export type LineChartProps = StaticLineChartProps & {
  animate?: boolean | LineAnimation | undefined;
};
const defaultHover: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };
export const MotionContext = createContext({ enabled: false, transition: defaultHover });
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;

/** Motion owns the shared entrance clip and default active marks. */
export function LineChart({
  animate = false,
  loading,
  loadingLabel,
  children,
  ...props
}: LineChartProps) {
  const id = useId();
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const options = typeof animate === "object" ? animate : {};
  const enabled = animate !== false && !reduced && !loading;
  const interrupt = useCallback(() => {
    if (!loading) setInteracted(true);
  }, [loading]);
  useLayoutEffect(() => {
    if (loading) setInteracted(false);
  }, [loading]);
  const reveal = enabled && !interacted;
  const transition = options.hoverTransition ?? defaultHover;
  return (
    <MotionContext value={{ enabled, transition }}>
      <LineChartFrame
        chartProps={props}
        loading={loading}
        loadingLabel={loadingLabel}
        loadingSkeleton="line"
        loadingAnimation={options}
        engine={EngineLineChart}
        motionEnabled={enabled}
        interrupt={interrupt}
        {...(reveal ? { clip: `url(#${id}-reveal)` } : {})}
      >
        {reveal && (
          <RevealClip
            id={`${id}-reveal`}
            options={options}
            {...(options.revealDirection === undefined ? {} : { finish: interrupt })}
          />
        )}
        {children}
      </LineChartFrame>
    </MotionContext>
  );
}
// Stop the previous target before retargeting or snapping, without remounting consumer DOM.
function useAnimatedCoordinate(
  target: number,
  enabled: boolean,
  transition: Transition,
  retained?: MotionValue<number>,
) {
  const local = useMotionValue(target);
  const value = retained ?? local;
  useLayoutEffect(() => {
    if (!enabled) {
      value.set(target);
      return;
    }
    const controls = animateValue(value, target, transition);
    return () => controls.stop();
  }, [value, target, enabled, transition]);
  return value;
}
const PaintOpacity = createContext<Map<string, MotionValue<number>> | null>(null);

/** Own fade state outside native animation-key reconciliation. */
export function InteractionPaintScope({ children }: { children: ReactNode }) {
  const [values] = useState(() => new Map<string, MotionValue<number>>());
  return <PaintOpacity value={values}>{children}</PaintOpacity>;
}

/** Retarget paint from its current opacity without changing native data or geometry. */
export function InteractionPaint({
  opacity,
  identity,
  children,
  "data-kind-ui": kind = "interaction-paint",
}: {
  opacity: number;
  identity?: string | undefined;
  children: ReactNode;
  "data-kind-ui"?: string | undefined;
}) {
  const { enabled, transition } = use(MotionContext);
  const values = use(PaintOpacity);
  const value = useAnimatedCoordinate(
    opacity,
    enabled,
    transition,
    identity === undefined ? undefined : values?.get(identity),
  );
  if (identity !== undefined && values && !values.has(identity)) values.set(identity, value);
  return (
    <motion.g data-kind-ui={kind} initial={false} style={{ opacity: value }}>
      {children}
    </motion.g>
  );
}
export function ActiveMarker({
  cx,
  cy,
  fill,
  stroke,
  variant = "default",
}: DotProps & { variant?: PointStyle | undefined }) {
  const { enabled, transition } = use(MotionContext);
  const { motionReady } = useLineInteraction();
  const animate = enabled && motionReady;
  const x = useAnimatedCoordinate(cx ?? 0, animate, transition);
  const y = useAnimatedCoordinate(cy ?? 0, animate, transition);
  if (cx == null || cy == null) return null;
  return (
    <motion.circle
      data-kind-ui="active-marker"
      initial={false}
      cx={x}
      cy={y}
      r={5}
      fill={fill ?? stroke}
      stroke="var(--card, white)"
      strokeWidth={2}
      strokeDasharray="none"
      {...markerPaint(variant, fill ?? stroke)}
      data-point-style={variant}
      pointerEvents="none"
    />
  );
}
export function LineSeries<
  DataPoint = Parameters<DefaultLineDataKey>[0],
  Value = ReturnType<DefaultLineDataKey>,
>(props: LineSeriesProps<DataPoint, Value>): ReactElement;
// Like native Line, default calls allow dynamic keys and nested path strings.
export function LineSeries(props: LineSeriesProps): ReactElement;
export function LineSeries<
  DataPoint = Parameters<DefaultLineDataKey>[0],
  Value = ReturnType<DefaultLineDataKey>,
>(props: LineSeriesProps<DataPoint, Value>) {
  const { visibleSeries } = useChart();
  const key = props.seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const visible = visibleSeries === undefined || (key !== undefined && visibleSeries.includes(key));
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.line}>
      <g pointerEvents={visible ? undefined : "none"} aria-hidden={visible ? undefined : true}>
        <StaticLineSeries<DataPoint, Value>
          {...props}
          activeDot={
            visible ? (props.activeDot ?? <ActiveMarker variant={props.activePointStyle} />) : false
          }
          zIndex={0}
          isAnimationActive={false}
        />
      </g>
    </ZIndexLayer>
  );
}
function MovingFrame({ x, y, maxX, maxY, ref, style, frameProps, children }: TooltipFrameProps) {
  const { enabled, transition } = use(MotionContext);
  const { motionReady } = useLineInteraction();
  const animate = enabled && motionReady;
  const movingX = useAnimatedCoordinate(x, animate, transition);
  const movingY = useAnimatedCoordinate(y, animate, transition);
  return (
    <motion.div
      data-kind-ui="tooltip-motion"
      initial={false}
      style={{ x: movingX, y: movingY }}
      transformTemplate={({ x = 0, y = 0 }) =>
        `translate(clamp(0px, ${typeof x === "number" ? `${x}px` : x}, ${maxX}px), clamp(0px, ${typeof y === "number" ? `${y}px` : y}, ${maxY}px))`
      }
    >
      <div
        {...frameProps}
        data-kind-ui="tooltip-frame"
        ref={ref}
        style={{ ...style, ...frameProps?.style }}
      >
        {children}
      </div>
    </motion.div>
  );
}
export function Tooltip(props: TooltipProps) {
  return <TooltipBase {...props} Frame={MovingFrame} />;
}
registerPiePinComponent(Tooltip, "tooltip");

export type { TooltipProps };
