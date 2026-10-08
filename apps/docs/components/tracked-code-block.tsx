"use client";

import { CodeBlock, type CodeBlockProps } from "fumadocs-ui/components/codeblock";
import { type ReactNode, useEffect, useRef } from "react";

function CopyActions({ className, children }: { className?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // The pinned Fumadocs copy button marks data-checked after writeText succeeds.
    // Observe only that status; never inspect or transmit the code itself.
    const observer = new MutationObserver((changes) => {
      for (const change of changes) {
        if (
          change.target instanceof HTMLButtonElement &&
          change.target.hasAttribute("data-checked")
        ) {
          window.dispatchEvent(new CustomEvent("kind-ui-copy", { detail: "code" }));
        }
      }
    });
    observer.observe(element, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-checked"],
    });
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function TrackedCodeBlock(props: CodeBlockProps) {
  return <CodeBlock {...props} Actions={CopyActions} />;
}
