"use client";

import { animate as animateProgress, type Transition } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { CandlestickViewport, CandlestickViewportReason } from "./viewport.js";

type Options = {
  enabled: boolean;
  reason: CandlestickViewportReason;
  identity: unknown;
  transition?: Transition;
};
const defaultTransition: Transition = { duration: 0.2, ease: "easeOut" };

/** Animate displayed logical coordinates only; consumers receive one desired window per action. */
export function useCandlestickViewportMotion(
  target: CandlestickViewport,
  { enabled, reason, identity, transition = defaultTransition }: Options,
) {
  const [viewport, setViewport] = useState(target);
  const displayed = useRef(target);
  const desired = useRef(target);
  const previousIdentity = useRef(identity);
  const controls = useRef<ReturnType<typeof animateProgress> | undefined>(undefined);
  desired.current = target;
  const finish = useCallback(() => {
    controls.current?.stop();
    controls.current = undefined;
    displayed.current = desired.current;
    setViewport(desired.current);
  }, []);
  useLayoutEffect(() => {
    controls.current?.stop();
    controls.current = undefined;
    const sameHistory = previousIdentity.current === identity;
    previousIdentity.current = identity;
    const from = displayed.current;
    if (
      !enabled ||
      !sameHistory ||
      reason === "pan" ||
      reason === "data" ||
      (from.from === target.from && from.to === target.to)
    ) {
      finish();
      return;
    }
    controls.current = animateProgress(0, 1, {
      ...transition,
      onUpdate: (progress) => {
        const next = {
          from: from.from + (target.from - from.from) * progress,
          to: from.to + (target.to - from.to) * progress,
        };
        displayed.current = next;
        setViewport(next);
      },
      onComplete: finish,
    });
    return () => controls.current?.stop();
  }, [target.from, target.to, enabled, reason, identity, transition, finish]);
  const direct =
    !enabled || previousIdentity.current !== identity || reason === "pan" || reason === "data";
  return { viewport: direct ? target : viewport, finish };
}
