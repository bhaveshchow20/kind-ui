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
const Count = dynamic(
  () => import("@/examples/histogram/example").then((m) => memo(m.CheckoutLatencyHistogram)),
  { loading: Loading, ssr: false },
);
const Density = dynamic(
  () =>
    import("@/examples/histogram-density/example").then((m) => memo(m.CheckoutDensityHistogram)),
  { loading: Loading, ssr: false },
);
const Material = dynamic(
  () => import("@/examples/histogram-materials/example").then((m) => memo(m.MaterialHistogram)),
  { loading: Loading, ssr: false },
);

export const previews = {
  histogram: Count,
  "histogram-density": Density,
  "histogram-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
