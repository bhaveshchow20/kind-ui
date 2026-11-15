"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

export function PreviewPanelFrame({ children }: { children: ReactNode }) {
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
