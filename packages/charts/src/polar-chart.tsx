"use client";

import { animate as animateValue, type Transition } from "motion/react";
import {
  type ComponentProps,
  createContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { RadarChart as EngineRadarChart, RadialBarChart as EngineRadialBarChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import type { CategoryKey } from "./category-cells.js";
import { LineChartFrame, useLineInteraction } from "./line-chart.js";
import { PolarLoadingDesign } from "./loading-polar-designs.js";
import { type RadarSelectionProps, RadarSelectionProvider } from "./radar-interaction.js";
import { RadialCategory } from "./radial-category.js";

export type RadarAnimation = Omit<LineAnimation, "revealDirection">;
export type RadialBarAnimation = Omit<LineAnimation, "revealDirection">;
export type RadarChartProps<DataPoint = unknown> = ComponentProps<
  typeof EngineRadarChart<DataPoint>
> &
  RadarSelectionProps & {
    animate?: boolean | RadarAnimation | undefined;
    loading?: boolean | undefined;
    loadingLabel?: string | undefined;
  };
export type RadialBarChartProps<DataPoint = unknown> = ComponentProps<
  typeof EngineRadialBarChart<DataPoint>
> & {
  /** Opt-in category colors from Root.config, resolved from original chart rows. */
  categoryKey?: CategoryKey<DataPoint> | undefined;
  animate?: boolean | RadialBarAnimation | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
  /** Entrance direction only; native chart and axis angles stay consumer-owned. */
  animationDirection?: "clockwise" | "anticlockwise" | undefined;
};
export const PolarMotion = createContext<{ reveal: boolean; options: RadarAnimation }>({
  reveal: false,
  options: {},
});
export const RadarMotion = createContext({ reveal: false, progress: 1 });
export const RadialMotion = createContext({
  reveal: false,
  progress: 1,
  direction: "clockwise" as "clockwise" | "anticlockwise",
});
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;
const defaultHover: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };

function usePolarMotion(animate: RadarChartProps["animate"], loading: boolean | undefined) {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [finished, setFinished] = useState(false);
  const interrupt = useCallback(() => {
    if (!loading) setFinished(true);
  }, [loading]);
  useLayoutEffect(() => {
    if (loading) setFinished(false);
  }, [loading]);
  const enabled = animate !== false && !reduced && !loading;
  const options = typeof animate === "object" ? animate : {};
  return { enabled, options, reveal: enabled && !finished, interrupt };
}
// These native polar inputs can move marks without changing data or chart dimensions.
function PolarLifecycle({
  layout,
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  barGap,
  barCategoryGap,
  barSize,
  maxBarSize,
  stackOffset,
  reverseStackOrder,
  children,
}: RadarChartProps) {
  const { invalidate } = useLineInteraction();
  const inputs = [
    layout,
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    barGap,
    barCategoryGap,
    barSize,
    maxBarSize,
    stackOffset,
    reverseStackOrder,
    children,
  ];
  const previous = useRef(inputs);
  useLayoutEffect(() => {
    if (inputs.some((value, index) => value !== previous.current[index])) invalidate();
    previous.current = inputs;
  });
  return null;
}

/** Native polar composition with shared metadata, interaction and optional Motion. */
export function RadarChart<DataPoint = unknown>({
  animate = false,
  loading,
  loadingLabel,
  selection,
  selectedSeries,
  onSelectedSeriesChange,
  children,
  ...props
}: RadarChartProps<DataPoint>) {
  const { enabled, options, reveal, interrupt } = usePolarMotion(animate, loading);
  const [progress, setProgress] = useState(1);
  const duration = options.revealDurationMs ?? 1000;
  const easing = options.revealEasing ?? "easeOut";
  const started = useRef(false);
  useLayoutEffect(() => {
    if (loading) started.current = false;
  }, [loading]);
  const previous = useRef([duration, easing]);
  const previousEnabled = useRef(enabled);
  useLayoutEffect(() => {
    const inputs = [duration, easing];
    if (
      (started.current && inputs.some((value, index) => value !== previous.current[index])) ||
      (previousEnabled.current && !enabled)
    )
      interrupt();
    previous.current = inputs;
    previousEnabled.current = enabled;
  });
  useLayoutEffect(() => {
    if (!reveal) {
      setProgress(1);
      return;
    }
    started.current = true;
    setProgress(0);
    const controls = animateValue(0, 1, {
      duration: Math.max(0, duration) / 1000,
      ease: easing,
      onUpdate: setProgress,
      onComplete: interrupt,
    });
    return () => controls.stop();
  }, [reveal, duration, easing, interrupt]);
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <RadarMotion value={{ reveal, progress }}>
        <PolarMotion value={{ reveal, options }}>
          <RadarSelectionProvider
            selection={selection}
            selectedSeries={selectedSeries}
            onSelectedSeriesChange={onSelectedSeriesChange}
          >
            <LineChartFrame
              engine={EngineRadarChart<DataPoint>}
              loading={loading}
              loadingLabel={loadingLabel}
              loadingSkeleton="radar"
              loadingDesign={(seed) => <PolarLoadingDesign family={"radar"} seed={seed} />}
              loadingAnimation={options}
              chartProps={props}
              motionEnabled={enabled}
              interrupt={interrupt}
            >
              <PolarLifecycle {...props}>{children}</PolarLifecycle>
              {children}
            </LineChartFrame>
          </RadarSelectionProvider>
        </PolarMotion>
      </RadarMotion>
    </MotionContext>
  );
}

