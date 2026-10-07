"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { memo, use, useLayoutEffect, useMemo } from "react";
import { LoadingProgress } from "./loading-motion.js";

// Fixed presentation geometry. These silhouettes never inspect chart rows or values.
export type PolarLoadingFamily = "pie" | "radar" | "radial-bar" | "activity-rings";

function point(radius: number, angle: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [320 + Math.cos(radians) * radius, 120 + Math.sin(radians) * radius];
}
function arc(radius: number, start: number, end: number) {
  const [sx, sy] = point(radius, start);
  const [ex, ey] = point(radius, end);
  return `M ${sx} ${sy} A ${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${ex} ${ey}`;
}
function polygon(radius: number) {
  return [-90, -30, 30, 90, 150, 210].map((angle) => point(radius, angle).join(",")).join(" ");
}

/** A bounded decorative profile, independent of the native chart data. */
export function PolarLoadingDesign({
  family,
  seed = 0,
}: {
  family: PolarLoadingFamily;
  seed?: number;
}) {
  const cycle = Math.abs(Math.trunc(seed));
  const variant = cycle % 4;
  // Four authored profiles guarantee visibly distinct adjacent pulses. Small
  // deterministic deviations keep later cycles fresh without random render work.
  const deviation = (index: number, amount: number) => {
    let hash = (cycle ^ Math.imul(index + 1, 0x45d9f3b)) >>> 0;
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
    return ((hash % 101) / 50 - 1) * amount;
  };
  const sectorProfiles = [
    [70, 20, 10],
    [9, 15, 7, 30, 12, 27],
    [10, 45, 30, 15],
    [35, 8, 12, 10, 35],
  ];
  if (family === "pie") {
    const weights = (sectorProfiles[variant] ?? sectorProfiles[0] ?? []).map((weight, index) =>
      Math.max(5, weight + deviation(index, 2)),
    );
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let angle = -90;
    return (
      <g fill="currentColor">
        {weights.map((weight) => {
          const start = angle + 2;
          angle += (weight / total) * 360;
          return <path key={start} d={`${arc(100, start, angle - 2)} L 320 120 Z`} />;
        })}
      </g>
    );
  }
  if (family === "radar") {
    const reduced = use(LoadingProgress)?.reduced ?? true;
    return (
      <g
        data-kind-ui="loading-radar-motion"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      >
        {[34, 67, 100].map((radius) => (
          <polygon key={radius} points={polygon(radius)} opacity="0.4" />
        ))}
        {[-90, -30, 30, 90, 150, 210].map((angle) => {
          const [x, y] = point(100, angle);
          return <line key={angle} x1="320" y1="120" x2={x} y2={y} opacity="0.35" />;
        })}
        <RadarLoadingPolygon seed={seed} layer={0} reduced={reduced} />
        <RadarLoadingPolygon seed={seed} layer={1} reduced={reduced} />
      </g>
    );
  }
  const rings = family === "activity-rings" ? [91, 66, 41] : [97, 73, 49, 25];
  const sweeps =
    family === "activity-rings"
      ? [
          [325, 80, 190],
          [85, 315, 55],
          [200, 50, 325],
          [50, 205, 100],
        ][variant]
      : [
          [325, 70, 190, 45],
          [75, 310, 45, 220],
          [195, 45, 325, 90],
          [45, 200, 90, 315],
        ][variant];
  return (
    <g fill="none" stroke="currentColor" strokeWidth={family === "activity-rings" ? 17 : 13}>
      {rings.map((radius, index) => (
        <g key={radius}>
          <circle cx="320" cy="120" r={radius} opacity="0.2" />
          <path
            d={arc(
              radius,
              -90,
              -90 + Math.max(35, Math.min(338, (sweeps?.[index] ?? 180) + deviation(index, 9))),
            )}
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
}

const radarProfiles = [
  [96, 28, 42, 90, 25, 35],
  [30, 94, 32, 45, 94, 28],
  [40, 35, 96, 28, 45, 94],
  [86, 72, 28, 34, 82, 96],
] as const;

/** Identical vertex order makes every interpolated shape valid and continuous. */
const RadarLoadingPolygon = memo(function RadarLoadingPolygon({
  seed,
  layer,
  reduced,
}: {
  seed: number;
  layer: number;
  reduced: boolean;
}) {
  const frames = useMemo(() => {
    const first = (Math.abs(Math.trunc(seed)) + layer * 2) % radarProfiles.length;
    const points = Array.from({ length: radarProfiles.length }, (_, step) =>
      (radarProfiles[(first + step) % radarProfiles.length] ?? radarProfiles[0])
        .map((radius, index) =>
          point(radius * (layer === 0 ? 1 : 0.82), -90 + index * 60).join(","),
        )
        .join(" "),
    );
    return [...points, points[0] ?? ""];
  }, [seed, layer]);
  const points = useMotionValue(frames[0] ?? "");
  useLayoutEffect(() => {
    if (reduced) {
      points.set(frames[0] ?? "");
      return;
    }
    // A persistent MotionValue keeps host rerenders from resetting an in-flight
    // SVG attribute back to its first keyframe.
    const controls = animate(points, frames, { duration: 8, ease: "easeInOut", repeat: Infinity });
    return () => controls.stop();
  }, [points, frames, reduced]);
  return (
    <motion.polygon
      data-kind-ui="loading-radar-polygon"
      points={points}
      fill="currentColor"
      fillOpacity={layer === 0 ? 0.2 : 0.12}
      strokeWidth={layer === 0 ? 3 : 2}
      strokeLinejoin="round"
    />
  );
});
