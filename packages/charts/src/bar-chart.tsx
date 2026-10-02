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
import { BarChart as EngineBarChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { LineChartFrame, useLineInteraction } from "./line-chart.js";

export type BarAnimation = LineAnimation;
export type BarChartProps = ComponentProps<typeof EngineBarChart> & {
  animate?: boolean | BarAnimation | undefined;
  /** Opt in only for complete native category comparisons; any unsafe visible peer falls back. */
  emphasis?: "none" | "category" | undefined;
};
export const BarMotion = createContext<{
  reveal: boolean;
  options: BarAnimation;
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

// Chart layout props may move bars without changing the plot or numeric zero.
export function BarLifecycle({
  layout,
  barGap,
  barCategoryGap,
  barSize,
  stackOffset,
  reverseStackOrder,
}: BarChartProps) {
  const { invalidate } = useLineInteraction();
  const inputs = [layout, barGap, barCategoryGap, barSize, stackOffset, reverseStackOrder];
  const previous = useRef(inputs);
  useLayoutEffect(() => {
    if (inputs.some((value, index) => value !== previous.current[index])) invalidate();
    previous.current = inputs;
  });
  return null;
}

/** Native Recharts composition with Kind interaction and optional Motion. */
export function BarChart({
  animate = false,
  emphasis = "none",
  children,
  ...props
}: BarChartProps) {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const finish = useCallback(() => setInteracted(true), []);
  const enabled = animate !== false && !reduced;
  const options = typeof animate === "object" ? animate : {};
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <BarMotion value={{ reveal: enabled && !interacted, options, finish }}>
        <LineChartFrame
          chartProps={props}
          categoryEmphasis={emphasis === "category"}
          engine={EngineBarChart}
          motionEnabled={enabled}
          interrupt={finish}
        >
          <BarLifecycle {...props} />
          {children}
        </LineChartFrame>
      </BarMotion>
    </MotionContext>
  );
}
