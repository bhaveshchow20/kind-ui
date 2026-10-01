import { motion, type Transition } from "motion/react";
import type { CSSProperties } from "react";
import type { DotProps } from "recharts";
import { type RecipeMotion, useRecipeMotion } from "./recipe-motion.js";

export { MovingTooltip } from "./recipe-motion.js";
export type LineMotion = RecipeMotion;
export function useLineMotion(options: LineMotion | undefined) {
  const animation = useRecipeMotion(options);
  return {
    ...animation,
    style: {
      "--line-reveal-clip": animation.reveal ? `url(#${animation.id}-reveal)` : "none",
    } as CSSProperties,
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
