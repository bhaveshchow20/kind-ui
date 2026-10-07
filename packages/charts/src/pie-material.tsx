"use client";

import type { LineMaterial } from "./line-material.js";

export type PieMaterial = LineMaterial;
export type PiePaintBounds = { x: number; y: number; width: number; height: number };

/** Native Sector retains angles, radii and paint alpha; Glow alone emits a decorative halo. */
export function PieMaterialFilter({
  material,
  id,
  radius,
  thickness,
  cx,
  cy,
  strokeWidth,
  bounds,
}: {
  material: Exclude<PieMaterial, "plain">;
  id: string;
  radius: number;
  thickness: number;
  cx: number;
  cy: number;
  strokeWidth: number;
  bounds?: PiePaintBounds | undefined;
}) {
  const relief = Math.max(1, Math.min(14, radius * 0.12, thickness * 0.22));
  const margin = 16 + strokeWidth / 2;
  const x = Math.floor(cx - radius - margin);
  const y = Math.floor(cy - radius - margin);
  const width = Math.ceil(cx + radius + margin) - x;
  const height = Math.ceil(cy + radius + margin) - y;
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      x={bounds?.x ?? x}
      y={bounds?.y ?? y}
      width={bounds?.width ?? width}
      height={bounds?.height ?? height}
      colorInterpolationFilters="sRGB"
    >
      {material === "clay" ? (
        <>
          <feComponentTransfer in="SourceAlpha" result="footprint">
            <feFuncA type="linear" slope={100000} />
          </feComponentTransfer>
          {/* Broad opposing ramps make a convex matte body, not a glossy edge groove. */}
          <feGaussianBlur in="footprint" stdDeviation={relief} result="rounded" />
          <feOffset in="rounded" dx={relief * 0.7} dy={relief * 0.9} result="lower" />
          <feComposite in="footprint" in2="lower" operator="out" result="top" />
          <feGaussianBlur in="top" stdDeviation={relief * 0.45} result="softTop" />
          <feFlood
            floodColor="var(--kind-ui-pie-clay-light, #fff)"
            floodOpacity="var(--kind-ui-pie-clay-highlight, 0.55)"
          />
          <feComposite in2="softTop" operator="in" result="light" />
          <feOffset in="rounded" dx={-relief * 0.8} dy={-relief} result="upper" />
          <feComposite in="footprint" in2="upper" operator="out" result="bottom" />
          <feGaussianBlur in="bottom" stdDeviation={relief * 0.45} result="softBottom" />
          <feFlood
            floodColor="var(--kind-ui-pie-clay-shade, #17212b)"
            floodOpacity="var(--kind-ui-pie-clay-shadow, 0.32)"
          />
          <feComposite in2="softBottom" operator="in" result="shade" />
          <feComposite in="shade" in2="SourceGraphic" operator="atop" result="shaded" />
          <feComposite in="light" in2="shaded" operator="atop" result="finished" />
          <NativePaintColor />
        </>
      ) : (
        <>
          <feComponentTransfer in="SourceAlpha" result="footprint">
            <feFuncA type="linear" slope={100000} />
          </feComponentTransfer>
          {/* Keep emission off native antialiased pixels; the crisp body renders separately. */}
          <feMorphology in="footprint" operator="dilate" radius={1.5} result="haloGuard" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={4.5} result="soft" />
          <feFlood floodOpacity="var(--kind-ui-pie-glow-opacity, 0.8)" result="strength" />
          <feComposite in="soft" in2="strength" operator="in" result="haloPaint" />
          <feComposite in="haloPaint" in2="haloGuard" operator="out" result="halo" />
          <feMerge>
            <feMergeNode in="halo" />
          </feMerge>
        </>
      )}
    </filter>
  );
}

/** The enclosing native-paint mask owns alpha; this surface contributes color only. */
function NativePaintColor() {
  return (
    <feColorMatrix in="finished" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1" />
  );
}
