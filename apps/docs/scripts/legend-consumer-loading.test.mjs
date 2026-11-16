import assert from "node:assert/strict";
import test from "node:test";
import { loadingConsumerLabel, loadingConsumerProp } from "./legend-consumer-loading.mjs";

test("independent loading uses the boolean prop and leaves metric defaults untouched", () => {
  const family = { id: "treemap", loadingVariant: { prop: "loading", default: false } };
  const control = {
    prop: "metric",
    default: "return",
    options: [{ value: "return" }, { value: "activity" }],
  };
  const before = structuredClone(control);
  assert.equal(loadingConsumerProp(family, control), "loading={pending}");
  assert.deepEqual(control, before);
  assert.doesNotMatch(loadingConsumerProp(family, control), /metric|return|activity/);
});

test("existing native variants keep their loading and ready alternatives", () => {
  assert.equal(
    loadingConsumerProp(
      { id: "line" },
      { prop: "variant", default: "line", options: [{ value: "line" }, { value: "loading" }] },
    ),
    'variant={pending ? "loading" : "line"}',
  );
  assert.throws(() => loadingConsumerProp({ id: "line" }, undefined), /native loading control/);
  assert.throws(
    () =>
      loadingConsumerProp(
        { id: "line" },
        { prop: "variant", default: "line", options: [{ value: "line" }] },
      ),
    /native loading variant/,
  );
  assert.throws(
    () =>
      loadingConsumerProp(
        { id: "treemap", loadingVariant: { prop: "loading", default: true } },
        undefined,
      ),
    /start ready/,
  );
});

test("loading status checks use the example's supplied accessible label", () => {
  assert.equal(
    loadingConsumerLabel(
      '<TreemapChart loading={loading} loadingLabel="Loading market comparison" />',
    ),
    "Loading market comparison",
  );
  assert.equal(
    loadingConsumerLabel("<LineChart loadingLabel='Loading monthly production' />"),
    "Loading monthly production",
  );
  assert.equal(loadingConsumerLabel("<TreemapChart loading={loading} />"), "Loading chart");
});
