import assert from "node:assert/strict";

/** The proof may copy host compositions, never library implementation. @param {string} source */
export function assertLineConsumerSource(source) {
  const allowed = new Set([
    "@kind-ui/charts",
    "react",
    "motion/react",
    "react-dom/client",
    "react-dom",
    "recharts",
    "./host.js",
    "./selection-host.js",
    "./performance-host.js",
    "./presentation.js",
    "./use-reduced-motion.js",
    "./presentation.css",
  ]);
  for (const match of source.matchAll(/(?:from\s*|import\s*\(?\s*)["']([^"']+)["']/g)) {
    assert.ok(match[1], "Expected an import specifier");
    assert.ok(allowed.has(match[1]), `Disallowed line consumer import: ${match[1]}`);
  }
  assert.ok(
    !source.includes("import.meta"),
    "Line consumer cannot resolve workspace implementation",
  );
}

/** Complete application compositions use one chart import source. @param {string} source */
export function assertCompositionConsumerSource(source) {
  assertLineConsumerSource(source);
  for (const match of source.matchAll(/(?:from\s*|import\s*\(?\s*)["']([^"']+)["']/g)) {
    assert.notEqual(
      match[1],
      "recharts",
      "Complete composition must import chart parts from @kind-ui/charts",
    );
  }
}
