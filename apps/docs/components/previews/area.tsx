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
  area: dynamic(() => import("@/examples/area/example").then((m) => memo(m.VisitorAreaChart)), {
    loading: Loading,
    ssr: false,
  }),
  "area-curves": dynamic(
    () => import("@/examples/area-curves/example").then((m) => memo(m.VisitorAreaCurveChart)),
    { loading: Loading, ssr: false },
  ),
  "area-stacked": dynamic(
    () => import("@/examples/area-stacked/example").then((m) => memo(m.DeviceAreaChart)),
    { loading: Loading, ssr: false },
  ),
  "area-materials": dynamic(
    () => import("@/examples/area-materials/example").then((m) => memo(m.MaterialAreaChart)),
    { loading: Loading, ssr: false },
  ),
};

const Curve = components["area-curves"];
const Material = components["area-materials"];
export const previews = {
  area: components["area"],
  "area-curves": ({ variant }: PreviewProps) => (
    <Curve curve={variant as "monotone" | "linear" | "stepAfter"} />
  ),
  "area-stacked": components["area-stacked"],
  "area-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "paper" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
