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
  waterfall: Cash,
  "waterfall-missing": Missing,
  "waterfall-materials": ({ variant }: PreviewProps) => (
    <Material material={variant as "plain" | "clay" | "glow"} />
  ),
};
