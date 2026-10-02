import assert from "node:assert/strict";
import test from "node:test";
import { assertLineConsumerSource } from "./line-consumer-contract.mjs";

test("line proof accepts public package and host dependencies", () => {
  assertLineConsumerSource(
    'import { LineSeries } from "@kind-ui/charts"; import "@kind-ui/charts/styles.css"; import { useReducedMotionPreference } from "./use-reduced-motion.js";',
  );
});
for (const specifier of [
  "@kind-ui/charts/motion",
  "./line-recipes.js",
  "../../packages/charts/src/line-chart.tsx",
  "@kind-ui/charts/dist/index.js",
  "@/charts",
  "file:///workspace/kind-ui/examples/chart/line-motion.tsx",
]) {
  test(`line proof rejects ${specifier}`, () => {
    assert.throws(
      () => assertLineConsumerSource(`import { LineChart } from "${specifier}";`),
      /Disallowed/,
    );
    assert.throws(() => assertLineConsumerSource(`await import("${specifier}");`), /Disallowed/);
  });
}
