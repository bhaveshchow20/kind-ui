"use client";

import { motion, useTransform } from "motion/react";
import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { usePlotArea } from "recharts";
import {
  LoadingAngularBand,
  type LoadingAnimation,
  LoadingProgress,
  useLoadingProgress,
} from "./loading-motion.js";

const cartesianEase = [0.25, 0.1, 0.25, 1] as const;

export type LoadingFamily =
  | "line"
  | "area"
  | "bar"
  | "combo"
  | "scatter"
  | "waterfall"
  | "histogram"
  | "box-plot"
  | "pie"
  | "radar"
  | "radial-bar"
  | "activity-rings"
  | "heatmap"
  | "sankey";

/** Internal composition keeps unused family illustrations out of single-chart bundles. */
export type LoadingDesign = (seed: number) => ReactNode;
const lineDesign: LoadingDesign = (seed) => (
  <path
    d={linePath(seed)}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    vectorEffect="non-scaling-stroke"
    strokeLinecap="round"
  />
);

const lineProfiles = [
  [212, 188, 155, 174, 105, 81, 45, 24],
  [28, 62, 42, 110, 132, 178, 158, 215],
  [38, 75, 151, 220, 203, 139, 63, 28],
  [195, 43, 174, 26, 210, 73, 186, 42],
];
function linePath(seed: number) {
  const profile = lineProfiles[seed % 4] ?? lineProfiles[0] ?? [];
  const points = profile.map((y, index) => [
    12 + index * 88,
    Math.max(12, Math.min(225, y + ((Math.imul(seed + index * 11, 2654435761) >>> 0) % 23) - 11)),
  ]);
  let d = `M ${points[0]?.join(" ")}`;
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const point = points[i];
    if (!previous || !point) continue;
    const middle = ((previous[0] ?? 0) + (point[0] ?? 0)) / 2;
    d += ` C ${middle} ${previous[1]} ${middle} ${point[1]} ${point.join(" ")}`;
  }
  return d;
}
/** Fixed decorative design; native plot bounds supply only its available surface. */
export function LoadingSkeletonSurface({
  family,
  seed: suppliedSeed,
  width = "100%",
  height = "100%",
  x,
  y,
  style,
  animation,
  design = lineDesign,
}: {
  family: LoadingFamily;
  seed?: number;
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
  style?: CSSProperties;
  animation?: LoadingAnimation | undefined;
  design?: LoadingDesign | undefined;
}) {
  const id = useId().replace(/:/g, "");
  const seed =
    suppliedSeed ??
    Array.from(id).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  const [pulse, setPulse] = useState(0);
  const designSeed = seed + pulse;
  const isCartesian = [
    "line",
    "area",
    "bar",
    "waterfall",
    "histogram",
    "box-plot",
    "combo",
  ].includes(family);
  const duration = Math.max(
    0,
    animation?.revealDurationMs ??
      (family === "scatter" ? 700 : family === "heatmap" ? 800 : family === "sankey" ? 450 : 1000),
  );
  const easing = animation?.revealEasing ?? (isCartesian ? cartesianEase : "easeOut");
  const part = (kind: "lineReveal" | "areaReveal" | "barReveal") => {
    const option = animation?.[kind];
    return {
      duration:
        family !== "combo" || option === false
          ? 0
          : Math.max(0, option?.revealDurationMs ?? duration),
      easing: option === false ? easing : (option?.revealEasing ?? easing),
    };
  };
  const line = part("lineReveal");
  const area = part("areaReveal");
  const bar = part("barReveal");
  const cycleDuration =
    family === "combo" ? Math.max(line.duration, area.duration, bar.duration) : duration;
  const cycleMs = cycleDuration * 2 + 200;
  const startDelay = cycleMs * 0.12;
  const { progress, reduced } = useLoadingProgress(
    pulse,
    duration,
    easing,
    startDelay,
    family === "radial-bar",
  );
  const lineMotion = useLoadingProgress(pulse, line.duration, line.easing, startDelay);
  const areaMotion = useLoadingProgress(pulse, area.duration, area.easing, startDelay);
  const barMotion = useLoadingProgress(pulse, bar.duration, bar.easing, startDelay);
  const horizontalProgress = family === "combo" ? lineMotion.progress : progress;
  const verticalProgress = family === "combo" ? barMotion.progress : progress;
  const horizontalReduced = family === "combo" ? lineMotion.reduced : reduced;
  const verticalReduced = family === "combo" ? barMotion.reduced : reduced;
  const horizontal = animation?.layout === "vertical";
  const position = useTransform(horizontalProgress, (value) => (value - 0.5) * 640);
  const verticalPosition = useTransform(verticalProgress, (value) => 240 - value * 240);
  const areaPosition = useTransform(areaMotion.progress, (value) => (value - 0.5) * 640);
  const barPosition = useTransform(barMotion.progress, (value) => (value - 0.5) * 640);
  const pulseStyle = {
    ...style,
    // Radar's two polygon MotionValues continuously morph; disabling the CSS
    // opacity pulse keeps them visible rather than disabling their animation.
    ...(cycleDuration === 0 || family === "radar" ? { animation: "none" } : {}),
    "--kind-ui-loading-cycle": `${cycleMs}ms`,
    "--kind-ui-loading-horizontal": `url(#${id}-horizontal)`,
    "--kind-ui-loading-vertical": `url(#${id}-vertical)`,
    "--kind-ui-loading-area": `url(#${id}-area)`,
  } as CSSProperties;
  const polar = ["pie", "radar", "radial-bar", "activity-rings"].includes(family);
  return (
    <svg
      data-kind-ui="chart-loading-skeleton"
      data-family={family}
      data-loading-layout={animation?.layout}
      data-loading-motion={
        family === "line" ||
        family === "area" ||
        ["bar", "waterfall", "histogram", "box-plot"].includes(family)
          ? "sweep"
          : family === "radar"
            ? "morph"
            : polar
              ? "angular"
              : family === "heatmap"
                ? "wave"
                : family === "sankey"
                  ? "flow"
                  : family === "scatter"
                    ? "emerge"
                    : family === "combo"
                      ? "combined"
                      : "grow"
      }
      onAnimationIteration={(event) => {
        if (event.target === event.currentTarget && event.animationName === "kind-ui-loading-pulse")
          setPulse((value) => value + 1);
      }}
      aria-hidden="true"
      focusable="false"
      x={x}
      y={y}
      width={width}
      height={height}
      style={pulseStyle}
      data-reveal-duration={duration}
      viewBox={polar ? "200 0 240 240" : "0 0 640 240"}
      preserveAspectRatio={polar || family === "scatter" ? "xMidYMid meet" : "none"}
    >
      <defs>
        <linearGradient id={`${id}-soft-x`}>
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.35" stopColor="white" />
          <stop offset="0.75" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-soft-y`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.35" stopColor="white" />
          <stop offset="0.75" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask
          id={`${id}-horizontal`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="640"
          height="240"
        >
          {horizontalReduced ? (
            <rect width="640" height="240" fill="white" />
          ) : (
            <motion.rect
              data-kind-ui="loading-leading-window"
              x={position}
              y="0"
              width="320"
              height="240"
              fill={`url(#${id}-soft-x)`}
            />
          )}
        </mask>
        <mask id={`${id}-vertical`} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="240">
          {verticalReduced ? (
            <rect width="640" height="240" fill="white" />
          ) : (
            <motion.rect
              data-kind-ui="loading-leading-window"
              x="0"
              y={verticalPosition}
              width="640"
              height="120"
              fill={`url(#${id}-soft-y)`}
            />
          )}
        </mask>
        <mask id={`${id}-area`} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="240">
          {areaMotion.reduced ? (
            <rect width="640" height="240" fill="white" />
          ) : (
            <motion.rect
              x={areaPosition}
              y="0"
              width="320"
              height="240"
              fill={`url(#${id}-soft-x)`}
            />
          )}
        </mask>
        <mask
          id={`${id}-bar-horizontal`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="640"
          height="240"
        >
          {barMotion.reduced ? (
            <rect width="640" height="240" fill="white" />
          ) : (
            <motion.rect
              x={barPosition}
              y="0"
              width="320"
              height="240"
              fill={`url(#${id}-soft-x)`}
            />
          )}
        </mask>
        <mask id={`${id}-angular`} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="240">
          {reduced ? (
            <rect width="640" height="240" fill="white" />
          ) : (
            [0, 18, 36, 54, 72, 90, 108, 126].map((angle) => (
              <LoadingAngularBand
                key={angle}
                progress={progress}
                index={angle / 18}
                direction={animation?.direction ?? "clockwise"}
              />
            ))
          )}
        </mask>
      </defs>
      <g
        data-kind-ui="loading-design"
        opacity="0.48"
        mask={
          family === "radar"
            ? undefined
            : polar
              ? `url(#${id}-angular)`
              : family === "line" || family === "area"
                ? `url(#${id}-horizontal)`
                : family === "bar" ||
                    family === "waterfall" ||
                    family === "histogram" ||
                    family === "box-plot"
                  ? `url(#${id}-horizontal)`
                  : undefined
        }
      >
        <LoadingProgress value={{ progress, reduced }}>
          <g
            transform={
              horizontal && ["bar", "waterfall", "histogram", "box-plot"].includes(family)
                ? "matrix(0 .375 -2.6666667 0 640 0)"
                : undefined
            }
          >
            {design(family === "radar" ? seed : designSeed)}
          </g>
        </LoadingProgress>
      </g>
    </svg>
  );
}
export function ChartLoadingSkeleton({
  family,
  seed,
  animation,
  design,
}: {
  family: LoadingFamily;
  seed: number;
  animation?: LoadingAnimation | undefined;
  design?: LoadingDesign | undefined;
}) {
  const plot = usePlotArea();
  if (!plot || plot.width <= 0 || plot.height <= 0) return null;
  return (
    <LoadingSkeletonSurface
      family={family}
      seed={seed}
      animation={animation}
      design={design}
      x={plot.x}
      y={plot.y}
      width={plot.width}
      height={plot.height}
    />
  );
}
export function LoadingStatus({
  loading,
  label,
}: {
  loading?: boolean | undefined;
  label?: string | undefined;
}) {
  return loading === undefined ? null : (
    <span role="status" data-kind-ui="chart-loading-status">
      {loading ? (label ?? "Loading chart") : ""}
    </span>
  );
}

/** Cycle state belongs to the persistent host, so resize/render cannot change a design. */
export function useLoadingSeed(loading: boolean | undefined) {
  const id = useId();
  const [state, setState] = useState({ pending: !!loading, cycle: 0 });
  let cycle = state.cycle;
  if (state.pending !== !!loading) {
    cycle += loading ? 1 : 0;
    setState({ pending: !!loading, cycle });
  }
  return Array.from(id).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7) + cycle;
}
