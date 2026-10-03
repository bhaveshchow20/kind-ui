"use client";
import { useShikiHighlighter } from "react-shiki/web";
export default function HighlightedCode({
  code,
  theme,
}: {
  code: string;
  theme: "github-light" | "github-dark";
}) {
  const highlighted = useShikiHighlighter(code, "tsx", theme, { showLineNumbers: true });
  return (
    <>
      {highlighted ?? (
        <pre aria-busy="true">
          <code>{code}</code>
        </pre>
      )}
    </>
  );
}
