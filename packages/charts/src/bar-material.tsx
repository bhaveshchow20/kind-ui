"use client";

import { cloneElement } from "react";
import { BarClay } from "./bar-clay.js";
import { BarPaper } from "./bar-paper.js";
import type { LineMaterial } from "./line-material.js";
import { SurfaceMaterialFilter } from "./surface-material.js";

export type BarMaterial = LineMaterial;

/** Native rectangles apply this filter independently to their own object bounds. */
export function BarMaterialFilter({
  material,
  id,
  horizontal,
}: {
  material: Exclude<BarMaterial, "plain">;
  id: string;
  horizontal: boolean;
}) {
  if (material !== "glow")
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
        {material === "clay" ? <BarClay horizontal={horizontal} /> : <BarPaper />}
      </filter>
    );
  // The shared pure helper returns a native filter. Only bar coordinate units change;
  // pixel-sized primitives and the area's user-space bounds retain their semantics.
  return cloneElement(
    SurfaceMaterialFilter({
      material,
      id,
      family: "bar",
      bounds: { x: -0.5, y: -0.5, width: 2, height: 2 },
    }),
    { filterUnits: "objectBoundingBox", primitiveUnits: "userSpaceOnUse" },
  );
}
