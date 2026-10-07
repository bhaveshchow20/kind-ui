"use client";

import { AreaClayRelief } from "./area-clay.js";
import type { LineMaterial } from "./line-material.js";

/** Internal filled-surface finish only. Callers own native shapes, IDs and bounds. */
export function SurfaceMaterialFilter({
  material,
  id,
  bounds,
  family,
}: {
  material: Exclude<LineMaterial, "plain">;
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  family: "area" | "bar";
}) {
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      colorInterpolationFilters="sRGB"
    >
      {material === "clay" && family === "area" ? (
        <AreaClayRelief />
      ) : material === "clay" ? (
        <>
          <feOffset in="SourceAlpha" dx={0} dy={1.5} result="lower" />
          <feComposite in="SourceAlpha" in2="lower" operator="out" result="topEdge" />
          <feFlood floodColor={`var(--kind-ui-${family}-clay-light, #fff)`} floodOpacity={0.65} />
          <feComposite in2="topEdge" operator="in" result="light" />
          <feOffset in="SourceAlpha" dx={0} dy={-2} result="upper" />
          <feComposite in="SourceAlpha" in2="upper" operator="out" result="bottomEdge" />
          <feFlood
            floodColor={`var(--kind-ui-${family}-clay-shade, #17212b)`}
            floodOpacity={0.38}
          />
          <feComposite in2="bottomEdge" operator="in" result="shade" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shade" />
            <feMergeNode in="light" />
          </feMerge>
        </>
      ) : (
        <>
          <feGaussianBlur in="SourceGraphic" stdDeviation={2.5} result="halo" />
          <feFlood floodOpacity={`var(--kind-ui-${family}-glow-opacity, 0.6)`} result="strength" />
          <feComposite in="halo" in2="strength" operator="in" result="softHalo" />
          <feMorphology in="SourceAlpha" operator="erode" radius={0.8} result="inside" />
          <feComposite in="SourceAlpha" in2="inside" operator="out" result="edge" />
          <feFlood floodColor={`var(--kind-ui-${family}-glow-light, #fff)`} floodOpacity={0.45} />
          <feComposite in2="edge" operator="in" result="light" />
          <feMerge>
            <feMergeNode in="softHalo" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="light" />
          </feMerge>
        </>
      )}
    </filter>
  );
}
