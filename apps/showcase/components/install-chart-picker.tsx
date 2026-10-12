"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export function InstallChartPicker({
  options,
  value,
  onValueChange,
  paused,
}: {
  options: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  paused: boolean;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const index = options.indexOf(value);
  if (index < 0) throw new Error(`Unknown registry chart: ${value}`);
  const next = options[(index + 1) % options.length];
  if (next === undefined) throw new Error("Registry chart choices must not be empty");

  useEffect(() => {
    if (reduced || paused || hovered || focused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) onValueChange(next);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [reduced, paused, hovered, focused, next, onValueChange]);

  return (
    <button
      className="install-chart-picker"
      type="button"
      aria-label={`Switch chart type: ${value}`}
      onClick={() => onValueChange(next)}
      onPointerDown={() => setFocused(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(event) => setFocused(event.currentTarget.matches(":focus-visible"))}
      onBlur={() => setFocused(false)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="install-chart-name"
          initial={reduced ? false : { y: "55%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: "-55%", opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
