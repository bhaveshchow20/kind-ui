"use client";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { PrimitiveId } from "@/lib/primitives/catalog";
import { PreviewCode } from "../preview-code";

function Loading() {
  return <p role="status">Loading preview…</p>;
}
const previews = {
  button: dynamic(() => import("@/examples/primitives/button"), { loading: Loading, ssr: false }),
  textarea: dynamic(() => import("@/examples/primitives/textarea"), {
    loading: Loading,
    ssr: false,
  }),
  avatar: dynamic(() => import("@/examples/primitives/avatar"), { loading: Loading, ssr: false }),
  tooltip: dynamic(() => import("@/examples/primitives/tooltip"), { loading: Loading, ssr: false }),
  popover: dynamic(() => import("@/examples/primitives/popover"), { loading: Loading, ssr: false }),
  menu: dynamic(() => import("@/examples/primitives/menu"), { loading: Loading, ssr: false }),
  collapsible: dynamic(() => import("@/examples/primitives/collapsible"), {
    loading: Loading,
    ssr: false,
  }),
  badge: dynamic(() => import("@/examples/primitives/badge"), { loading: Loading, ssr: false }),
  status: dynamic(() => import("@/examples/primitives/status"), { loading: Loading, ssr: false }),
  "code-block": dynamic(() => import("@/examples/primitives/code-block"), {
    loading: Loading,
    ssr: false,
  }),
  table: dynamic(() => import("@/examples/primitives/table"), { loading: Loading, ssr: false }),
  dialog: dynamic(() => import("@/examples/primitives/dialog"), { loading: Loading, ssr: false }),
  combobox: dynamic(() => import("@/examples/primitives/combobox"), {
    loading: Loading,
    ssr: false,
  }),
  "hover-card": dynamic(() => import("@/examples/primitives/hover-card"), {
    loading: Loading,
    ssr: false,
  }),
};
export function PrimitivePlayground({
  id,
  title,
  code,
}: {
  id: PrimitiveId;
  title: string;
  code: ReactNode;
}) {
  const Preview = previews[id];
  return (
    <PreviewCode
      title={title}
      data-component={id}
      id="component-preview"
      className="primitive-workbench"
      preview={
        <div className="primitive-preview not-prose">
          <Preview />
        </div>
      }
      code={code}
    />
  );
}
