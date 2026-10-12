import assert from "node:assert/strict";
import test from "node:test";
import { resolveTreemapColors } from "@kind-ui/charts";

const leaf = (id, metric, area = 1) => ({
  id,
  label: id,
  kind: "leaf",
  parentId: "group",
  depth: 1,
  path: ["group", id],
  datum: { metric, area },
  value: area,
  children: [],
  rootShare: 0.25,
  parentShare: 0.25,
});
const leaves = [
  leaf("negative", -10, 900),
  leaf("zero", 0, 0),
  leaf("positive", 20, 1),
  leaf("missing", null),
];
const group = {
  ...leaf("group", 999),
  kind: "group",
  parentId: null,
  depth: 0,
  path: ["group"],
  children: leaves,
  value: 902,
};
const nodes = [group, ...leaves];
const value = (datum) => datum.metric;
const stops = [
  { offset: 0, color: "red" },
  { offset: 0.5, color: "white" },
  { offset: 1, color: "green" },
];

test("treemap colors preserve independent signed metrics, zero, and missing readouts", () => {
  const result = resolveTreemapColors(nodes, leaves, { type: "diverging", value, stops });
  assert.deepEqual(result.legend.domain, [-20, 20]);
  assert.equal(result.colors.get("zero").value, 0);
  assert.equal(result.colors.get("zero").color, "white");
  assert.equal(result.colors.get("missing").unknown, true);
  assert.notEqual(result.colors.get("missing").color, result.colors.get("zero").color);
  assert.equal(result.colors.get("negative").value, -10);
  assert.equal(result.colors.get("group").unknown, true);
  assert.equal(group.value, 902);
});

test("treemap fixed domains clamp paint while retaining true outlier values", () => {
  const result = resolveTreemapColors(nodes, leaves, {
    type: "sequential",
    value,
    domain: [-5, 5],
    stops,
    formatValue: (metric) => `${metric} points`,
  });
  assert.equal(result.colors.get("negative").color, "red");
  assert.equal(result.colors.get("positive").color, "green");
  assert.equal(result.colors.get("positive").value, 20);
  assert.equal(result.colors.get("positive").formattedValue, "20 points");
  assert.deepEqual(
    result.legend.ticks.map((tick) => tick.label),
    ["-5 points", "5 points"],
  );
});

test("treemap inferred domains distinguish full-root and current-view scope", () => {
  const root = resolveTreemapColors(nodes, [leaves[1]], { type: "sequential", value });
  const view = resolveTreemapColors(nodes, [leaves[1]], {
    type: "sequential",
    value,
    domainScope: "view",
  });
  assert.deepEqual(root.legend.domain, [-10, 20]);
  assert.deepEqual(view.legend.domain, [0, 0]);
  assert.equal(view.legend.ticks.length, 1);
  assert.match(view.colors.get("zero").color, /50%/);
  assert.deepEqual(
    resolveTreemapColors(nodes, [leaves[3]], { type: "sequential", value, domainScope: "view" })
      .legend.domain,
    [0, 0],
  );
});

test("treemap group color requires an explicit accessor or aggregation", () => {
  const direct = resolveTreemapColors(nodes, leaves, {
    type: "sequential",
    value,
    groupValue: () => 7,
  });
  assert.equal(direct.colors.get("group").value, 7);
  let received;
  const aggregate = resolveTreemapColors(nodes, leaves, {
    type: "sequential",
    value,
    aggregate: (metrics, node) => {
      received = { metrics, id: node.id };
      return 12;
    },
  });
  assert.deepEqual(received, { metrics: [-10, 0, 20, null], id: "group" });
  assert.equal(aggregate.colors.get("group").value, 12);
  assert.throws(
    () =>
      resolveTreemapColors(nodes, leaves, {
        type: "sequential",
        value,
        groupValue: () => 0,
        aggregate: () => 0,
      }),
    /either groupValue or aggregate/,
  );
});

