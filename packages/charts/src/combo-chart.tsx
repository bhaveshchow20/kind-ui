"use client";

import { motion, type Transition } from "motion/react";
import {
  type ComponentProps,
  type CSSProperties,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ComposedChart as EngineComposedChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { BarLifecycle, BarMotion } from "./bar-chart.js";
import { LineChartFrame, useLineInteraction } from "./line-chart.js";

type Reveal = Pick<LineAnimation, "revealDurationMs" | "revealEasing">;
/** Shared hover Motion, with independently configured family entrances. */
export type ComboAnimation = LineAnimation & {
  lineReveal?: false | Reveal;
  areaReveal?: false | Reveal;
  barReveal?: false | Reveal;
};
export type ComboChartProps = ComponentProps<typeof EngineComposedChart> & {
  animate?: boolean | ComboAnimation | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
};
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;
const defaultHover: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };

function Entrance({
  id,
  family,
  options,
  finish,
}: {
  id: string;
  family: string;
  options: Reveal;
  finish: () => void;
}) {
  return (
    <defs>
      <clipPath id={id} clipPathUnits="userSpaceOnUse">
        <motion.rect
          data-combo-reveal={family}
          x={0}
          y={0}
          height="100%"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          onAnimationComplete={finish}
          transition={{
            duration: Math.max(0, options.revealDurationMs ?? 1000) / 1000,
            ease: options.revealEasing ?? [0.25, 0.1, 0.25, 1],
          }}
        />
      </clipPath>
    </defs>
  );
}

// A changed native child can change domains, axes, stacks or custom geometry.
// Conservatively end entrances rather than retain a clip in the old coordinate space.
function CompositionLifecycle({ children }: { children: ComboChartProps["children"] }) {
  const { invalidate } = useLineInteraction();
  const previous = useRef(children);
  useLayoutEffect(() => {
    if (children !== previous.current) invalidate();
    previous.current = children;
  }, [children, invalidate]);
  return null;
}

/** Native ComposedChart geometry with the maintained Line, Area and Bar series. */
export function ComboChart({
  animate = false,
  loading,
  loadingLabel,
  children,
  ...props
}: ComboChartProps) {
  const id = useId();
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [finished, setFinished] = useState({ line: false, area: false, bar: false });
  const interrupt = useCallback(() => {
    if (!loading) setFinished({ line: true, area: true, bar: true });
  }, [loading]);
  useLayoutEffect(() => {
    if (loading) setFinished({ line: false, area: false, bar: false });
  }, [loading]);
  const finishLine = useCallback(() => setFinished((value) => ({ ...value, line: true })), []);
  const finishArea = useCallback(() => setFinished((value) => ({ ...value, area: true })), []);
  const finishBar = useCallback(() => setFinished((value) => ({ ...value, bar: true })), []);
  const enabled = animate !== false && !reduced && !loading;
  const options = typeof animate === "object" ? animate : {};
  const line = options.lineReveal === false ? false : { ...options, ...options.lineReveal };
  const area = options.areaReveal === false ? false : { ...options, ...options.areaReveal };
  const bar = options.barReveal === false ? false : { ...options, ...options.barReveal };
  const revealLine = enabled && !finished.line && line !== false;
  const revealArea = enabled && !finished.area && area !== false;
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <BarMotion
        value={{
          reveal: enabled && !finished.bar && bar !== false,
          options: bar || {},
          finish: finishBar,
        }}
      >
        <LineChartFrame
          loading={loading}
          loadingLabel={loadingLabel}
          loadingSkeleton="combo"
          loadingAnimation={{ ...options, ...(props.layout ? { layout: props.layout } : {}) }}
          engine={EngineComposedChart}
          chartProps={{
            ...props,
            className: ["kind-ui-combo-chart", props.className].filter(Boolean).join(" "),
            style: {
              ...props.style,
              "--kind-ui-combo-area-clip": revealArea ? `url(#${id}-area)` : "none",
            } as CSSProperties,
          }}
          motionEnabled={enabled}
          interrupt={interrupt}
          clip={revealLine ? `url(#${id}-line)` : "none"}
        >
          <BarLifecycle {...props} />
          <CompositionLifecycle>{children}</CompositionLifecycle>
          {revealLine && (
            <Entrance id={`${id}-line`} family="line" options={line || {}} finish={finishLine} />
          )}
          {revealArea && (
            <Entrance id={`${id}-area`} family="area" options={area || {}} finish={finishArea} />
          )}
          {children}
        </LineChartFrame>
      </BarMotion>
    </MotionContext>
  );
}
