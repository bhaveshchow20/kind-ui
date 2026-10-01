"use client";

import { motion, type Transition } from "motion/react";
import { createContext, use, useId, useState, useSyncExternalStore } from "react";
import type { DotProps } from "recharts";
import {
  LineChartFrame,
  type LineChartProps as StaticLineChartProps,
  useLineInteraction,
} from "./line-chart.js";
import {
  LineSeries as StaticLineSeries,
  type LineSeriesProps as StaticLineSeriesProps,
} from "./line-series.js";
import { TooltipBase, type TooltipFrameProps, type TooltipProps } from "./tooltip.js";

export type LineMotion = {
  revealDurationMs?: number;
  revealEasing?: Transition["ease"];
  hoverTransition?: Transition;
};
export type LineSeriesProps = Omit<StaticLineSeriesProps, "isAnimationActive">;
export type LineChartProps = StaticLineChartProps & { motion?: LineMotion | false | undefined };
const defaultHover: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };
const MotionContext = createContext({ enabled: false, transition: { duration: 0 } as Transition });
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;

/** Optional Motion owns the shared entrance clip and default active marks. */
export function LineChart({ motion: options, children, ...props }: LineChartProps) {
  const id = useId();
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const enabled = options !== undefined && options !== false && !reduced;
  const reveal = enabled && !interacted;
  const transition = enabled ? (options.hoverTransition ?? defaultHover) : { duration: 0 };
  return (
    <MotionContext value={{ enabled, transition }}>
      <LineChartFrame
        {...props}
        motionEnabled={enabled}
        interrupt={() => setInteracted(true)}
        {...(reveal ? { clip: `url(#${id}-reveal)` } : {})}
      >
        {reveal && (
          <defs>
            <clipPath id={`${id}-reveal`} clipPathUnits="userSpaceOnUse">
              <motion.rect
                x={0}
                y={0}
                height="100%"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
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
function ActiveMarker({ cx, cy, fill, stroke }: DotProps) {
  const { enabled, transition } = use(MotionContext);
  const { motionReady } = useLineInteraction();
  const animate = enabled && motionReady;
  if (cx == null || cy == null) return null;
  return (
    <motion.circle
      key={animate ? "animated" : "static"}
      data-kind-ui="active-marker"
      initial={false}
      animate={{ cx, cy }}
      transition={animate ? transition : { duration: 0 }}
      r={5}
      fill={fill ?? stroke}
      stroke="var(--card, white)"
      strokeWidth={2}
      strokeDasharray="none"
      pointerEvents="none"
    />
  );
}
export function LineSeries(props: LineSeriesProps) {
  return <StaticLineSeries activeDot={<ActiveMarker />} {...props} isAnimationActive={false} />;
}
function MovingFrame({ x, y, maxX, maxY, ref, style, frameProps, children }: TooltipFrameProps) {
  const { enabled, transition } = use(MotionContext);
  const { motionReady } = useLineInteraction();
  const animate = enabled && motionReady;
  return (
    <motion.div
      key={animate ? "animated" : "static"}
      data-kind-ui="tooltip-motion"
      initial={false}
      animate={{ x, y }}
      transition={animate ? transition : { duration: 0 }}
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
export type { TooltipProps };
