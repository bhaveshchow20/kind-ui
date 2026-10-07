"use client";

import type { Transition } from "motion/react";
import {
  type ComponentProps,
  useCallback,
  useId,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { AreaChart as EngineAreaChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { LineChartFrame } from "./line-chart.js";
import { CartesianLoadingDesign } from "./loading-cartesian-designs.js";
import { RevealClip } from "./reveal-clip.js";

export type AreaAnimation = LineAnimation;
export type AreaChartProps = ComponentProps<typeof EngineAreaChart> & {
  animate?: boolean | AreaAnimation | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
};
const defaultHover: Transition = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 };

const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;

/** Native Recharts geometry and composition with a shared Motion entrance and tooltip. */
export function AreaChart({
  animate = false,
  loading,
  loadingLabel,
  children,
  ...props
}: AreaChartProps) {
  const id = useId();
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const options = typeof animate === "object" ? animate : {};
  const enabled = animate !== false && reduced === false && !loading;
  const interrupt = useCallback(() => {
    if (!loading) setInteracted(true);
  }, [loading]);
  useLayoutEffect(() => {
    if (loading) setInteracted(false);
  }, [loading]);
  const reveal = enabled && !interacted;
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <LineChartFrame
        loading={loading}
        loadingLabel={loadingLabel}
        loadingSkeleton="area"
        loadingDesign={(seed) => <CartesianLoadingDesign family={"area"} seed={seed} />}
        loadingAnimation={options}
        chartProps={{
          ...props,
          className: ["kind-ui-area-chart", props.className].filter(Boolean).join(" "),
        }}
        engine={EngineAreaChart}
        motionEnabled={enabled}
        interrupt={interrupt}
        {...(reveal ? { clip: `url(#${id}-area-reveal)` } : {})}
      >
        {reveal && (
          <RevealClip id={`${id}-area-reveal`} family="area" options={options} finish={interrupt} />
        )}
        {children}
      </LineChartFrame>
    </MotionContext>
  );
}
