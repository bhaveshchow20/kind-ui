import assert from "node:assert/strict";

/** The proof may copy host compositions, never library implementation. */
export function assertLineConsumerSource(source) {
  const allowed = new Set([
    "@kind-ui/charts",
    "@kind-ui/charts/styles.css",
    "react",
    "react-dom/client",
    "recharts",
    "./host.js",
    "./presentation.js",
    "./use-reduced-motion.js",
    "./presentation.css",
  ]);
  for (const match of source.matchAll(/(?:from\s*|import\s*\(?\s*)["']([^"']+)["']/g)) {
    assert.ok(allowed.has(match[1]), `Disallowed line consumer import: ${match[1]}`);
  }
  assert.ok(
    !source.includes("import.meta"),
    "Line consumer cannot resolve workspace implementation",
  );
}
