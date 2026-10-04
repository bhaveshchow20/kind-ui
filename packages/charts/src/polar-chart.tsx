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
import { LineChartFrame, useLineInteraction } from "./line-chart.js";
import { type RadarSelectionProps, RadarSelectionProvider } from "./radar-interaction.js";

export type RadarAnimation = LineAnimation;
export type RadialBarAnimation = LineAnimation;
export type RadarChartProps<DataPoint = unknown> = ComponentProps<
  typeof EngineRadarChart<DataPoint>
> &
  RadarSelectionProps & {
    animate?: boolean | RadarAnimation | undefined;
  };
export type RadialBarChartProps<DataPoint = unknown> = ComponentProps<
  typeof EngineRadialBarChart<DataPoint>
> & {
  animate?: boolean | RadialBarAnimation | undefined;
};
export const PolarMotion = createContext<{ reveal: boolean; options: RadarAnimation }>({
  reveal: false,
  options: {},
});
export const RadarMotion = createContext({ reveal: false, progress: 1 });
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;
const defaultHover: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };

function usePolarMotion(animate: RadarChartProps["animate"]) {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [finished, setFinished] = useState(false);
  const interrupt = useCallback(() => setFinished(true), []);
  const enabled = animate !== false && !reduced;
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
  selection,
  selectedSeries,
  onSelectedSeriesChange,
  children,
  ...props
}: RadarChartProps<DataPoint>) {
  const { enabled, options, reveal, interrupt } = usePolarMotion(animate);
  const [progress, setProgress] = useState(1);
  const duration = options.revealDurationMs ?? 1000;
  const easing = options.revealEasing ?? "easeOut";
  const started = useRef(false);
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

export function RadialBarChart<DataPoint = unknown>({
  animate = false,
  children,
  ...props
}: RadialBarChartProps<DataPoint>) {
  const { enabled, options, reveal, interrupt } = usePolarMotion(animate);
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <PolarMotion value={{ reveal, options }}>
        <LineChartFrame
          engine={EngineRadialBarChart<DataPoint>}
          chartProps={props}
          motionEnabled={enabled}
          interrupt={interrupt}
        >
          <PolarLifecycle {...props}>{children}</PolarLifecycle>
          {children}
        </LineChartFrame>
      </PolarMotion>
    </MotionContext>
  );
}
