import assert from "node:assert/strict";
import test from "node:test";
import * as Chart from "@kind-ui/charts";
import { Legend, Root, TooltipContent } from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("direct and namespace imports expose the same public components", () => {
  assert.deepEqual(Object.keys(Chart).sort(), [
    "AreaChart",
    "AreaSeries",
    "BarChart",
    "BarSeries",
    "Legend",
    "LineChart",
    "LineSeries",
    "Root",
    "Tooltip",
    "TooltipContent",
  ]);
  assert.equal(Chart.Root, Root);
  assert.equal(Chart.Legend, Legend);
  assert.equal(Chart.TooltipContent, TooltipContent);
});

const config = {
  count: { label: "Tasks", color: "#2563eb", formatValue: (value) => `${value} tasks` },
};
const entry = (value, extra = {}) => ({
  dataKey: "count",
  name: "count",
  value,
  graphicalItemId: "count",
  ...extra,
});
const tooltip = (payload, extra = {}) => ({
  active: true,
  payload,
  label: "Monday",
  accessibilityLayer: true,
  activeIndex: "0",
  coordinate: undefined,
  ...extra,
});
const content = (payload, extra = {}) =>
  render(
    h(
      Root,
      { config },
      h(TooltipContent, {
        tooltip: tooltip(payload, extra),
        id: "tip",
        "data-owner": "consumer",
      }),
    ),
  );

