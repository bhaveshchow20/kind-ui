"use client";

import {
  type ComponentProps,
  createContext,
  useCallback,
  useState,
  useSyncExternalStore,
} from "react";
import { ScatterChart as EngineScatterChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { LineChartFrame } from "./line-chart.js";

export type ScatterAnimation = LineAnimation;
export type ScatterChartProps = ComponentProps<typeof EngineScatterChart> & {
  animate?: boolean | ScatterAnimation | undefined;
};
export const ScatterMotion = createContext({
  reveal: false,
  options: {} as ScatterAnimation,
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

/** Native numeric geometry and item selection, with optional entrance fade and shared tooltip Motion. */
export function ScatterChart({ animate = false, children, ...props }: ScatterChartProps) {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const enabled = animate !== false && !reduced;
  const interact = useCallback(() => setInteracted(true), []);
  const finish = useCallback(() => {
    if (enabled) setInteracted(true);
  }, [enabled]);
  const options = typeof animate === "object" ? animate : {};
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <ScatterMotion value={{ reveal: enabled && !interacted, options, finish }}>
        <div
          style={{ display: "contents" }}
          onFocusCapture={interact}
          onPointerDownCapture={interact}
          onPointerMoveCapture={interact}
          onKeyDownCapture={interact}
        >
          <LineChartFrame
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
