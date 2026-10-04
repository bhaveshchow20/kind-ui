"use client";
import dynamic from "next/dynamic";
import { type ComponentType, memo } from "react";
import type { PreviewProps } from "./types";

function Loading() {
  return (
    <p className="component-loading" role="status">
      Loading chart…
    </p>
  );
}
const Support = dynamic(
  () => import("@/examples/heatmap/example").then((m) => memo(m.SupportHeatmap)),
  {
    loading: Loading,
    ssr: false,
  },
);
const Regional = dynamic(
  () => import("@/examples/heatmap-diverging/example").then((m) => memo(m.RegionalHeatmap)),
  {
    loading: Loading,
    ssr: false,
  },
);
const Material = dynamic(
  () => import("@/examples/heatmap-materials/example").then((m) => memo(m.MaterialHeatmap)),
  {
    loading: Loading,
    ssr: false,
  },
);
export const previews = {
  heatmap: Support,
  "heatmap-diverging": Regional,
  "heatmap-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "paper" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
