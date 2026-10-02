"use client";

import { cloneElement } from "react";
import { type BarMaterial, BarMaterialFilter } from "./bar-material.js";
import type { BoxPlotSummary } from "./box-plot.js";

export type BoxPlotMaterial = BarMaterial;

/** User-space bounds also cover line-only and tiny summaries without invented IQR. */
export function BoxMaterialFilter({
  material,
  id,
  coordinates: c,
  center,
  size,
  horizontal,
  outlierRadius,
}: {
  material: Exclude<BoxPlotMaterial, "plain">;
  id: string;
  coordinates: BoxPlotSummary;
  center: number;
  size: number;
  horizontal: boolean;
  outlierRadius: number;
}) {
  const values = [c.lowerWhisker, c.q1, c.median, c.q3, c.upperWhisker, ...(c.outliers ?? [])];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = 12 + Math.max(0, outlierRadius);
  const bounds = horizontal
    ? {
        x: low - padding,
        y: center - size / 2 - padding,
        width: high - low + padding * 2,
        height: size + padding * 2,
      }
    : {
        x: center - size / 2 - padding,
        y: low - padding,
        width: size + padding * 2,
        height: high - low + padding * 2,
      };
  if (material !== "glow")
    return cloneElement(BarMaterialFilter({ material, id, horizontal }), {
      filterUnits: "userSpaceOnUse",
      ...bounds,
    });
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      {...bounds}
      colorInterpolationFilters="sRGB"
    >
      <feComponentTransfer in="SourceAlpha" result="footprint">
        <feFuncA type="linear" slope={100000} />
      </feComponentTransfer>
      <feGaussianBlur in="SourceGraphic" stdDeviation={2.5} result="halo" />
      <feFlood floodOpacity="var(--kind-ui-bar-glow-opacity, 0.6)" result="strength" />
      <feComposite in="halo" in2="strength" operator="in" result="softHalo" />
      <feComposite in="softHalo" in2="footprint" operator="out" result="exterior" />
      <feMorphology in="SourceAlpha" operator="erode" radius={0.8} result="inside" />
      <feComposite in="SourceAlpha" in2="inside" operator="out" result="edge" />
      <feFlood floodColor="var(--kind-ui-bar-glow-light, #fff)" floodOpacity={0.45} />
      <feComposite in2="edge" operator="in" result="light" />
      <feComposite in="light" in2="SourceGraphic" operator="atop" result="body" />
      <feMerge>
        <feMergeNode in="exterior" />
        <feMergeNode in="body" />
      </feMerge>
    </filter>
  );
}
