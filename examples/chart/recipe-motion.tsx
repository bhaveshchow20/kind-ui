import * as Chart from "@kind-ui/charts";
import { motion, type Transition } from "motion/react";
import { useId, useState } from "react";
import { type TooltipContentProps, useChartWidth } from "recharts";
import { useReducedMotionPreference } from "./use-reduced-motion.js";

/** Recipe-local animation controls; omit motion to render and update immediately. */
export type RecipeMotion = {
  revealDurationMs?: number;
  revealEasing?: Transition["ease"];
  hoverTransition?: Transition;
};
const hoverTransition: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };
export function useRecipeMotion(options: RecipeMotion | undefined) {
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
  };
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
