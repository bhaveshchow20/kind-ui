import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { hasNativeLoading, loadingCoverageFor } from "./loading-coverage.mjs";

const native = (name) =>
  `import { ${name} } from "@kind-ui/charts"; const example = <${name} loading={loading} />;`;
const line = { id: "line", variants: { loading: { source: native("LineChart") } } };
const treemap = { id: "treemap", variants: { loading: { source: native("TreemapChart") } } };
function fixture(source = native("TreemapChart")) {
  const paths = [];
  return {
    paths,
    read(path) {
      paths.push(path);
      return source;
    },
  };
}

test("Core-only Treemap requires explicit parsed native loading evidence from its packed fixture", () => {
  const core = fixture();
  assert.deepEqual(
    loadingCoverageFor({
      components: ["LineChart", "TreemapChart"],
      documentedFamilies: ["line"],
      bundles: { line },
      readCoreFixture: core.read,
    }),
    [
      { component: "LineChart", source: "docs", example: "line" },
      {
        component: "TreemapChart",
        source: "core-fixture",
        fixture: "tests/fixtures/treemap/host.tsx",
      },
    ],
  );
  assert.deepEqual(core.paths, ["../../tests/fixtures/treemap/host.tsx"]);
});

test("an absent Treemap catalog cannot claim stale generated docs as rendered loading evidence", () => {
  const core = fixture();
  assert.deepEqual(
    loadingCoverageFor({
      components: ["TreemapChart"],
      documentedFamilies: ["line"],
      bundles: { line, treemap },
      readCoreFixture: core.read,
    }),
    [
      {
        component: "TreemapChart",
        source: "core-fixture",
        fixture: "tests/fixtures/treemap/host.tsx",
      },
    ],
  );
  assert.deepEqual(core.paths, ["../../tests/fixtures/treemap/host.tsx"]);
});

test("documented Treemap requires its generated loading variant and never consults a Core fallback", () => {
  const core = fixture();
  const options = {
    components: ["TreemapChart"],
    documentedFamilies: ["treemap"],
    readCoreFixture: core.read,
  };
  assert.deepEqual(loadingCoverageFor({ ...options, bundles: { treemap } }), [
    { component: "TreemapChart", source: "docs", example: "treemap" },
  ]);
  for (const bundles of [
    {},
    { treemap: { id: "treemap" } },
    {
      treemap: {
        id: "treemap",
        variants: {
          loading: {
            source:
              'import { TreemapChart } from "@kind-ui/charts"; const example = <TreemapChart />;',
          },
        },
      },
    },
    { unrelated: { ...treemap, id: "unrelated" } },
  ]) {
    assert.throws(
      () => loadingCoverageFor({ ...options, bundles }),
      /TreemapChart needs a native loading example/,
    );
  }
  assert.deepEqual(core.paths, []);
});

test("Core fallback cannot hide another missing chart export or malformed fixture", () => {
  const core = fixture();
  for (const component of ["LineChart", "CandlestickChart", "ActivityRings"]) {
    assert.throws(
      () =>
        loadingCoverageFor({
          components: [component],
          documentedFamilies: [],
          bundles: {},
          readCoreFixture: core.read,
        }),
      /needs a native loading example/,
    );
  }
  assert.deepEqual(core.paths, []);
  for (const source of [
    'import { TreemapChart } from "@kind-ui/charts"; const example = <TreemapChart />;',
    'import { TreemapChart } from "./private"; const example = <TreemapChart loading={loading} />;',
    'import { TreemapChart } from "@kind-ui/charts"; const example = <TreemapChart.Tiles loading={loading} />;',
    'const label = "TreemapChart loading={loading}";',
  ]) {
    assert.throws(
      () =>
        loadingCoverageFor({
          components: ["TreemapChart"],
          documentedFamilies: [],
          bundles: {},
          readCoreFixture: () => source,
        }),
      /packed Core fixture.*native loading/,
    );
  }
});

test("native loading matcher accepts public aliases and namespaces but rejects type-only or spoofed imports", () => {
  assert.equal(
    hasNativeLoading(
      "TreemapChart",
      'import { TreemapChart as Allocation } from "@kind-ui/charts"; const example = <Allocation<Record> loading={loading} />;',
    ),
    true,
  );
  assert.equal(
    hasNativeLoading(
      "TreemapChart",
      'import * as Chart from "@kind-ui/charts"; const example = <Chart.TreemapChart loading={loading} />;',
    ),
    true,
  );
  for (const source of [
    'import type { TreemapChart } from "@kind-ui/charts"; const example = <TreemapChart loading={loading} />;',
    'import { type TreemapChart } from "@kind-ui/charts"; const example = <TreemapChart loading={loading} />;',
    'import * as Chart from "./private"; const example = <Chart.TreemapChart loading={loading} />;',
    'import { TreemapChart } from "@kind-ui/charts"; const example = <div loading={loading} />;',
  ])
    assert.equal(hasNativeLoading("TreemapChart", source), false);
});

test("the maintained packed Treemap consumer is the exact source of Core-stage loading evidence", () => {
  const source = readFileSync(
    new URL("../../../tests/fixtures/treemap/host.tsx", import.meta.url),
    "utf8",
  );
  assert.equal(hasNativeLoading("TreemapChart", source), true);
  assert.match(source, /loading=\{loading\}/);
});
