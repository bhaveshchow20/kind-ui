import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertCompositionConsumerSource,
  assertLineConsumerSource,
} from "./line-consumer-contract.mjs";

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

test("complete compositions reject a second chart import source", () => {
  assertCompositionConsumerSource(
    'import * as Chart from "@kind-ui/charts"; import { XAxis, type XAxisProps } from "@kind-ui/charts";',
  );
  assert.throws(
    () => assertCompositionConsumerSource('import { XAxis } from "recharts";'),
    /Complete composition/,
  );
  assert.throws(
    () => assertCompositionConsumerSource('await import("recharts");'),
    /Complete composition/,
  );
});

test("bar pattern fixture wiring stays inside the public host import guard", () => {
  for (const file of ["main.tsx", "host.tsx"]) {
    assertCompositionConsumerSource(
      readFileSync(new URL(`../tests/fixtures/bar/${file}`, import.meta.url), "utf8"),
    );
  }
  for (const specifier of ["react-dom/server", "./patterns.js"]) {
    assert.throws(
      () => assertLineConsumerSource(`import * as Host from "${specifier}";`),
      /Disallowed/,
    );
  }
});

test("theme color fixture wiring stays inside the public host import guard", () => {
  for (const file of ["main.tsx", "host.tsx"]) {
    assertCompositionConsumerSource(
      readFileSync(new URL(`../tests/fixtures/identity-colors/${file}`, import.meta.url), "utf8"),
    );
  }
});

test("area pattern fixture wiring stays inside the public host import guard", () => {
  for (const file of ["static.tsx", "motion.tsx", "host.tsx"]) {
    assertCompositionConsumerSource(
      readFileSync(new URL(`../tests/fixtures/area/${file}`, import.meta.url), "utf8"),
    );
  }
});
import "./line-dash-source.test.mjs";
