import assert from "node:assert/strict";

/** The proof may copy host fixtures, never library/example implementation. */
export function assertLineConsumerSource(source) {
  const allowed = new Set([
    "@kind-ui/charts",
    "@kind-ui/charts/styles.css",
    "react",
    "react-dom/client",
    "recharts",
    "./host.js",
  ]);
  for (const match of source.matchAll(/(?:from\s*|import\s*\(?\s*)["']([^"']+)["']/g)) {
    assert.ok(allowed.has(match[1]), `Disallowed line consumer import: ${match[1]}`);
  }
  assert.ok(
    !source.includes("import.meta"),
    "Line consumer cannot resolve workspace implementation",
  );
}
