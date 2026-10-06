"use client";

import { type CSSProperties, useId, useState } from "react";
import { usePlotArea } from "recharts";
import { CartesianLoadingDesign } from "./loading-cartesian-designs.js";
import { PolarLoadingDesign } from "./loading-polar-designs.js";
import { StandaloneLoadingDesign } from "./loading-standalone-designs.js";

// Designed illustration coordinates, not values or geometry sampled from host data.
const lineDesign =
  "M 12 185 C 42 185 46 116 82 116 S 126 154 160 154 S 204 65 242 65 S 286 108 322 108 S 366 30 404 30 S 448 96 486 96 S 522 62 550 62 S 580 142 628 112";

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

function Design({ family, seed }: { family: LoadingFamily; seed: number }) {
  if (family === "line")
    return (
      <path
        d={linePaths[seed % linePaths.length]}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />
    );
  if (
    family === "pie" ||
    family === "radar" ||
    family === "radial-bar" ||
    family === "activity-rings"
  )
    return <PolarLoadingDesign family={family} seed={seed} />;
  if (family === "heatmap" || family === "sankey")
    return <StandaloneLoadingDesign family={family} seed={seed} />;
  return <CartesianLoadingDesign family={family} seed={seed} />;
}

const linePaths = [
  lineDesign,
  "M12 160 C45 160 52 60 92 60 S145 100 182 100 S224 190 264 190 S306 118 344 118 S390 155 430 155 S480 42 520 42 S585 105 628 80",
  "M12 110 C48 110 60 170 98 170 S152 55 196 55 S248 100 286 100 S334 40 372 40 S428 150 472 150 S536 78 574 78 S608 115 628 115",
  "M12 190 C56 190 60 140 102 140 S160 178 202 178 S254 75 296 75 S344 118 386 118 S442 32 484 32 S542 70 584 70 S614 45 628 45",
];
/** Fixed decorative design; native plot bounds supply only its available surface. */
export function LoadingSkeletonSurface({
  family,
  seed: suppliedSeed,
  width = "100%",
  height = "100%",
  x,
  y,
  style,
}: {
  family: LoadingFamily;
  seed?: number;
  width?: number | string;
  height?: number | string;
  x?: number;
  y?: number;
  style?: CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const seed =
    suppliedSeed ??
    Array.from(id).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  const [pulse, setPulse] = useState(0);
  const designSeed = seed + pulse;
  const polar = ["pie", "radar", "radial-bar", "activity-rings"].includes(family);
  return (
    <svg
      data-kind-ui="chart-loading-skeleton"
      data-family={family}
      data-loading-motion={
        family === "line" || family === "area"
          ? "sweep"
          : family === "radar"
            ? "radial"
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
      style={style}
      viewBox="0 0 640 240"
      preserveAspectRatio={polar ? "xMidYMid meet" : "none"}
    >
      <defs>
        <mask id={`${id}-angular`} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="240">
          <circle
            data-kind-ui="loading-angular"
            cx="320"
            cy="120"
            r="120"
            fill="none"
            stroke="white"
            strokeWidth="240"
            pathLength="100"
            strokeDasharray="100"
          />
        </mask>
      </defs>
      <g
        data-kind-ui="loading-design"
        opacity="0.48"
        mask={polar && family !== "radar" ? `url(#${id}-angular)` : undefined}
      >
        <Design family={family} seed={designSeed} />
      </g>
    </svg>
  );
}
export function ChartLoadingSkeleton({ family, seed }: { family: LoadingFamily; seed: number }) {
  const plot = usePlotArea();
  if (!plot || plot.width <= 0 || plot.height <= 0) return null;
  return (
    <LoadingSkeletonSurface
      family={family}
      seed={seed}
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
