"use client";

import {
  type ComponentProps,
  type CSSProperties,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ComposedChart as EngineComposedChart } from "recharts";
import { type BaseAnimation, type LineAnimation, MotionContext } from "./animation.js";
import { BarLifecycle, BarMotion } from "./bar-chart.js";
import { LineChartFrame, useLineInteraction } from "./line-chart.js";
import { CartesianLoadingDesign } from "./loading-cartesian-designs.js";
import { defaultHover, useReducedMotion } from "./motion-preference.js";
import { RevealClip } from "./reveal-clip.js";
import { cn } from "./utils.js";

type Reveal = Pick<BaseAnimation, "revealDurationMs" | "revealEasing">;
type DirectionalReveal = Reveal & Pick<LineAnimation, "revealDirection">;
/** Shared hover Motion, with independently configured family entrances. */
export type ComboAnimation = LineAnimation & {
  lineReveal?: false | DirectionalReveal;
  areaReveal?: false | DirectionalReveal;
  barReveal?: false | Reveal;
};
export type ComboChartProps = ComponentProps<typeof EngineComposedChart> & {
  animate?: boolean | ComboAnimation | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
};

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
  const reduced = useReducedMotion();
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
          loadingDesign={(seed) => <CartesianLoadingDesign family={"combo"} seed={seed} />}
          loadingAnimation={{ ...options, ...(props.layout ? { layout: props.layout } : {}) }}
          engine={EngineComposedChart}
          chartProps={{
            ...props,
            className: cn(
              "kind-ui-combo-chart [&_.recharts-area]:[clip-path:var(--kind-ui-combo-area-clip,none)] [&_.recharts-area-dots]:[clip-path:var(--kind-ui-combo-area-clip,none)]",
              props.className,
            ),
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
            <RevealClip
              id={`${id}-line`}
              family="line"
              combo
              options={line || {}}
              finish={finishLine}
            />
          )}
          {revealArea && (
            <RevealClip
              id={`${id}-area`}
              family="area"
              combo
              options={area || {}}
              finish={finishArea}
            />
          )}
          {children}
        </LineChartFrame>
      </BarMotion>
    </MotionContext>
  );
}
