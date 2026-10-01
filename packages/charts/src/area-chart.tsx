"use client";

import { motion, type Transition } from "motion/react";
import { type ComponentProps, useCallback, useId, useState, useSyncExternalStore } from "react";
import { AreaChart as EngineAreaChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { LineChartFrame } from "./line-chart.js";

export type AreaAnimation = LineAnimation;
export type AreaChartProps = ComponentProps<typeof EngineAreaChart> & {
  animate?: boolean | AreaAnimation | undefined;
};
const defaultHover: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };

const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;

/** Native Recharts geometry and composition with a shared Motion entrance and tooltip. */
export function AreaChart({ animate = false, children, ...props }: AreaChartProps) {
  const id = useId();
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const options = typeof animate === "object" ? animate : {};
  const enabled = animate !== false && reduced === false;
  const interrupt = useCallback(() => setInteracted(true), []);
  const reveal = enabled && !interacted;
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <LineChartFrame
        {...props}
        engine={EngineAreaChart}
        className={["kind-ui-area-chart", props.className].filter(Boolean).join(" ")}
        motionEnabled={enabled}
        interrupt={interrupt}
        {...(reveal ? { clip: `url(#${id}-area-reveal)` } : {})}
      >
        {reveal && (
          <defs>
            <clipPath id={`${id}-area-reveal`} clipPathUnits="userSpaceOnUse">
              <motion.rect
                data-area-reveal=""
                x={0}
                y={0}
                height="100%"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                onAnimationComplete={interrupt}
                transition={{
                  duration: Math.max(0, options.revealDurationMs ?? 1000) / 1000,
                  ease: options.revealEasing ?? [0.25, 0.1, 0.25, 1],
                }}
              />
            </clipPath>
          </defs>
        )}
        {children}
      </LineChartFrame>
    </MotionContext>
  );
}
