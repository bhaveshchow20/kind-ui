"use client";

import { useReducedMotion } from "@kind-ui/primitives/use-reduced-motion";
import { motion, useAnimationControls } from "motion/react";
import { useEffect } from "react";

/** Decorative activity stays local to the host-owned streaming state. */
export function ThinkingDots() {
  const reducedMotion = useReducedMotion();
  const controls = useAnimationControls();
  // Activity starts independently of an ancestor's suppressed entrance animation.
  useEffect(() => {
    if (reducedMotion) {
      controls.stop();
      controls.set({ transform: "translateY(0px)", opacity: 0.7 });
    } else {
      void controls.start((index: number) => ({
        transform: ["translateY(0px)", "translateY(-2px)", "translateY(0px)"],
        opacity: [0.5, 0.9, 0.5],
        transition: {
          duration: 1.2,
          repeat: Infinity,
          delay: index * 0.14,
          ease: [0.77, 0, 0.175, 1],
        },
      }));
    }
    return () => controls.stop();
  }, [controls, reducedMotion]);
  return (
    <span
      aria-hidden="true"
      data-slot="thinking-dots"
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center gap-0.5 text-muted-foreground"
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          custom={index}
          className="size-0.5 rounded-full bg-current"
          initial={false}
          animate={controls}
          style={{ transform: "translateY(0px)", opacity: 0.7 }}
        />
      ))}
    </span>
  );
}
