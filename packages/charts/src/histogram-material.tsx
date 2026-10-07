"use client";

import { BarClay } from "./bar-clay.js";
import type { BarMaterial } from "./bar-material.js";

/** Reuse bar surface paint, with no cast shade across quantitative interval edges. */
export function HistogramMaterialFilter({
  material,
  id,
  bounds,
  padding,
}: {
  material: Exclude<BarMaterial, "plain">;
  id: string;
  padding: number;
  bounds: { x: number; y: number; width: number; height: number };
}) {
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      x={bounds.x - padding}
      y={bounds.y - padding}
      width={bounds.width + padding * 2}
      height={bounds.height + padding * 2}
      colorInterpolationFilters="sRGB"
    >
      {material === "clay" ? (
        <>
          <BarClay horizontal={false} />
          {/* BarClay's silhouette is opaque only where native paint exists. Its
            final merge includes exterior cast shade; exclude it for numeric bins. */}
          <feComposite in2="footprint" operator="in" />
        </>
      ) : (
        <>
          <feComponentTransfer in="SourceAlpha" result="footprint">
            <feFuncA type="linear" slope={100000} />
          </feComponentTransfer>
          <feGaussianBlur in="SourceGraphic" stdDeviation={2.5} result="halo" />
          <feFlood floodOpacity="var(--kind-ui-bar-glow-opacity, 0.6)" result="strength" />
          <feComposite in="halo" in2="strength" operator="in" result="softHalo" />
          <feComposite in="softHalo" in2="footprint" operator="out" result="unpaintedHalo" />
          {/* Transparent paint inside the exact rectangle stays transparent. */}
          <feFlood
            x={bounds.x}
            y={bounds.y}
            width={bounds.width}
            height={bounds.height}
            floodColor="#fff"
            result="binBounds"
          />
          <feComposite in="unpaintedHalo" in2="binBounds" operator="out" result="exteriorHalo" />
          <feMorphology in="footprint" operator="erode" radius={1.5} result="inside" />
          <feComposite in="footprint" in2="inside" operator="out" result="edge" />
          <feFlood floodColor="var(--kind-ui-bar-glow-light, #fff)" floodOpacity={0.75} />
          <feComposite in2="edge" operator="in" result="light" />
          <feComposite in="light" in2="SourceGraphic" operator="atop" result="body" />
          <feGaussianBlur in="light" stdDeviation={1.5} result="innerLight" />
          <feComposite in="innerLight" in2="body" operator="atop" result="litBody" />
          <feMerge>
            <feMergeNode in="exteriorHalo" />
            <feMergeNode in="litBody" />
          </feMerge>
        </>
      )}
    </filter>
  );
}