test("treemap thresholds put boundary equality into the upper interval and share legend labels", () => {
  const result = resolveTreemapColors(nodes, leaves, {
    type: "threshold",
    value,
    thresholds: [-10, 0, 20],
    colors: ["black", "red", "white", "green"],
    formatValue: (metric) => `${metric}%`,
  });
  assert.equal(result.colors.get("negative").color, "red");
  assert.equal(result.colors.get("zero").color, "white");
  assert.equal(result.colors.get("positive").color, "green");
  assert.deepEqual(
    result.legend.items.map((item) => item.label),
    ["< -10%", "-10% ≤ value < 0%", "0% ≤ value < 20%", "≥ 20%"],
  );
  assert.deepEqual(result.legend.items[1], {
    color: "red",
    lower: -10,
    upper: 0,
    label: "-10% ≤ value < 0%",
  });
});

test("treemap categorical legends follow declared categories and leave absent values unknown", () => {
  const result = resolveTreemapColors(nodes, leaves, {
    type: "categorical",
    value: (datum) => (datum.metric === 0 ? "neutral" : "unlisted"),
    groupValue: () => "neutral",
    categories: [{ value: "neutral", label: "No change", color: "white" }],
  });
  assert.equal(result.colors.get("zero").formattedValue, "No change");
  assert.equal(result.colors.get("group").color, "white");
  assert.equal(result.colors.get("positive").unknown, true);
  assert.deepEqual(result.legend.items, [{ label: "No change", color: "white" }]);
});

test("treemap custom encodings retain finite metrics and never call custom paint for unknown", () => {
  const called = [];
  const result = resolveTreemapColors(nodes, leaves, {
    type: "custom",
    value,
    color: (metric, node) => {
      called.push(node.id);
      return metric < 0 ? "red" : "green";
    },
    legend: [{ color: "red", label: "Negative" }],
    unknownColor: "gray",
    unknownLabel: "Unavailable",
  });
  assert.deepEqual(called, ["negative", "zero", "positive"]);
  assert.deepEqual(result.colors.get("missing"), {
    color: "gray",
    value: null,
    formattedValue: "Unavailable",
    unknown: true,
  });
  assert.deepEqual(result.legend.items, [{ color: "red", label: "Negative" }]);
  for (const metric of [NaN, Infinity, -Infinity, undefined]) {
    const item = leaf("invalid", metric);
    assert.equal(
      resolveTreemapColors([item], [item], {
        type: "custom",
        value,
        color: () => "red",
      }).colors.get("invalid").unknown,
      true,
    );
  }
});

test("treemap validates domains, stops, thresholds, categories, and paint", () => {
  for (const domain of [
    [2, 1],
    [0, Infinity],
    [NaN, 1],
  ]) {
    assert.throws(
      () => resolveTreemapColors(nodes, leaves, { type: "sequential", value, domain }),
      /domain/,
    );
  }
  assert.throws(
    () => resolveTreemapColors(nodes, leaves, { type: "diverging", value, domain: [1, 2] }),
    /contain zero/,
  );
  for (const invalid of [
    [],
    [{ offset: 0, color: "red" }],
    [
      { offset: 0.2, color: "red" },
      { offset: 1, color: "green" },
    ],
    [
      { offset: 0, color: "red" },
      { offset: 0.5, color: "white" },
      { offset: 0.5, color: "white" },
      { offset: 1, color: "green" },
    ],
  ]) {
    assert.throws(
      () => resolveTreemapColors(nodes, leaves, { type: "sequential", value, stops: invalid }),
      /stops|offsets/,
    );
  }
  for (const thresholds of [[0, 0], [2, 1], [Infinity]]) {
    assert.throws(
      () =>
        resolveTreemapColors(nodes, leaves, {
          type: "threshold",
          value,
          thresholds,
          colors: Array(thresholds.length + 1).fill("red"),
        }),
      /strictly increasing/,
    );
  }
  assert.throws(
    () =>
      resolveTreemapColors(nodes, leaves, {
        type: "threshold",
        value,
        thresholds: [0],
        colors: ["red"],
      }),
    /one more color/,
  );
  assert.throws(
    () =>
      resolveTreemapColors(nodes, leaves, {
        type: "categorical",
        value: () => "a",
        categories: [
          { value: "a", color: "red" },
          { value: "a", color: "blue" },
        ],
      }),
    /unique/,
  );
  assert.throws(
    () => resolveTreemapColors(nodes, leaves, { type: "custom", value, color: () => " " }),
    /nonempty/,
  );
});

