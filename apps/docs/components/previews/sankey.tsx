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
const Energy = dynamic(
  () => import("@/examples/sankey/example").then((m) => memo(m.EnergyFlowChart)),
  { loading: Loading, ssr: false },
);
const Finish = dynamic(
  () => import("@/examples/sankey-finishes/example").then((m) => memo(m.EnergyFlowFinishChart)),
  { loading: Loading, ssr: false },
);
export const previews = {
  sankey: Energy,
  "sankey-finishes": ({ variant }: PreviewProps) => (
    <Finish finish={variant as "plain" | "paper" | "clay" | "glow"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
