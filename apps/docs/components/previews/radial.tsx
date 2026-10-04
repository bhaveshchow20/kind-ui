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
const Progress = dynamic(
  () => import("@/examples/radial/example").then((m) => memo(m.ProjectProgressChart)),
  { loading: Loading, ssr: false },
);
const Gauge = dynamic(
  () => import("@/examples/radial-gauge/example").then((m) => memo(m.StorageGaugeChart)),
  { loading: Loading, ssr: false },
);
const Capacity = dynamic(
  () => import("@/examples/radial-stacked/example").then((m) => memo(m.TeamCapacityChart)),
  { loading: Loading, ssr: false },
);
export const previews = {
  radial: Progress,
  "radial-gauge": ({ variant }: PreviewProps) => (
    <Gauge direction={variant as "clockwise" | "anticlockwise"} />
  ),
  "radial-stacked": Capacity,
} satisfies Record<string, ComponentType<PreviewProps>>;
