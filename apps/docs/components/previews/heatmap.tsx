"use client";
import dynamic from "next/dynamic";
import { type ComponentType, memo, type ReactNode, useLayoutEffect, useRef } from "react";
import type { PreviewProps } from "./types";

function Loading() {
  return (
    <p className="component-loading" role="status">
      Loading chart…
    </p>
  );
}
const Support = dynamic(
  () => import("@/examples/heatmap/example").then((m) => memo(m.SupportHeatmap)),
  {
    loading: Loading,
    ssr: false,
  },
);
const Regional = dynamic(
  () => import("@/examples/heatmap-diverging/example").then((m) => memo(m.RegionalHeatmap)),
  {
    loading: Loading,
    ssr: false,
  },
);
const Material = dynamic(
  () => import("@/examples/heatmap-materials/example").then((m) => memo(m.MaterialHeatmap)),
  {
    loading: Loading,
    ssr: false,
  },
);
// Native matrices and their in-flow tooltips determine the shared Preview/Code height.
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
const Compact = dynamic(
  () => import("@/examples/heatmap-compact/example").then((m) => memo(m.CompactActivityHeatmap)),
  { loading: Loading, ssr: false },
);
export const previews = {
  "heatmap-compact": () => (
    <Frame>
      <div className="not-prose">
        <Compact />
      </div>
    </Frame>
  ),

  heatmap: ({ variant }: PreviewProps) => (
    <Frame>
      <Support state={variant as "ready" | "loading"} />
    </Frame>
  ),
  "heatmap-diverging": () => (
    <Frame>
      <Regional />
    </Frame>
  ),
  "heatmap-materials": ({ variant }: PreviewProps) => (
    <Frame>
      <Material appearance={variant as "default" | "clay" | "glow"} />
    </Frame>
  ),
} satisfies Record<string, ComponentType<PreviewProps>>;
