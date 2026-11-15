"use client";
import dynamic from "next/dynamic";
import { type ComponentType, memo } from "react";
import { PreviewPanelFrame } from "./preview-panel-frame";
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
const Compact = dynamic(
  () => import("@/examples/heatmap-compact/example").then((m) => memo(m.CompactActivityHeatmap)),
  { loading: Loading, ssr: false },
);
export const previews = {
  "heatmap-compact": () => (
    <PreviewPanelFrame>
      <div className="not-prose">
        <Compact />
      </div>
    </PreviewPanelFrame>
  ),

  heatmap: ({ variant }: PreviewProps) => (
    <PreviewPanelFrame>
      <Support state={variant as "ready" | "loading"} />
    </PreviewPanelFrame>
  ),
  "heatmap-diverging": () => (
    <PreviewPanelFrame>
      <Regional />
    </PreviewPanelFrame>
  ),
  "heatmap-materials": ({ variant }: PreviewProps) => (
    <PreviewPanelFrame>
      <Material appearance={variant as "default" | "clay" | "glow"} />
    </PreviewPanelFrame>
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
