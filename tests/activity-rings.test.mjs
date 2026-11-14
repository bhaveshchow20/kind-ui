import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRings, RadialBarChart, Root } from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const config = {
  move: { label: "Move", color: "red", formatValue: (value) => `${value} kcal` },
  exercise: { label: "Exercise", color: "green" },
  stand: { label: "Stand", color: "blue" },
};
const defaults = {
  config,
  rings: [
    { key: "move", value: 75 },
    { key: "exercise", value: 30 },
  ],
  "aria-label": "Daily activity",
};
test("rings own context and preserve accessible names, original values and consumer description", () => {
  const html = render(h(ActivityRings, { ...defaults, "aria-describedby": "explanation" }));
  assert.match(html, /data-kind-ui="chart"/);
  assert.match(html, /<dt>Move<\/dt><dd>75 kcal<\/dd>/);
  assert.match(html, /<dt>Exercise<\/dt><dd>30<\/dd>/);
  assert.match(html, /chart-legend/);
  assert.doesNotMatch(html, /<button/);
});
test("config subset and order follow the ring data; empty rings remain valid", () => {
  const html = render(h(ActivityRings, { ...defaults, rings: [...defaults.rings].reverse() }));
  assert.ok(html.indexOf("Exercise") < html.indexOf("Move"));
  assert.doesNotMatch(html, /Stand/);
  assert.doesNotMatch(
    render(h(ActivityRings, { ...defaults, rings: [], legend: false })),
    /chart-legend/,
  );
});
for (const [label, props, error] of [
  ["missing accessible name", { "aria-label": undefined }, /requires aria-label/],
  ["blank accessible name", { "aria-label": " " }, /requires aria-label/],
  ["unknown identity", { rings: [{ key: "missing", value: 1 }] }, /must exist in config/],
  ["duplicate identity", { rings: [defaults.rings[0], defaults.rings[0]] }, /must be unique/],
  ["NaN value", { rings: [{ key: "move", value: NaN }] }, /finite numbers/],
  ["infinite value", { rings: [{ key: "move", value: Infinity }] }, /finite numbers/],
  ["zero domain", { domain: [0, 0] }, /finite increasing/],
  ["descending domain", { domain: [10, 0] }, /finite increasing/],
  ["overflow domain", { domain: [-Number.MAX_VALUE, Number.MAX_VALUE] }, /finite increasing/],
  [
    "nonfinite ring domain",
    { rings: [{ key: "move", value: 1, domain: [0, Infinity] }] },
    /finite increasing/,
  ],
])
  test(`rings reject ${label}`, () =>
    assert.throws(() => render(h(ActivityRings, { ...defaults, ...props })), error));
test("native composition remains consumer-owned", () => {
  assert.throws(() => render(h(Root, { config }, h(ActivityRings, defaults))), /owns Root/);
  const html = render(
    h(Root, { config }, h(RadialBarChart, { data: [], width: 300, height: 300 })),
  );
  assert.doesNotMatch(html, /chart-instructions|chart-legend|activity-rings/);
});
