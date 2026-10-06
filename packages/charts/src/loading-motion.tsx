"use client";

import {
  animate,
  type MotionValue,
  motion,
  type Transition,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  createContext,
  type ReactNode,
  use,
  useId,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";

export type LoadingAnimation = {
  revealDurationMs?: number;
  revealEasing?: Transition["ease"];
  layout?: "horizontal" | "vertical";
  direction?: "clockwise" | "anticlockwise";
  lineReveal?: false | Pick<LoadingAnimation, "revealDurationMs" | "revealEasing">;
  areaReveal?: false | Pick<LoadingAnimation, "revealDurationMs" | "revealEasing">;
  barReveal?: false | Pick<LoadingAnimation, "revealDurationMs" | "revealEasing">;
};
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
export function useLoadingProgress(
  pulse: number,
  duration: number,
  easing: Transition["ease"],
  startDelay = 0,
) {
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );
  const progress = useMotionValue(0);
  const easingCache = useRef(easing);
  if (Array.isArray(easing) && Array.isArray(easingCache.current)) {
    if (JSON.stringify(easing) !== JSON.stringify(easingCache.current))
      easingCache.current = easing;
  } else if (easing !== easingCache.current) easingCache.current = easing;
  const stableEasing = easingCache.current;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new invisible pulse deliberately rearms the entrance.
  useLayoutEffect(() => {
    if (reduced || duration === 0) {
      progress.set(1);
      return;
    }
    progress.set(0);
    let trail: ReturnType<typeof animate> | undefined;
    const controls = animate(progress, 1, {
      duration: duration / 1000,
      delay: startDelay / 1000,
      ease: stableEasing ?? "easeOut",
      onComplete: () => {
        trail = animate(progress, 1.65, { duration: (duration * 0.65) / 1000, ease: "linear" });
      },
    });
    return () => {
      controls.stop();
      trail?.stop();
    };
  }, [progress, pulse, duration, stableEasing, reduced, startDelay]);
  return { progress, reduced: reduced || duration === 0 };
}
export const LoadingProgress = createContext<{
  progress: MotionValue<number>;
  reduced: boolean;
} | null>(null);
/** The same screen/diagonal ordering as native scatter and heatmap entrances, with a soft trail. */
export function LoadingPulseMark({
  delay,
  span,
  children,
}: {
  delay: number;
  span: number;
  children: ReactNode;
}) {
  const context = use(LoadingProgress);
  const fallback = useMotionValue(1);
  const opacity = useTransform(context?.progress ?? fallback, (value) =>
    context?.reduced
      ? 1
      : Math.max(0, Math.min(1, (value - delay) / span, (delay + span + 0.4 - value) / 0.4)),
  );
  return (
    <motion.g data-kind-ui="loading-mark" style={{ opacity }}>
      {children}
    </motion.g>
  );
}

export function LoadingAngularBand({
  progress,
  index,
  direction,
}: {
  progress: MotionValue<number>;
  index: number;
  direction: "clockwise" | "anticlockwise";
}) {
  const sign = direction === "anticlockwise" ? -1 : 1;
  const offset = useTransform(progress, (value) => -sign * value * 100);
  const opacity = useTransform(progress, (value) => {
    const angle = value * 360 - index * 18;
    return (
      Math.max(0, Math.min(1, angle / 9, (360 - angle) / 9)) * Math.sin(((index + 1) / 9) * Math.PI)
    );
  });
  return (
    <motion.circle
      data-kind-ui="loading-angular"
      cx="320"
      cy="120"
      r="120"
      fill="none"
      stroke="white"
      strokeWidth="240"
      pathLength="100"
      strokeDasharray="5 95"
      strokeDashoffset={offset}
      style={{ opacity }}
      transform={`rotate(${-90 - sign * index * 18} 320 120)`}
    />
  );
}

/** Native Sankey's source ordering and path-length reveal, with a following erase. */
export function LoadingPulseFlow({
  d,
  width,
  delay,
  children,
}: {
  d: string;
  width: number;
  delay: number;
  children: ReactNode;
}) {
  const context = use(LoadingProgress);
  const fallback = useMotionValue(1);
  const id = `loading-flow-${useId().replace(/:/g, "")}`;
  const dash = useTransform(context?.progress ?? fallback, (value) => {
    if (context?.reduced) return "1 1";
    const lead = Math.max(0, Math.min(1, (value - delay) / 0.45));
    const trail = Math.max(0, Math.min(1, (value - delay - 0.45) / 0.4));
    return `${Math.max(0, lead - trail)} 1`;
  });
  const offset = useTransform(context?.progress ?? fallback, (value) =>
    context?.reduced ? 0 : -Math.max(0, Math.min(1, (value - delay - 0.45) / 0.4)),
  );
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="240">
          <filter
            id={`${id}-soft`}
            filterUnits="userSpaceOnUse"
            x="-32"
            y="-32"
            width="704"
            height="304"
          >
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <motion.path
            filter={`url(#${id}-soft)`}
            data-kind-ui="loading-flow-window"
            d={d}
            fill="none"
            stroke="white"
            strokeWidth={width + 2}
            pathLength="1"
            strokeDasharray={dash}
            strokeDashoffset={offset}
          />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>{children}</g>
    </g>
  );
}
