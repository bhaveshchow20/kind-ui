import * as Chart from "@kind-ui/charts";
import { motion, type Transition } from "motion/react";
import { type CSSProperties, useId, useState } from "react";
import { type DotProps, type TooltipContentProps, useChartWidth } from "recharts";
import { useReducedMotionPreference } from "./use-reduced-motion.js";

/** Recipe-local animation controls; omit motion to render and update immediately. */
export type LineMotion = {
  revealDurationMs?: number;
  revealEasing?: Transition["ease"];
  hoverTransition?: Transition;
};
const hoverTransition: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };
export function useLineMotion(options: LineMotion | undefined) {
  const id = useId();
  const reduced = useReducedMotionPreference();
  const [interacted, setInteracted] = useState(false);
  const animate = options !== undefined && !reduced;
  const reveal = animate && !interacted;
  return {
    id,
    animate,
    reveal,
    finishReveal: () => setInteracted(true),
    transition: animate ? (options.hoverTransition ?? hoverTransition) : { duration: 0 },
    style: { "--line-reveal-clip": reveal ? `url(#${id}-reveal)` : "none" } as CSSProperties,
  };
}
export function LineReveal({ id, options }: { id: string; options: LineMotion }) {
  return (
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
  );
}

/** Recharts supplies coordinates; Motion retargets the same marker during pointer travel. */
export function ActiveMarker({
  cx,
  cy,
  fill,
  transition,
}: Pick<DotProps, "cx" | "cy" | "fill"> & { transition: Transition }) {
  if (cx == null || cy == null) return null;
  return (
    <motion.circle
      data-recipe-active-marker=""
      initial={false}
      animate={{ cx, cy }}
      transition={transition}
      r={5}
      fill={fill}
      stroke="var(--card)"
      strokeWidth={2}
      strokeDasharray="none"
      pointerEvents="none"
    />
  );
}

/** A fixed engine anchor lets Motion alone position the content, without a competing CSS tween. */
export function MovingTooltip({
  tooltip,
  transition,
}: {
  tooltip: TooltipContentProps;
  transition: Transition;
}) {
  const width = useChartWidth() ?? 0;
  const contentWidth = Math.min(208, Math.max(0, width));
  const x = Math.max(
    0,
    Math.min((tooltip.coordinate?.x ?? 0) - contentWidth / 2, width - contentWidth),
  );
  return (
    <motion.div
      data-recipe-tooltip-motion=""
      initial={false}
      animate={{ x, y: 4 }}
      transition={transition}
      style={{ width: contentWidth, pointerEvents: "none" }}
    >
      <Chart.TooltipContent tooltip={tooltip} />
    </motion.div>
  );
}
