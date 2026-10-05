"use client";

import { useTheme } from "next-themes";
import { Component, lazy, type ReactNode, Suspense } from "react";

const HighlightedCode = lazy(() => import("@/components/highlighted-code"));

class HighlightBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function CodeBlock({ code }: { code: string }) {
  const { resolvedTheme } = useTheme();
  const plainCode = (
    <pre>
      <code>{code}</code>
    </pre>
  );
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: The scrollable code region needs keyboard access.
    <section className="highlighted-code" tabIndex={0} aria-label="Chart example code">
      <HighlightBoundary fallback={plainCode}>
        <Suspense fallback={plainCode}>
          <HighlightedCode
            code={code}
            theme={resolvedTheme === "dark" ? "github-dark" : "github-light"}
          />
        </Suspense>
      </HighlightBoundary>
    </section>
  );
}
