import assert from "node:assert/strict";
import test from "node:test";
import { LineChart, Root } from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const config = {
  total: { label: "Total", color: "red" },
  extra: { label: "Extra", color: "blue" },
};
const defaults = { config, data: [], xDataKey: "month", "aria-label": "Totals" };
test("configured line owns Root, native responsive sizing, instructions and uncontrolled legend", () => {
  const html = render(h(LineChart, defaults));
  assert.match(html, /data-kind-ui="chart"/);
  assert.match(html, /kind-ui-configured-line-chart/);
  assert.match(html, /data-kind-ui="chart-instructions"/);
  assert.match(html, /aria-pressed="false"/);
  assert.ok(html.indexOf("Total") < html.indexOf("Extra"));
});
test("controlled read-only and default selections retain correct legend semantics", () => {
  const readOnly = render(h(LineChart, { ...defaults, visibleSeries: ["total"] }));
  assert.match(readOnly, /<button/);
  assert.match(readOnly, /Extra/);
  const selected = render(h(LineChart, { ...defaults, defaultVisibleSeries: [] }));
  assert.equal((selected.match(/aria-pressed="false"/g) ?? []).length, 2);
});
test("explicit null children retain owned context but never generate plot parts", () => {
  const html = render(
    h(LineChart, {
      config,
      data: [],
      // biome-ignore lint/correctness/noChildrenProp: This regression explicitly tests null versus omitted props.
      children: null,
      "aria-label": "Empty",
      legend: false,
      accessibilityLayer: false,
    }),
  );
  assert.match(html, /data-kind-ui="chart"/);
  assert.doesNotMatch(html, /chart-legend|chart-instructions/);
});
test("explicit series identity determines legend subset and order", () => {
  const html = render(h(LineChart, { ...defaults, series: [{ seriesKey: "extra", dataKey: 0 }] }));
  assert.match(html, /Extra/);
  assert.doesNotMatch(html, />Total</);
});
for (const [label, props, message] of [
  ["missing x key", { ...defaults, xDataKey: undefined }, /requires xDataKey/],
  ["missing name", { ...defaults, "aria-label": undefined }, /requires aria-label/],
  ["mixed visibility", { ...defaults, visibleSeries: [], defaultVisibleSeries: [] }, /not both/],
  ["ignored defaults", { ...defaults, children: null }, /replace generated parts/],
  [
    "unknown identity",
    { ...defaults, series: [{ seriesKey: "unknown", dataKey: "total" }] },
    /must exist in config/,
  ],
  [
    "duplicate identity",
    {
      ...defaults,
      series: [
        { seriesKey: "total", dataKey: "total" },
        { seriesKey: "total", dataKey: "extra" },
      ],
    },
    /must be unique/,
  ],
])
  test(`configured line rejects ${label}`, () =>
    assert.throws(() => render(h(LineChart, props)), message));
test("configured line rejects nested Root ownership", () =>
  assert.throws(() => render(h(Root, { config }, h(LineChart, defaults))), /owns Root/));
test("legacy explicit line retains caller Root and has no automatic legend/instructions", () => {
  const html = render(h(Root, { config }, h(LineChart, { width: 300, height: 200 })));
  assert.equal((html.match(/data-kind-ui="chart"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /chart-legend|chart-instructions/);
});

test("explicit configured children reject generated background options at runtime", () => {
  assert.throws(
    () =>
      render(
        h(LineChart, {
          config,
          data: [],
          "aria-label": "Explicit",
          // biome-ignore lint/correctness/noChildrenProp: Explicit null replaces generated parts.
          children: null,
          backgroundPattern: { pattern: "waves" },
        }),
      ),
    /Explicit LineChart children replace generated parts/,
  );
});
