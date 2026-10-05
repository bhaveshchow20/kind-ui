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
const Shape = dynamic(
  () => import("@/examples/pie/example").then((m) => memo(m.TeamAllocationChart)),
  { loading: Loading, ssr: false },
);
const Visibility = dynamic(
  () => import("@/examples/pie-visibility/example").then((m) => memo(m.VisibleAllocationChart)),
  { loading: Loading, ssr: false },
);
const Material = dynamic(
  () => import("@/examples/pie-materials/example").then((m) => memo(m.AllocationMaterialChart)),
  { loading: Loading, ssr: false },
);
export const previews = {
  pie: ({ variant }: PreviewProps) => <Shape shape={variant as "pie" | "donut"} />,
  "pie-visibility": Visibility,
  "pie-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "paper" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
