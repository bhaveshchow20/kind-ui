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
const components = {
  line: dynamic(() => import("@/examples/line/example").then((m) => memo(m.VisitorTrendChart)), {
    loading: Loading,
    ssr: false,
  }),
  "line-smooth": dynamic(
    () => import("@/examples/line-smooth/example").then((m) => memo(m.VisitorCurveChart)),
    { loading: Loading, ssr: false },
  ),
  "line-comparison": dynamic(
    () => import("@/examples/line-comparison/example").then((m) => memo(m.RevenueComparisonChart)),
    { loading: Loading, ssr: false },
  ),
  "line-markers": dynamic(
    () => import("@/examples/line-markers/example").then((m) => memo(m.ResponseTimeChart)),
    { loading: Loading, ssr: false },
  ),
  "line-materials": dynamic(
    () => import("@/examples/line-materials/example").then((m) => memo(m.MaterialLineChart)),
    { loading: Loading, ssr: false },
  ),
};

const Curve = components["line-smooth"];
const Material = components["line-materials"];
export const previews = {
  line: components.line,
  "line-smooth": ({ variant }: PreviewProps) => (
    <Curve curve={variant as "monotone" | "linear" | "stepAfter"} />
  ),
  "line-comparison": components["line-comparison"],
  "line-markers": components["line-markers"],
  "line-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
