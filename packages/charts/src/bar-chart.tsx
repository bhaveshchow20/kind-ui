"use client";

import {
  type ComponentProps,
  createContext,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { BarChart as EngineBarChart } from "recharts";
import { type LineAnimation, MotionContext } from "./animation.js";
import { BarCategoryBoundary } from "./bar-category.js";
import { LineChartFrame, useLineInteraction } from "./line-chart.js";
import { CartesianLoadingDesign } from "./loading-cartesian-designs.js";

export type BarAnimation = LineAnimation;
export type BarChartProps = ComponentProps<typeof EngineBarChart> & {
  animate?: boolean | BarAnimation | undefined;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
  /** Opt in only for complete native category comparisons; any unsafe visible peer falls back. */
  emphasis?: "none" | "category" | undefined;
};
export const BarMotion = createContext<{
  reveal: boolean;
  options: BarAnimation;
  finish: () => void;
}>({
  reveal: false,
  options: {},
  finish: () => {},
});
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;
const defaultHover = { type: "spring", stiffness: 210, damping: 28, mass: 0.8 } as const;

// Chart layout props may move bars without changing the plot or numeric zero.
export function BarLifecycle({
  layout,
  barGap,
  barCategoryGap,
  barSize,
  stackOffset,
  reverseStackOrder,
}: BarChartProps) {
  const { invalidate } = useLineInteraction();
  const inputs = [layout, barGap, barCategoryGap, barSize, stackOffset, reverseStackOrder];
  const previous = useRef(inputs);
  useLayoutEffect(() => {
    if (inputs.some((value, index) => value !== previous.current[index])) invalidate();
    previous.current = inputs;
  });
  return null;
}

/** Native Recharts composition with Kind interaction and optional Motion. */
export function BarChartImplementation({
  chartProps,
  family,
}: {
  chartProps: BarChartProps;
  family: "bar" | "waterfall" | "histogram" | "box-plot";
}) {
  const {
    animate = false,
    loading,
    loadingLabel,
    emphasis = "none",
    children,
    ...props
  } = chartProps;
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interacted, setInteracted] = useState(false);
  const finish = useCallback(() => {
    if (!loading) setInteracted(true);
  }, [loading]);
  useLayoutEffect(() => {
    if (loading) setInteracted(false);
  }, [loading]);
  const enabled = animate !== false && !reduced && !loading;
  const options = typeof animate === "object" ? animate : {};
  return (
    <MotionContext value={{ enabled, transition: options.hoverTransition ?? defaultHover }}>
      <BarMotion value={{ reveal: enabled && !interacted, options, finish }}>
        <BarCategoryBoundary>
          <LineChartFrame
            chartProps={props}
            loadingSkeleton={family}
            loadingDesign={(seed) => <CartesianLoadingDesign family={family} seed={seed} />}
            loadingAnimation={{ ...options, ...(props.layout ? { layout: props.layout } : {}) }}
            loading={loading}
            loadingLabel={loadingLabel}
            categoryEmphasis={emphasis === "category"}
            engine={EngineBarChart}
            motionEnabled={enabled}
            interrupt={finish}
          >
            <BarLifecycle {...props} />
            {children}
          </LineChartFrame>
        </BarCategoryBoundary>
      </BarMotion>
    </MotionContext>
  );
}

/** Native bar composition with a deterministic loading silhouette. */
export function BarChart(props: BarChartProps) {
  return <BarChartImplementation chartProps={props} family="bar" />;
}
