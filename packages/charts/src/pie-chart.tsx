"use client";

import {
  type ComponentProps,
  createContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { PieChart as EnginePieChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { LineChartFrame } from "./line-chart.js";

export type PieAnimation = LineAnimation;
export type PieChartProps = ComponentProps<typeof EnginePieChart> & {
  animate?: boolean | PieAnimation | undefined;
};
export const PieMotion = createContext<{
  reveal: boolean;
  options: PieAnimation;
  finish: () => void;
}>({
  reveal: false,
  options: {},
  finish: () => {},
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

/** Native polar composition, shared interaction, and optional Motion-owned sector entrance. */
export function PieChart({ animate = false, children, ...props }: PieChartProps) {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const finish = useCallback(() => setInteracted(true), []);
  const enabled = animate !== false && !reduced;
  const interrupt = useCallback(() => {
    if (enabled) finish();
  }, [enabled, finish]);
  const options = typeof animate === "object" ? animate : {};
  const previousEnabled = useRef(enabled);
  useLayoutEffect(() => {
    if (previousEnabled.current && !enabled) finish();
    previousEnabled.current = enabled;
  }, [enabled, finish]);
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <PieMotion value={{ reveal: enabled && !interacted, options, finish }}>
        <LineChartFrame
          chartProps={props}
          engine={EnginePieChart}
          motionEnabled={enabled}
          interrupt={interrupt}
        >
          {children}
        </LineChartFrame>
      </PieMotion>
    </MotionContext>
  );
}
