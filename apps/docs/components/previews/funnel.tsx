"use client";
import dynamic from "next/dynamic";
import { type ComponentType, memo, type ReactNode, useLayoutEffect, useRef } from "react";
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

// Stage readouts and stacked comparison panels determine the shared Preview/Code height.
function Frame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    const workbench = node?.closest<HTMLElement>(".component-workbench");
    const panel = node?.closest<HTMLElement>(".preview-panel");
    if (!node || !workbench || !panel) return;
    const measure = () => {
      const padding = getComputedStyle(panel);
      const height = Math.ceil(
        node.getBoundingClientRect().height +
          Number.parseFloat(padding.paddingTop) +
          Number.parseFloat(padding.paddingBottom),
      );
      workbench.style.setProperty("--line-panel-height", `${height}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => {
      observer.disconnect();
      workbench.style.removeProperty("--line-panel-height");
    };
  }, []);
  return <div ref={ref}>{children}</div>;
}

export const previews = {
  funnel: ({ variant }: PreviewProps) => (
    <Frame>
      <Checkout state={variant === "loading" ? "loading" : "ready"} />
    </Frame>
  ),
  "funnel-pipeline": () => (
    <Frame>
      <Pipeline />
    </Frame>
  ),
  "funnel-comparison": () => (
    <Frame>
      <Comparison />
    </Frame>
  ),
  "funnel-orientation": ({ variant }: PreviewProps) => (
    <Frame>
      <Workflow orientation={variant === "vertical" ? "vertical" : "horizontal"} />
    </Frame>
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
