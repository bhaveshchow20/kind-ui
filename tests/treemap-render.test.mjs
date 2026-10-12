import assert from "node:assert/strict";
import test from "node:test";
import { TreemapChart, useTreemap } from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const data = [
  {
    id: "g",
    kind: "group",
    label: "Group",
    children: [
      { id: "a", kind: "leaf", label: "Same", value: 6 },
      { id: "b", kind: "leaf", label: "Same", value: 3 },
      { id: "zero", kind: "leaf", label: "Zero", value: 0 },
    ],
  },
  { id: "c", kind: "leaf", label: "Outside", value: 1 },
];
const base = { data, config: {}, "aria-label": "Allocation", width: 400, height: 300 };
const chart = (children, props = {}) => h(TreemapChart, { ...base, ...props }, children);

test("TreemapChart owns its frame and renders only explicit parts", () => {
  const html = render(chart(null));
  assert.equal((html.match(/data-kind-ui="chart"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /treemap-tile|treemap-label|treemap-color-legend/);
  assert.throws(() => render(h(TreemapChart, base)), /explicit children/);
  assert.throws(() => render(chart(null, { config: undefined })), /requires config/);
  assert.throws(() => render(chart(null, { "aria-label": " " })), /aria-label/);
  assert.throws(() => render(h(TreemapChart.Tiles)), /require TreemapChart/);
});

test("treemap glyphs exclude zero area, retain stable IDs and include group headers", () => {
  const html = render(
    chart([
      h(TreemapChart.Groups, { key: "groups" }),
      h(TreemapChart.Tiles, { key: "tiles" }),
      h(TreemapChart.Labels, { key: "labels" }),
    ]),
  );
  assert.equal((html.match(/data-kind-ui="treemap-tile"/g) ?? []).length, 3);
  assert.match(html, /data-kind-ui="treemap-group-header"/);
  assert.doesNotMatch(html, /data-node-id="zero"/);
  assert.equal((html.match(/data-kind-ui="treemap-label"/g) ?? []).length, 2);
  assert.match(html, /data-node-id="a"/);
  assert.match(html, /Same: 6/);
});

test("treemap native tile props preserve children unless an explicit renderer overrides them", () => {
  const tileProps = (node) => ({ children: h("strong", null, `Native tile ${node.id}`) });
  const native = render(chart(h(TreemapChart.Tiles, { tileProps })));
  for (const id of ["a", "b", "c"]) assert.match(native, new RegExp(`Native tile ${id}`));
  const explicit = render(
    chart(h(TreemapChart.Tiles, { tileProps }, (node) => `Rendered tile ${node.id}`)),
  );
  assert.match(explicit, /Rendered tile a/);
  assert.doesNotMatch(explicit, /Native tile/);
  const empty = render(chart(h(TreemapChart.Tiles, { tileProps }, null)));
  assert.doesNotMatch(empty, /Native tile/);
});

test("treemap native header and group props preserve content without an explicit renderer", () => {
  const props = {
    headerProps: () => ({ children: h("strong", null, "Native header content") }),
    groupProps: () => ({ children: h("span", null, "Native group content") }),
  };
  const native = render(chart(h(TreemapChart.Groups, props)));
  assert.match(native, /Native header content/);
  assert.match(native, /Native group content/);
  const explicit = render(chart(h(TreemapChart.Groups, props, () => "Rendered group content")));
  assert.match(explicit, /Rendered group content/);
  assert.doesNotMatch(explicit, /Native (?:header|group) content/);
});

test("treemap categorical legend retains six equal-display groups through reorder", () => {
  const repeated = Array.from({ length: 6 }, (_, index) => ({
    kind: "group",
    id: `group-${index}`,
    label: "Same",
    children: [{ kind: "leaf", id: `leaf-${index}`, label: "Same", value: 1 }],
  }));
  for (const hierarchy of [repeated, [...repeated].reverse()]) {
    render(
      chart(
        h(Capture, {
          check(context) {
            const legend = context.colors.legend;
            assert.equal(legend.type, "categorical");
            assert.equal(legend.items.length, 6);
            assert.deepEqual(
              legend.items.map((item) => item.label),
              Array(6).fill("Same"),
            );
            assert.equal(legend.items[0].color, legend.items[5].color);
          },
        }),
        { data: hierarchy },
      ),
    );
  }
});

function Capture({ check }) {
  check(useTreemap());
  return null;
}

test("typed context keeps all records and bounded nested geometry with explicit shares", () => {
  render(
    chart(
      h(Capture, {
        check(context) {
          assert.equal(context.model.byId.get("zero").datum, data[0].children[2]);
          assert.equal(context.items.get("zero").rectangle, null);
          assert.equal(context.items.get("a").viewShare, 0.6);
          const parent = context.rectangles.find((node) => node.id === "g");
          for (const node of context.rectangles) {
            assert.ok(node.x >= 0 && node.y >= 0);
            assert.ok(node.x + node.width <= 400.001);
            assert.ok(node.y + node.height <= 300.001);
            if (node.parentId === "g") {
              assert.ok(node.x >= parent.x);
              assert.ok(node.y >= parent.y + 20);
              assert.ok(node.x + node.width <= parent.x + parent.width + 0.001);
              assert.ok(node.y + node.height <= parent.y + parent.height + 0.001);
            }
          }
        },
      }),
    ),
  );
});

test("view changes use subtree area while root and parent shares preserve supplied denominators", () => {
  render(
    chart(
      h(Capture, {
        check(context) {
          assert.equal(context.viewId, "g");
          assert.equal(context.items.get("a").viewShare, 6 / 9);
          assert.equal(context.items.get("a").rootShare, 0.6);
          assert.equal(context.items.get("a").parentShare, 6 / 9);
          assert.equal(context.items.get("g").viewShare, 1);
          assert.equal(context.items.get("g").rectangle, null);
          assert.equal(context.items.get("ancestor").viewShare, null);
          assert.equal(context.items.get("ancestor").rectangle, null);
          assert.equal(context.items.get("c").viewShare, null);
          assert.equal(context.items.get("c").rectangle, null);
        },
      }),
      {
        viewId: "g",
        data: [{ id: "ancestor", kind: "group", label: "Ancestor", children: [data[0]] }, data[1]],
      },
    ),
  );
  render(
    chart(
      h(Capture, {
        check(context) {
          assert.equal(context.items.get("g").value, 0);
          assert.equal(context.items.get("g").viewShare, null);
          assert.equal(context.items.get("g").rectangle, null);
          assert.equal(context.items.get("zero").viewShare, null);
        },
      }),
      {
        viewId: "g",
        data: [
          { id: "g", kind: "group", label: "Zero group", children: [data[0].children[2]] },
          data[1],
        ],
      },
    ),
  );
});

test("visible depth produces actionable group tiles without drawing descendants", () => {
  const html = render(chart(h(TreemapChart.Tiles), { depth: 1 }));
  assert.match(html, /data-node-id="g"/);
  assert.match(html, /open group/);
  assert.doesNotMatch(html, /data-node-id="a"/);
});

test("layout padding, depth and label fit inputs reject malformed values", () => {
  for (const props of [
    { padding: -1 },
    { groupHeaderHeight: Infinity },
    { depth: 0 },
    { depth: 1.5 },
  ]) {
    assert.throws(() => render(chart(null, props)), /finite|positive integer/);
  }
  assert.throws(() => render(chart(h(TreemapChart.Labels, { minWidth: -1 }))), /finite/);
});

test("loading hides real marks, supplies shared status and empty input supplies a meaningful state", () => {
  const loading = render(
    chart(h(TreemapChart.Tiles), { loading: true, loadingLabel: "Loading allocation" }),
  );
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /chart-loading-skeleton/);
  assert.match(loading, /Loading allocation/);
  assert.match(loading, /inert=""/);
  assert.match(
    render(chart(h(TreemapChart.Tiles), { data: [], empty: "No allocation" })),
    /No allocation/,
  );
});

test("leaf labels fit only when the caller's minimum rectangle is available", () => {
  const html = render(chart(h(TreemapChart.Labels, { minWidth: 500 })));
  assert.doesNotMatch(html, /data-kind-ui="treemap-label"/);
});

test("stable layout sorts IDs by code units independently of the host locale", () => {
  const ordered = [];
  render(
    chart(
      h(Capture, {
        check(context) {
          ordered.push(...context.rectangles.map((node) => node.id));
        },
      }),
      {
        data: [
          { kind: "leaf", id: "é", label: "Accent", value: 1 },
          { kind: "leaf", id: "a", label: "Lowercase", value: 1 },
          { kind: "leaf", id: "Z", label: "Uppercase", value: 1 },
        ],
      },
    ),
  );
  assert.deepEqual(ordered, ["Z", "a", "é"]);
});

test("Treemap rejects unsupported series visibility instead of silently ignoring it", () => {
  for (const [name, value] of [
    ["visibleSeries", []],
    ["defaultVisibleSeries", []],
    ["onVisibleSeriesChange", () => {}],
  ]) {
    assert.throws(
      () => render(chart(null, { [name]: value })),
      new RegExp(`does not accept ${name}`),
    );
  }
});
