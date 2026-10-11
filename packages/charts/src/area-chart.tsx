"use client";

import { type ComponentProps, useCallback, useId, useLayoutEffect, useState } from "react";
import { AreaChart as EngineAreaChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { LineChartFrame } from "./line-chart.js";
import { CartesianLoadingDesign } from "./loading-cartesian-designs.js";
import { defaultHover, useReducedMotion } from "./motion-preference.js";
import { RevealClip } from "./reveal-clip.js";
import { cn } from "./utils.js";

export type AreaAnimation = LineAnimation;
export type AreaChartProps = ComponentProps<typeof EngineAreaChart> & {
  animate?: boolean | AreaAnimation | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
};

/** Native Recharts geometry and composition with a shared Motion entrance and tooltip. */
export function AreaChart({
  animate = false,
  loading,
  loadingLabel,
  children,
  ...props
}: AreaChartProps) {
  const id = useId();
  const reduced = useReducedMotion();
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
          className: cn(
            "kind-ui-area-chart [&_.recharts-area]:[clip-path:var(--kind-ui-line-clip,none)] [&_.recharts-area-dots]:[clip-path:var(--kind-ui-line-clip,none)]",
            props.className,
          ),
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
