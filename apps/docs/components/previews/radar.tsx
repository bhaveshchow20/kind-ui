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
const Radar = dynamic(
  () => import("@/examples/radar/example").then((m) => memo(m.ProductRadarChart)),
  { loading: Loading, ssr: false },
);
const Selection = dynamic(
  () => import("@/examples/radar-selection/example").then((m) => memo(m.SelectableRadarChart)),
  { loading: Loading, ssr: false },
);
const Material = dynamic(
  () => import("@/examples/radar-materials/example").then((m) => memo(m.MaterialRadarChart)),
  { loading: Loading, ssr: false },
);
export const previews = {
  radar: Radar,
  "radar-selection": Selection,
  "radar-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
