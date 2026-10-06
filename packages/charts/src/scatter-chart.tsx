"use client";

import { animate as animateValue, type MotionValue, useMotionValue } from "motion/react";
import {
  type ComponentProps,
  createContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ScatterChart as EngineScatterChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { LineChartFrame } from "./line-chart.js";
import { CartesianLoadingDesign } from "./loading-cartesian-designs.js";

export type ScatterAnimation = LineAnimation;
export type ScatterChartProps = ComponentProps<typeof EngineScatterChart> & {
  animate?: boolean | ScatterAnimation | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
};
export const ScatterMotion = createContext<{
  reveal: boolean;
  options: ScatterAnimation;
  finish: () => void;
  progress: MotionValue<number> | null;
}>({
  reveal: false,
  options: {} as ScatterAnimation,
  finish: () => {},
  progress: null,
});
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;
const defaultHover = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 } as const;

/** Native numeric geometry and item selection, with optional entrance fade and shared tooltip Motion. */
export function ScatterChart({
  animate = false,
  loading,
  loadingLabel,
  children,
  ...props
}: ScatterChartProps) {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const enabled = animate !== false && !reduced && !loading;
  const interact = useCallback(() => {
    if (!loading) setInteracted(true);
  }, [loading]);
  useLayoutEffect(() => {
    if (loading) {
      setInteracted(false);
      started.current = false;
    }
  }, [loading]);
  const finish = useCallback(() => {
    if (enabled) setInteracted(true);
  }, [enabled]);
  const options = typeof animate === "object" ? animate : {};
  const reveal = enabled && !interacted;
  const progress = useMotionValue(1);
  const duration = options.revealDurationMs ?? 700;
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
      interact();
    previous.current = inputs;
    previousEnabled.current = enabled;
  });
  useLayoutEffect(() => {
    if (!reveal) {
      progress.set(1);
      return;
    }
    started.current = true;
    progress.set(0);
    const controls = animateValue(progress, 1, {
      duration: Math.max(0, duration) / 1000,
      ease: easing,
      onComplete: interact,
    });
    return () => controls.stop();
  }, [reveal, duration, easing, progress, interact]);
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <ScatterMotion value={{ reveal, options, finish, progress }}>
        <div
          style={{ display: "contents" }}
          onFocusCapture={interact}
          onPointerDownCapture={interact}
          onPointerMoveCapture={interact}
          onKeyDownCapture={interact}
        >
          <LineChartFrame
            loading={loading}
            loadingLabel={loadingLabel}
            loadingSkeleton="scatter"
            loadingDesign={(seed) => <CartesianLoadingDesign family={"scatter"} seed={seed} />}
            loadingAnimation={options}
            chartProps={props}
            engine={EngineScatterChart}
            motionEnabled={enabled}
            interrupt={finish}
          >
            {children}
          </LineChartFrame>
        </div>
      </ScatterMotion>
    </MotionContext>
  );
}
