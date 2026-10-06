"use client";

import { motion, type Transition } from "motion/react";

export type RevealDirection = "left-to-right" | "right-to-left" | "center-out" | "edges-in";
type Options = {
  revealDirection?: RevealDirection;
  revealDurationMs?: number;
  revealEasing?: Transition["ease"];
};

/** Entrance paint only: percentage rectangles never transform native series geometry. */
export function RevealClip({
  id,
  family,
  combo = false,
  options,
  finish,
}: {
  id: string;
  family?: "line" | "area";
  combo?: boolean;
  options: Options;
  finish: () => void;
}) {
  const direction = options.revealDirection ?? "left-to-right";
  const split = direction === "edges-in";
  const initialX =
    direction === "right-to-left" ? "100%" : direction === "center-out" ? "50%" : "0%";
  const transition = {
    duration: Math.max(0, options.revealDurationMs ?? 1000) / 1000,
    ease: options.revealEasing ?? [0.25, 0.1, 0.25, 1],
  } satisfies Transition;
  return (
    <defs>
      <clipPath id={id} clipPathUnits="userSpaceOnUse" data-reveal-direction={direction}>
        <motion.rect
          {...(combo
            ? { "data-combo-reveal": family }
            : family === "area"
              ? { "data-area-reveal": "" }
              : {})}
          y={0}
          height="100%"
          initial={{ attrX: initialX, width: "0%" }}
          animate={{ attrX: "0%", width: split ? "50%" : "100%" }}
          onAnimationComplete={finish}
          transition={transition}
        />
        {split && (
          <motion.rect
            y={0}
            height="100%"
            initial={{ attrX: "100%", width: "0%" }}
            animate={{ attrX: "50%", width: "50%" }}
            transition={transition}
          />
        )}
      </clipPath>
    </defs>
  );
}
