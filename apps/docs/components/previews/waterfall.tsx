"use client";
import dynamic from "next/dynamic";
import { memo } from "react";
import type { PreviewProps } from "./types";

const loading = () => (
  <p className="component-loading" role="status">
    Loading chart…
  </p>
);
const Cash = dynamic(
  () => import("@/examples/waterfall/example").then((m) => memo(m.CashFlowChart)),
  { loading, ssr: false },
);
const Missing = dynamic(
  () => import("@/examples/waterfall-missing/example").then((m) => memo(m.MissingCashFlowChart)),
  { loading, ssr: false },
);
const Material = dynamic(
  () => import("@/examples/waterfall-materials/example").then((m) => memo(m.MaterialCashFlowChart)),
  { loading, ssr: false },
);
export const previews = {
  waterfall: ({ variant }: PreviewProps) => {
    const Primary = Cash;
    return <Primary state={variant as "ready" | "loading"} />;
  },
  "waterfall-missing": Missing,
  "waterfall-materials": ({ variant }: PreviewProps) => (
    <Material appearance={variant as "default" | "clay" | "glow"} />
  ),
};
