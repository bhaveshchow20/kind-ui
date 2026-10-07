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
const Distribution = dynamic(
  () => import("@/examples/box-plot/example").then((m) => memo(m.ResponseTimeBoxPlot)),
  { loading: Loading, ssr: false },
);
const Horizontal = dynamic(
  () =>
    import("@/examples/box-plot-horizontal/example").then((m) =>
      memo(m.HorizontalResponseTimeBoxPlot),
    ),
  { loading: Loading, ssr: false },
);
const EdgeCases = dynamic(
  () => import("@/examples/box-plot-edge-cases/example").then((m) => memo(m.EdgeCaseBoxPlot)),
  { loading: Loading, ssr: false },
);
const Material = dynamic(
  () =>
    import("@/examples/box-plot-materials/example").then((m) =>
      memo(m.MaterialResponseTimeBoxPlot),
    ),
  { loading: Loading, ssr: false },
);

export const previews = {
  "box-plot": ({ variant }: PreviewProps) => {
    const Primary = Distribution;
    return <Primary state={variant as "ready" | "loading"} />;
  },
  "box-plot-horizontal": Horizontal,
  "box-plot-edge-cases": EdgeCases,
  "box-plot-materials": ({ variant }: PreviewProps) => (
    <Material appearance={variant as "default" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
