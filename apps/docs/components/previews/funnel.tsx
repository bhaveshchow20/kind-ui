"use client";
import dynamic from "next/dynamic";
import { type ComponentType, memo } from "react";
import { PreviewPanelFrame } from "./preview-panel-frame";
import type { PreviewProps } from "./types";

const loading = () => (
  <p className="component-loading" role="status">
    Loading chart…
  </p>
);
const Checkout = dynamic(
  () => import("@/examples/funnel/example").then((module) => memo(module.CheckoutCohortChart)),
  { loading, ssr: false },
);
const Pipeline = dynamic(
  () =>
    import("@/examples/funnel-pipeline/example").then((module) =>
      memo(module.WeightedPipelineChart),
    ),
  { loading, ssr: false },
);
const Comparison = dynamic(
  () =>
    import("@/examples/funnel-comparison/example").then((module) =>
      memo(module.CohortComparisonChart),
    ),
  { loading, ssr: false },
);
const Workflow = dynamic(
  () =>
    import("@/examples/funnel-orientation/example").then((module) =>
      memo(module.ApplicationWorkflowChart),
    ),
  { loading, ssr: false },
);

export const previews = {
  funnel: ({ variant }: PreviewProps) => (
    <PreviewPanelFrame>
      <Checkout state={variant === "loading" ? "loading" : "ready"} />
    </PreviewPanelFrame>
  ),
  "funnel-pipeline": () => (
    <PreviewPanelFrame>
      <Pipeline />
    </PreviewPanelFrame>
  ),
  "funnel-comparison": () => (
    <PreviewPanelFrame>
      <Comparison />
    </PreviewPanelFrame>
  ),
  "funnel-orientation": ({ variant }: PreviewProps) => (
    <PreviewPanelFrame>
      <Workflow orientation={variant === "vertical" ? "vertical" : "horizontal"} />
    </PreviewPanelFrame>
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
