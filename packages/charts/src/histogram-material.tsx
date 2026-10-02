"use client";

import { BarClay } from "./bar-clay.js";
import type { BarMaterial } from "./bar-material.js";
import { BarPaper } from "./bar-paper.js";

/** Reuse bar surface paint, with no cast shade across quantitative interval edges. */
export function HistogramMaterialFilter({
  material,
  id,
}: {
  material: Exclude<BarMaterial, "plain">;
  id: string;
}) {
  return (
    <filter
      id={id}
      filterUnits="objectBoundingBox"
      primitiveUnits="userSpaceOnUse"
      x={-0.5}
      y={-0.5}
      width={2}
      height={2}
      colorInterpolationFilters="sRGB"
    >
      {material === "paper" ? (
        <BarPaper />
      ) : material === "clay" ? (
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
          <feComposite in="softHalo" in2="footprint" operator="out" result="exteriorHalo" />
          <feMorphology in="footprint" operator="erode" radius={0.8} result="inside" />
          <feComposite in="footprint" in2="inside" operator="out" result="edge" />
          <feFlood floodColor="var(--kind-ui-bar-glow-light, #fff)" floodOpacity={0.45} />
          <feComposite in2="edge" operator="in" result="light" />
          <feComposite in="light" in2="SourceGraphic" operator="atop" result="body" />
          <feMerge>
            <feMergeNode in="exteriorHalo" />
            <feMergeNode in="body" />
          </feMerge>
        </>
      )}
    </filter>
  );
}
