"use client";
import dynamic from "next/dynamic";
import { memo } from "react";
import type { PreviewProps } from "./types";

const loading = () => (
  <p className="component-loading" role="status">
    Loading chart…
  </p>
);
const CloudSpend = dynamic(
  () => import("@/examples/treemap/example").then((module) => memo(module.CloudSpendTreemap)),
  { loading, ssr: false },
);
const Portfolio = dynamic(
  () =>
    import("@/examples/treemap-portfolio/example").then((module) =>
      memo(module.GrossExposureTreemap),
    ),
  { loading, ssr: false },
);
const Events = dynamic(
  () =>
    import("@/examples/treemap-events/example").then((module) => memo(module.EventActivityTreemap)),
  { loading, ssr: false },
);
const Storage = dynamic(
  () =>
    import("@/examples/treemap-storage/example").then((module) =>
      memo(module.StorageAllocationTreemap),
    ),
  { loading, ssr: false },
);

export const previews = {
  treemap: ({ variant }: PreviewProps) => (
    <CloudSpend
      period={variant === "previous" ? "previous" : "current"}
      loading={variant === "loading"}
    />
  ),
  "treemap-portfolio": Portfolio,
  "treemap-events": Events,
  "treemap-storage": Storage,
};