test("treemap diverging asymmetrical fixed domains keep numerical zero at the middle stop", () => {
  const result = resolveTreemapColors(nodes, leaves, {
    type: "diverging",
    value,
    domain: [-10, 40],
    stops,
  });
  assert.equal(result.colors.get("zero").color, "white");
  assert.deepEqual(
    result.legend.ticks.map((tick) => tick.offset),
    [0, 0.5, 1],
  );
  assert.match(result.colors.get("positive").color, /50%/);
});

test("treemap finite extreme domains do not overflow interpolation arithmetic", () => {
  const result = resolveTreemapColors(nodes, leaves, {
    type: "sequential",
    value,
    domain: [-Number.MAX_VALUE, Number.MAX_VALUE],
    stops,
  });
  assert.equal(result.colors.get("zero").color, "white");
  const tiny = leaf("tiny", Number.MIN_VALUE);
  assert.equal(
    resolveTreemapColors([tiny], [tiny], {
      type: "sequential",
      value,
      domain: [0, Number.MIN_VALUE],
      stops,
    }).colors.get("tiny").color,
    "green",
  );
  const oneSided = resolveTreemapColors(nodes, leaves, {
    type: "diverging",
    value,
    domain: [0, 20],
    stops,
  });
  assert.equal(oneSided.colors.get("negative").color, "white");
  assert.equal(oneSided.colors.get("zero").color, "white");
});

test("treemap one-sided diverging paint clamps metrics and slices its legend to the same range", () => {
  for (const domain of [
    [0, 20],
    [-10, 0],
  ]) {
    const result = resolveTreemapColors(nodes, leaves, {
      type: "diverging",
      value,
      domain,
      stops,
      formatValue: (metric) => `${metric}%`,
    });
    const positive = domain[0] === 0;
    const clamped = result.colors.get(positive ? "negative" : "positive");
    assert.equal(clamped.color, "white");
    assert.equal(clamped.value, positive ? -10 : 20);
    assert.equal(clamped.formattedValue, positive ? "-10%" : "20%");
    assert.deepEqual(
      result.legend.stops,
      positive
        ? [
            { offset: 0, color: "white" },
            { offset: 1, color: "green" },
          ]
        : [
            { offset: 0, color: "red" },
            { offset: 1, color: "white" },
          ],
    );
    assert.deepEqual(
      result.legend.ticks,
      domain.map((metric, index) => ({ value: metric, label: `${metric}%`, offset: index })),
    );
    assert.equal(result.legend.stops[positive ? 0 : 1].color, result.colors.get("zero").color);
  }
});

test("treemap collapsed continuous domains show their solid midpoint paint in the legend", () => {
  for (const type of ["sequential", "diverging"]) {
    const result = resolveTreemapColors(nodes, leaves, { type, value, domain: [0, 0], stops });
    assert.deepEqual(result.legend.stops, [
      { offset: 0, color: "white" },
      { offset: 1, color: "white" },
    ]);
    assert.deepEqual(result.legend.ticks, [{ value: 0, label: "0", offset: 0.5 }]);
    for (const id of ["negative", "zero", "positive"])
      assert.equal(result.colors.get(id).color, "white");
    assert.equal(result.colors.get("negative").value, -10);
    assert.equal(result.colors.get("positive").value, 20);
  }
});
