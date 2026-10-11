"use client";

import { animate as animateValue } from "motion/react";
import {
  type ComponentProps,
  createContext,
  memo,
  use,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PieChart as EnginePieChart } from "recharts";
import { type BaseAnimation, MotionContext } from "./animation.js";
import { LineChartFrame } from "./line-chart.js";
import { PolarLoadingDesign } from "./loading-polar-designs.js";
import { defaultHover, useReducedMotion } from "./motion-preference.js";

import { PieCompositionPin } from "./pie-composition-pin.js";
import { PieTooltipPin, pinnedPieIndex } from "./pie-tooltip-pin.js";

export type PieAnimation = BaseAnimation;
export type PieChartProps = ComponentProps<typeof EnginePieChart> & {
  /** Initial tooltip category; one direct categoryKey PieSeries with explicit data only. */
  defaultPinnedCategory?: string | undefined;
  animate?: boolean | PieAnimation | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
  /** Entrance sweep only; native start/end angles and data order are unchanged. */
  animationDirection?: "clockwise" | "anticlockwise" | undefined;
};
export const PieMotion = createContext<{
  reveal: boolean;
  options: PieAnimation;
  progress: number;
  direction: "clockwise" | "anticlockwise";
}>({
  reveal: false,
  options: {},
  progress: 1,
  direction: "clockwise",
});

/** Native polar composition, shared interaction, and optional Motion-owned sector entrance. */
export function PieChart({
  animate = false,
  loading,
  loadingLabel,
  animationDirection = "clockwise",
  children,
  defaultPinnedCategory,
  ...props
}: PieChartProps) {
  const registeredPin = use(PieCompositionPin);
  const [initialCategory] = useState(defaultPinnedCategory);
  const [pinCleared, setPinCleared] = useState(false);
  const clearPin = useCallback(() => setPinCleared(true), []);
  const pinIndex =
    initialCategory === undefined || pinCleared
      ? undefined
      : registeredPin
        ? registeredPin.index
        : pinnedPieIndex(children, initialCategory);
  const pinReady = registeredPin?.ready ?? true;
  useLayoutEffect(() => {
    if (initialCategory !== undefined && pinIndex === undefined && pinReady) clearPin();
  }, [initialCategory, pinIndex, clearPin, pinReady]);
  const chart = (
    <PieChartPlot
      {...props}
      animate={animate}
      loading={loading}
      loadingLabel={loadingLabel}
      animationDirection={animationDirection}
    >
      {children}
    </PieChartPlot>
  );
  return (
    <PieTooltipPin value={pinIndex}>
      {initialCategory === undefined ? (
        chart
      ) : (
        <div
          style={{ display: "contents" }}
          onPointerMoveCapture={clearPin}
          onPointerDownCapture={clearPin}
          onFocusCapture={clearPin}
          onKeyDownCapture={clearPin}
        >
          {chart}
        </div>
      )}
    </PieTooltipPin>
  );
}

// Pin dismissal changes Tooltip context only. Keep the native plot's providers and
// geometry inputs intact while a pressed sector is awaiting its native click.
const PieChartPlot = memo(function PieChartPlot({
  animate = false,
  loading,
  loadingLabel,
  animationDirection = "clockwise",
  children,
  ...props
}: Omit<PieChartProps, "defaultPinnedCategory">) {
  const reduced = useReducedMotion();
  const [interacted, setInteracted] = useState(false);
  const finish = useCallback(() => {
    if (!loading) setInteracted(true);
  }, [loading]);
  const enabled = animate !== false && !reduced && !loading;
  const interrupt = useCallback(() => {
    if (enabled) finish();
  }, [enabled, finish]);
  const options = typeof animate === "object" ? animate : {};
  const previousEnabled = useRef(enabled);
  useLayoutEffect(() => {
    if (previousEnabled.current && !enabled) finish();
    previousEnabled.current = enabled;
  }, [enabled, finish]);
  const reveal = enabled && !interacted;
  const [progress, setProgress] = useState(1);
  const duration = options.revealDurationMs ?? 1000;
  const easing = options.revealEasing ?? "easeOut";
  const started = useRef(false);
  useLayoutEffect(() => {
    if (loading) {
      setInteracted(false);
      started.current = false;
    }
  }, [loading]);
  const previous = useRef([duration, easing, animationDirection]);
  useLayoutEffect(() => {
    const inputs = [duration, easing, animationDirection];
    if (started.current && inputs.some((value, index) => value !== previous.current[index]))
      finish();
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
      onComplete: finish,
    });
    return () => controls.stop();
  }, [reveal, duration, easing, finish]);
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <PieMotion value={{ reveal, options, progress, direction: animationDirection }}>
        <LineChartFrame
          chartProps={props}
          engine={EnginePieChart}
          loading={loading}
          loadingLabel={loadingLabel}
          loadingSkeleton="pie"
          loadingDesign={(seed) => <PolarLoadingDesign family={"pie"} seed={seed} />}
          loadingAnimation={{ ...options, direction: animationDirection }}
          motionEnabled={enabled}
          interrupt={interrupt}
        >
          {children}
        </LineChartFrame>
      </PieMotion>
    </MotionContext>
  );
});
