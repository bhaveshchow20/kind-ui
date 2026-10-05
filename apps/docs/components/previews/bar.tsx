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
  bar: dynamic(() => import("@/examples/bar/example").then((m) => memo(m.PickupOrdersChart)), {
    loading: Loading,
    ssr: false,
  }),
  "bar-comparison": dynamic(
    () => import("@/examples/bar-comparison/example").then((m) => memo(m.LibraryLoansChart)),
    { loading: Loading, ssr: false },
  ),
  "bar-horizontal": dynamic(
    () => import("@/examples/bar-horizontal/example").then((m) => memo(m.WorkshopHoursChart)),
    { loading: Loading, ssr: false },
  ),
  "bar-materials": dynamic(
    () => import("@/examples/bar-materials/example").then((m) => memo(m.MaterialBarChart)),
    { loading: Loading, ssr: false },
  ),
};
const Arrangement = components["bar-comparison"];
const Material = components["bar-materials"];
export const previews = {
  bar: components.bar,
  "bar-comparison": ({ variant }: PreviewProps) => (
    <Arrangement arrangement={variant as "grouped" | "stacked"} />
  ),
  "bar-horizontal": components["bar-horizontal"],
  "bar-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "paper" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