test("zero uses the series formatter; null and undefined remain missing", () => {
  assert.match(content([entry(0)]), /0 tasks/);
  assert.doesNotMatch(content([entry(null)]), /data-kind-ui="chart-tooltip"/);
  assert.doesNotMatch(content([entry(undefined)]), /data-kind-ui="chart-tooltip"/);
  assert.match(content([entry(null), entry(0, { graphicalItemId: "other" })]), /No data/);
  assert.doesNotMatch(content([entry(null)]), /null tasks/);
});
test("upstream formatter, tuple label and label formatter remain usable", () => {
  const html = content([entry(0)], {
    formatter: (value) => [`${value}%`, "Custom"],
    labelFormatter: () => "Custom day",
  });
  assert.match(html, /0%/);
  assert.match(html, /Custom day/);
  assert.match(html, /Custom/);
});
test("hidden, type-none, inactive and consumer-hidden entries are omitted", () => {
  assert.doesNotMatch(content([entry(9, { hide: true })]), /9 tasks/);
  assert.doesNotMatch(content([entry(9, { type: "none" })]), /9 tasks/);
  assert.doesNotMatch(content([entry(9)], { active: false }), /9 tasks/);
  const html = render(
    h(Root, { config, visibleSeries: [] }, h(TooltipContent, { tooltip: tooltip([entry(9)]) })),
  );
  assert.doesNotMatch(html, /9 tasks/);
});
test("content preserves live-region semantics and forwards DOM props", () => {
  const html = content([entry(4)]);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="assertive"/);
  assert.match(html, /id="tip"/);
  assert.match(html, /data-owner="consumer"/);
  assert.doesNotMatch(html, /accessibilityLayer=|graphicalItemId=|activeIndex=/);
});
test("legend is static by default, controlled when requested, and container colors are scoped", () => {
  const html = render(
    h(Root, { config, id: "scope", className: "custom" }, h(Legend, { id: "legend" })),
  );
  assert.match(html, /--color-count:#2563eb/);
  assert.match(html, /id="legend"/);
  assert.doesNotMatch(html, /<button/);
  const hidden = render(
    h(Root, { config, visibleSeries: [], onVisibleSeriesChange() {} }, h(Legend)),
  );
  assert.match(hidden, /aria-pressed="false"/);
});
test("invalid composition and keys have actionable errors", () => {
  assert.throws(() => render(h(Legend)), /inside Root/);
  assert.throws(
    () => render(h(Root, { config, onVisibleSeriesChange() {} })),
    /requires visibleSeries/,
  );
  assert.throws(() => render(h(Root, { config: { "bad key": config.count } })), /Chart series key/);
});

test("upstream null formatter suppresses an entry and per-entry formatters take precedence", () => {
  assert.doesNotMatch(
    content([entry(1, { formatter: () => null }), entry(null, { graphicalItemId: "missing" })]),
    /data-kind-ui="chart-tooltip"/,
  );
  assert.doesNotMatch(
    content([entry(1)], { formatter: () => null }),
    /data-kind-ui="chart-tooltip"/,
  );
  assert.doesNotMatch(
    content([entry(1)], { formatter: () => undefined }),
    /data-kind-ui="chart-tooltip"/,
  );
  assert.match(
    content([entry(0, { formatter: () => "entry format" })], { formatter: () => "global format" }),
    /entry format/,
  );
});
test("unknown prototype-named keys use upstream metadata without inherited config", () => {
  for (const dataKey of ["constructor", "toString"]) {
    const html = content([entry(1, { dataKey, name: "Unknown", color: "#f00" })]);
    assert.match(html, /Unknown/);
    assert.match(html, /--kind-ui-chart-indicator-color:#f00/);
    assert.doesNotMatch(html, new RegExp(`var\\(--color-${dataKey}`));
  }
});

test("line components reject missing composition boundaries", () => {
  assert.throws(() => render(h(Chart.Tooltip)), /inside LineChart/);
  assert.throws(
    () => render(h(Root, { config }, h(Chart.LineSeries, { dataKey: "count" }))),
    /inside LineChart/,
  );
});

test("area composition requires Root and a chart interaction boundary", () => {
  assert.throws(
    () => render(h(Root, { config }, h(Chart.AreaSeries, { dataKey: "count" }))),
    /inside LineChart/,
  );
});

test("category itemKey resolves metadata, zero, formatting and visibility independently of dataKey", () => {
  const payload = [entry(0, { payload: { id: "category" }, name: "Native name" })];
  const categoryConfig = {
    category: { label: "Category label", color: "red", formatValue: (v) => `${v} members` },
  };
  const renderCategory = (visibleSeries) =>
    render(
      h(
        Root,
        { config: categoryConfig, visibleSeries },
        h(TooltipContent, {
          tooltip: tooltip(payload),
          itemKey: (item) => item.payload.id,
        }),
      ),
    );
  assert.match(renderCategory(["category"]), /Category label/);
  assert.match(renderCategory(["category"]), /0 members/);
  assert.match(renderCategory(["category"]), /data-series="category"/);
  assert.doesNotMatch(renderCategory(["count"]), /chart-tooltip/);
  assert.doesNotMatch(renderCategory(["category"]), /itemKey=/);
});

const Icon = () => h("svg", { "data-icon": "task" }, h("title", {}, "Decorative task"));
const iconConfig = { ...config, count: { ...config.count, icon: Icon } };
const optionContent = (options = {}, extra = {}) =>
  render(
    h(
      Root,
      { config: iconConfig },
      h(TooltipContent, { tooltip: tooltip([entry(0)], extra), ...options }),
    ),
  );
test("tooltip icon takes precedence; hiding decoration preserves value and live feedback", () => {
  for (const indicator of ["dot", "line", "dashed"]) {
    const html = optionContent({ indicator });
    assert.match(html, /aria-hidden="true" data-kind-ui="chart-icon"/);
    assert.match(html, /data-icon="task"/);
    assert.doesNotMatch(html, /data-kind-ui="chart-indicator"/);
    assert.match(html, /0 tasks/);
  }
  const hidden = optionContent({ hideIndicator: true, hideLabel: true });
  assert.doesNotMatch(
    hidden,
    /data-kind-ui="chart-icon"|data-kind-ui="chart-indicator"|chart-tooltip-label/,
  );
  assert.match(hidden, /role="status"/);
  assert.match(hidden, /Tasks/);
  assert.match(hidden, /0 tasks/);
  assert.doesNotMatch(hidden, /hideLabel=|hideIndicator=|indicator=/);
});
test("indicator choices, missing/unknown metadata and header formatters remain independent", () => {
  for (const indicator of ["dot", "line", "dashed"]) {
    const html = render(
      h(Root, { config }, h(TooltipContent, { tooltip: tooltip([entry(0)]), indicator })),
    );
    assert.match(html, new RegExp(`data-indicator="${indicator}"`));
    assert.match(html, /aria-hidden="true"/);
  }
  assert.match(content([entry(0)]), /data-indicator="line"/);
  assert.match(optionContent({}, { labelFormatter: () => "Formatted day" }), /Formatted day/);
  assert.doesNotMatch(
    optionContent(
      { hideLabel: true },
      {
        labelFormatter: () => {
          throw new Error("Hidden heading must not format");
        },
      },
    ),
    /chart-tooltip-label/,
  );
  assert.match(
    optionContent({}, { formatter: () => ["Formatted zero", "Tuple label"] }),
    /Tuple label/,
  );
  assert.doesNotMatch(optionContent({}, { formatter: () => null }), /chart-tooltip/);
});
test("legend icon fallback and composed noninteractive contents retain controlled semantics", () => {
  const legend = (props = {}, root = {}) =>
    render(h(Root, { config: iconConfig, ...root }, h(Legend, props)));
  assert.match(legend(), /data-icon="task"/);
  assert.doesNotMatch(legend({ hideIcon: true }), /data-icon="task"/);
  assert.match(legend({ hideIcon: true }), /chart-indicator/);
  const html = legend(
    {
      children: ({ key, label, visible, marker }) =>
        h("span", {}, marker, `${key}: ${label} ${visible ? "Shown" : "Hidden"}`),
    },
    { visibleSeries: [], onVisibleSeriesChange() {} },
  );
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /count: Tasks Hidden/);
  assert.equal((html.match(/<button/g) ?? []).length, 1);
  assert.doesNotMatch(html, /hideIcon=/);
});
test("category itemKey resolves icon, formatting, zero and hidden state together", () => {
  const category = entry(0, { dataKey: "amount", payload: { category: "count" } });
  const props = {
    tooltip: tooltip([category]),
    itemKey: (entry) => entry.payload.category,
    indicator: "dashed",
  };
  const html = render(
    h(Root, { config: iconConfig, visibleSeries: ["count"] }, h(TooltipContent, props)),
  );
  assert.match(html, /data-series="count"/);
  assert.match(html, /data-icon="task"/);
  assert.match(html, /0 tasks/);
  assert.doesNotMatch(
    render(h(Root, { config: iconConfig, visibleSeries: [] }, h(TooltipContent, props))),
    /chart-tooltip/,
  );
});
