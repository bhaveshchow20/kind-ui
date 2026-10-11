import assert from "node:assert/strict";
import test from "node:test";
import { componentBundleFor, componentBundlesSchema } from "../lib/component-bundles.server.mjs";

function fixture() {
  return {
    line: {
      id: "line",
      title: "Line Chart",
      family: "line",
      files: { "src/examples/line/example.tsx": "export function Example() {}" },
      packageStatus: "published",
      localPackage: false,
      version: "0.4.0",
      acceptance: "Keyboard accessible",
      variants: { linear: { label: "Linear", source: "export function Example() {}" } },
      defaultVariant: "linear",
      variantControl: "Curve",
      dataAlternative: {
        caption: "Values",
        columns: { day: "Day", value: "Value" },
        rows: [{ day: "Monday", value: 0 }],
      },
    },
  };
}

test("generated component metadata keeps valid examples, variants and zero-valued alternatives", () => {
  const input = fixture();
  const bundles = componentBundlesSchema.parse(input);
  assert.deepEqual(componentBundleFor(bundles, "line"), input.line);
});

for (const [name, mutate] of [
  [
    "incorrect id",
    (bundle) => {
      bundle.id = "bar";
    },
  ],
  [
    "missing source",
    (bundle) => {
      bundle.files = {};
    },
  ],
  [
    "non-string file",
    (bundle) => {
      bundle.files["src/examples/line/example.tsx"] = null;
    },
  ],
  [
    "malformed variant",
    (bundle) => {
      bundle.variants.linear.source = [];
    },
  ],
  [
    "unknown default variant",
    (bundle) => {
      bundle.defaultVariant = "absent";
    },
  ],
  [
    "malformed alternative",
    (bundle) => {
      bundle.dataAlternative.rows[0].value = null;
    },
  ],
]) {
  test(`generated component metadata rejects ${name}`, () => {
    const input = fixture();
    mutate(input.line);
    assert.throws(() => componentBundlesSchema.parse(input));
  });
}

test("requested component metadata must exist and match the requested preview id", () => {
  const bundles = componentBundlesSchema.parse(fixture());
  assert.throws(() => componentBundleFor(bundles, "bar"), /Missing matching/);
  assert.throws(() => componentBundleFor({ bar: bundles.line }, "bar"), /Missing matching/);
});
