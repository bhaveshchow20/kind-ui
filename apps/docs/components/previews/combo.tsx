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
const Production = dynamic(
  () => import("@/examples/combo/example").then((m) => memo(m.ProductionComboChart)),
  { loading: Loading, ssr: false },
);
const Revenue = dynamic(
  () => import("@/examples/combo-stacked/example").then((m) => memo(m.RevenueMarginChart)),
  { loading: Loading, ssr: false },
);
const Motion = dynamic(
  () => import("@/examples/combo-motion/example").then((m) => memo(m.ProductionMotionChart)),
  { loading: Loading, ssr: false },
);
const Presentation = dynamic(
  () => import("@/examples/combo-presentation/example").then((m) => memo(m.PresentationOptions)),
  { loading: Loading, ssr: false },
);

export const previews = {
  "combo-presentation": ({ variant }: PreviewProps) => (
    <Presentation status={variant as "ready" | "loading"} />
  ),

  combo: ({ variant }: PreviewProps) => {
    const Primary = Production;
    return <Primary state={variant as "ready" | "loading"} />;
  },
  "combo-stacked": Revenue,
  "combo-motion": ({ variant }: PreviewProps) => (
    <Motion entrance={variant as "independent" | "together" | "lineOnly"} />
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
