"use client";

import { useChartHeight, useChartWidth } from "recharts";
import type { LineMaterial } from "./line-material.js";

export type PolarMaterial = LineMaterial;

/** Finish only: Recharts owns polygons, sectors, coordinates and native paint. */
export function PolarMaterialFilter({
  material,
  id,
}: {
  material: Exclude<PolarMaterial, "plain">;
  id: string;
}) {
  const width = useChartWidth();
  const height = useChartHeight();
  return (
    <defs data-kind-ui="polar-material" data-material={material} pointerEvents="none">
      {/* Chart-space bounds remain valid for zero-width and very short/thin marks.
          The SVG viewport still owns clipping; no object-bounds division is needed. */}
      <filter
        id={id}
        filterUnits="userSpaceOnUse"
        x={-16}
        y={-16}
        width={(width ?? 0) + 32}
        height={(height ?? 0) + 32}
        colorInterpolationFilters="sRGB"
      >
        <feComponentTransfer in="SourceAlpha" result="footprint">
          <feFuncA type="linear" slope={100000} />
        </feComponentTransfer>
        {material === "paper" ? (
          <>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65 0.3"
              numOctaves={1}
              seed={7}
              result="fiber"
            />
            <feFlood
              floodColor="var(--kind-ui-polar-paper-fiber, #fff)"
              floodOpacity="var(--kind-ui-polar-paper-grain, 0.14)"
            />
            <feComposite in2="fiber" operator="in" result="texture" />
            <feComposite in="texture" in2="SourceGraphic" operator="atop" result="paper" />
            <feMorphology in="footprint" operator="erode" radius={1.2} result="inside" />
            <feComposite
              in="footprint"
              in2="inside"
              operator="arithmetic"
              k2={1}
              k3={-1}
              result="edge"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.08 0.2"
              numOctaves={1}
              seed={11}
              result="pencil"
            />
            <feColorMatrix in="pencil" type="luminanceToAlpha" result="pencilMask" />
            <feComponentTransfer in="pencilMask" result="sketch">
              <feFuncA type="linear" slope={1.6} intercept={-0.15} />
            </feComponentTransfer>
            <feComposite in="edge" in2="sketch" operator="in" result="sketchEdge" />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.35 0 0 0 0 0 0.35 0 0 0 0 0 0.35 0 0 0 0 0 1 0"
              result="ink"
            />
            <feComposite in="ink" in2="sketchEdge" operator="in" result="contour" />
            <feComposite in="contour" in2="paper" operator="atop" />
          </>
        ) : material === "clay" ? (
          <>
            <feOffset in="footprint" dx={4} dy={4} result="lower" />
            <feComposite
              in="footprint"
              in2="lower"
              operator="arithmetic"
              k2={1}
              k3={-1}
              result="top"
            />
            <feGaussianBlur in="top" stdDeviation={3} result="softTop" />
            <feFlood
              floodColor="var(--kind-ui-polar-clay-light, #fff)"
              floodOpacity="var(--kind-ui-polar-clay-highlight, 0.55)"
            />
            <feComposite in2="softTop" operator="in" result="light" />
            <feOffset in="footprint" dx={-4} dy={-4} result="upper" />
            <feComposite
              in="footprint"
              in2="upper"
              operator="arithmetic"
              k2={1}
              k3={-1}
              result="bottom"
            />
            <feGaussianBlur in="bottom" stdDeviation={3} result="softBottom" />
            <feFlood
              floodColor="var(--kind-ui-polar-clay-shade, #17212b)"
              floodOpacity="var(--kind-ui-polar-clay-shadow, 0.32)"
            />
            <feComposite in2="softBottom" operator="in" result="shade" />
            <feComposite in="shade" in2="SourceGraphic" operator="atop" result="shaded" />
            <feComposite in="light" in2="shaded" operator="atop" result="body" />
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.7}
              numOctaves={1}
              seed={17}
              result="grain"
            />
            <feFlood floodColor="var(--kind-ui-polar-clay-light, #fff)" floodOpacity={0.025} />
            <feComposite in2="grain" operator="in" result="texture" />
            <feComposite in="texture" in2="body" operator="atop" />
          </>
        ) : (
          <>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0.6 0 0 0 0.4 0 0.6 0 0 0.4 0 0 0.6 0 0.4 0 0 0 1 0"
              result="luminousPaint"
            />
            <feGaussianBlur in="luminousPaint" stdDeviation={3} result="halo" />
            <feFlood floodOpacity="var(--kind-ui-polar-glow-opacity, 0.65)" result="strength" />
            <feComposite in="halo" in2="strength" operator="in" result="softHalo" />
            {/* Reserve the antialiased edge for native paint; decorative light starts
                beyond its coverage rather than accumulating inside a partial pixel. */}
            <feMorphology in="footprint" operator="dilate" radius={1} result="haloGuard" />
            <feComposite in="softHalo" in2="haloGuard" operator="out" result="exterior" />
            <feMorphology in="footprint" operator="erode" radius={2.2} result="inside" />
            <feComposite
              in="footprint"
              in2="inside"
              operator="arithmetic"
              k2={1}
              k3={-1}
              result="edge"
            />
            <feFlood floodColor="var(--kind-ui-polar-glow-light, #fff)" floodOpacity={0.8} />
            <feComposite in2="edge" operator="in" result="light" />
            <feComposite in="light" in2="SourceGraphic" operator="atop" result="body" />
            <feMerge>
              <feMergeNode in="exterior" />
              <feMergeNode in="body" />
            </feMerge>
          </>
        )}
      </filter>
    </defs>
  );
}
