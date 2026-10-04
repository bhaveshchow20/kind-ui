import * as Chart from "@kind-ui/charts";
import {
  getRelativeCoordinate,
  type TooltipRenderProps as TooltipContentProps,
  useChartHeight,
  useChartWidth,
} from "@kind-ui/charts";
import {
  type MotionValue,
  motion,
  type Transition,
  useMotionValue,
  useMotionValueEvent,
} from "motion/react";
import { type MouseEvent, useId, useLayoutEffect, useRef, useState } from "react";

import { useReducedMotionPreference } from "./use-reduced-motion.js";

/** Recipe-local animation controls; omit motion to render and update immediately. */
export type RecipeMotion = {
  revealDurationMs?: number;
  revealEasing?: Transition["ease"];
  hoverTransition?: Transition;
};
const hoverTransition: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };
type PointerPosition = { x: number; y: number } | null;
export function useRecipeMotion(options: RecipeMotion | undefined) {
  const id = useId();
  const reduced = useReducedMotionPreference();
  const [interacted, setInteracted] = useState(false);
  const pointer = useMotionValue<PointerPosition>(null);
  const animate = options !== undefined && !reduced;
  const reveal = animate && !interacted;
  return {
    id,
    animate,
    reveal,
    pointer,
    trackPointer: (_state: unknown, event: MouseEvent<SVGGraphicsElement>) => {
      const { relativeX, relativeY } = getRelativeCoordinate(event);
      pointer.set({ x: relativeX, y: relativeY });
    },
    clearPointer: () => pointer.set(null),
    finishReveal: () => setInteracted(true),
    transition: animate ? (options.hoverTransition ?? hoverTransition) : { duration: 0 },
  };
}
/** A fixed engine anchor lets Motion alone position the content, without a competing CSS tween. */
export function MovingTooltip({
  tooltip,
  transition,
  maxWidth = 180,
  pointer,
}: {
  tooltip: TooltipContentProps;
  transition: Transition;
  maxWidth?: number;
  pointer: MotionValue<PointerPosition>;
}) {
  const [point, setPoint] = useState<PointerPosition>(pointer.get());
  useMotionValueEvent(pointer, "change", (value) => setPoint(value));
  const width = useChartWidth() ?? 0;
  const height = useChartHeight() ?? 0;
  const ref = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  useLayoutEffect(() => {
    if (ref.current) setContentHeight(ref.current.offsetHeight);
  });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setContentHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const contentWidth = Math.min(maxWidth, Math.max(0, width));
  const anchor = point ?? tooltip.coordinate ?? { x: 0, y: 0 };
  const x = Math.max(0, Math.min(anchor.x + 12, width - contentWidth));
  const y = Math.max(0, Math.min(anchor.y + 12, height - contentHeight));
  return (
    <motion.div
      data-recipe-tooltip-motion=""
      ref={ref}
      initial={false}
      animate={{ x, y }}
      transformTemplate={({ x = 0, y = 0 }) =>
        `translate(clamp(0px, ${typeof x === "number" ? `${x}px` : x}, ${Math.max(0, width - contentWidth)}px), clamp(0px, ${typeof y === "number" ? `${y}px` : y}, ${Math.max(0, height - contentHeight)}px))`
      }
      transition={transition}
      style={{ width: contentWidth, pointerEvents: "none" }}
    >
      <Chart.TooltipContent tooltip={tooltip} />
    </motion.div>
  );
}
