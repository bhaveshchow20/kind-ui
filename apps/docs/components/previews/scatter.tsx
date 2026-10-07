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
const Scatter = dynamic(
  () => import("@/examples/scatter/example").then((m) => memo(m.TaskScatterChart)),
  { loading: Loading, ssr: false },
);
const Bubble = dynamic(
  () => import("@/examples/scatter-bubble/example").then((m) => memo(m.TaskBubbleChart)),
  { loading: Loading, ssr: false },
);
const Material = dynamic(
  () => import("@/examples/scatter-materials/example").then((m) => memo(m.MaterialBubbleChart)),
  { loading: Loading, ssr: false },
);
export const previews = {
  scatter: Scatter,
  "scatter-bubble": Bubble,
  "scatter-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
