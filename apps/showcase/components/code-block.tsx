"use client";

import { lazy, Suspense } from "react";
import { useTheme } from "next-themes";
const HighlightedCode = lazy(() => import("@/components/highlighted-code"));

export function CodeBlock({ code }: { code: string }) {
  const { resolvedTheme } = useTheme();
  return <div className="highlighted-code">
    <Suspense fallback={<pre aria-busy="true"><code>{code}</code></pre>}>
      <HighlightedCode code={code} theme={resolvedTheme === "dark" ? "github-dark" : "github-light"}/>
    </Suspense>
  </div>;
}