export function RadialBarChart<DataPoint = unknown>(props: RadialBarChartProps<DataPoint>) {
  return <RadialBarChartFrame {...props} />;
}

/** Private recipe integration; the public chart keeps its native prop contract. */
export function RadialBarChartFrame<DataPoint = unknown>({
  skeletonFamily = "radial-bar",
  animate = false,
  loading,
  loadingLabel,
  animationDirection = "clockwise",
  categoryKey,
  children,
  ...props
}: RadialBarChartProps<DataPoint> & {
  skeletonFamily?: "radial-bar" | "activity-rings";
}) {
  if (categoryKey !== undefined && props.data === undefined)
    throw new Error("RadialBarChart categoryKey requires explicit chart data");
  const categories =
    categoryKey === undefined
      ? null
      : {
          data: props.data ?? [],
          key: (row: unknown) => {
            if (typeof categoryKey === "function") return categoryKey(row as DataPoint);
            return row !== null && typeof row === "object" && Object.hasOwn(row, categoryKey)
              ? ((row as Record<string, string>)[categoryKey] as string)
              : "";
          },
        };
  const { enabled, options, reveal, interrupt } = usePolarMotion(animate, loading);
  const [progress, setProgress] = useState(1);
  const duration = options.revealDurationMs ?? 1000;
  const easing = options.revealEasing ?? "easeOut";
  const started = useRef(false);
  useLayoutEffect(() => {
    if (loading) started.current = false;
  }, [loading]);
  const previous = useRef([duration, easing, animationDirection]);
  const previousEnabled = useRef(enabled);
  useLayoutEffect(() => {
    const inputs = [duration, easing, animationDirection];
    if (previousEnabled.current && !enabled) interrupt();
    previousEnabled.current = enabled;
    if (started.current && inputs.some((value, index) => value !== previous.current[index]))
      interrupt();
    previous.current = inputs;
  });
  useLayoutEffect(() => {
    if (!reveal) {
      setProgress(1);
      return;
    }
    started.current = true;
    setProgress(0);
    const controls = animateValue(0, 1, {
      duration: Math.max(0, duration) / 1000,
      ease: easing,
      onUpdate: setProgress,
      onComplete: interrupt,
    });
    return () => controls.stop();
  }, [reveal, duration, easing, interrupt]);
  return (
    <RadialCategory value={categories}>
      <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
        <RadialMotion value={{ reveal, progress, direction: animationDirection }}>
          <PolarMotion value={{ reveal, options }}>
            <LineChartFrame
              engine={EngineRadialBarChart<DataPoint>}
              loading={loading}
              loadingLabel={loadingLabel}
              loadingSkeleton={skeletonFamily}
              loadingDesign={(seed) => <PolarLoadingDesign family={skeletonFamily} seed={seed} />}
              loadingAnimation={{ ...options, direction: animationDirection }}
              chartProps={props}
              motionEnabled={enabled}
              interrupt={interrupt}
            >
              <PolarLifecycle {...props}>{children}</PolarLifecycle>
              {children}
            </LineChartFrame>
          </PolarMotion>
        </RadialMotion>
      </MotionContext>
    </RadialCategory>
  );
}
