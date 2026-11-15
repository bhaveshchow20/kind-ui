"use client";

import { animate } from "motion/react";
import { createContext, type ReactNode, use, useLayoutEffect, useRef } from "react";
import { MotionContext } from "../animation.js";
import { useReducedMotion } from "../motion-preference.js";

type LatestGeometry = {
  identity: string;
  frame: string;
  observation: string;
  values: number[];
  target: number[];
};
const LatestMotionContext = createContext<Map<string, LatestGeometry> | null>(null);

/** Native Bar shapes remount on data changes; retain only the latest painted geometry. */
export function CandlestickLatestMotion({ children }: { children: ReactNode }) {
  const cache = useRef(new Map<string, LatestGeometry>());
  return <LatestMotionContext value={cache.current}>{children}</LatestMotionContext>;
}

/** Interpolate screen geometry, never observations or historical OHLC values. */
export function useLatestCandlestickGeometry(
  key: string,
  identity: string,
  frame: string,
  observation: string,
  target: readonly number[],
  latest: boolean,
  append: boolean,
  paint: (values: readonly number[]) => void,
) {
  const cache = use(LatestMotionContext);
  const { enabled } = use(MotionContext);
  const reduced = useReducedMotion();
  const render = useRef(paint);
  render.current = paint;
  const signature = target.join(",");
  useLayoutEffect(() => {
    if (!latest || !cache) return;
    const previous = cache.get(key);
    const values = signature.split(",").map(Number);
    const entry = { identity, frame, observation, values: [...values], target: [...values] };
    cache.set(key, entry);
    if (
      !enabled ||
      reduced ||
      !previous ||
      previous.frame !== frame ||
      (previous.observation === observation &&
        !previous.target.every((value, index) => value === values[index])) ||
      (!append && previous.identity !== identity)
    ) {
      render.current(values);
      return;
    }
    const start = previous.values;
    if (start.length !== values.length || start.every((value, index) => value === values[index]))
      return;
    render.current(start);
    entry.values = [...start];
    const controls = animate(0, 1, {
      duration: 0.12,
      ease: "easeOut",
      onUpdate: (progress) => {
        entry.values = values.map(
          (value, index) => (start[index] ?? value) + (value - (start[index] ?? value)) * progress,
        );
        render.current(entry.values);
      },
      onComplete: () => render.current(values),
    });
    return () => controls.stop();
  }, [cache, key, identity, frame, observation, signature, latest, append, enabled, reduced]);
}
