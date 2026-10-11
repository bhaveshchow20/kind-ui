import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function text(path) {
  return readFile(path, "utf8");
}

test("consumer teaching uses explicit family parts without a configured chart tier", async () => {
  for (const path of ["README.md", "examples/line-catalog.mjs", "examples/pie-catalog.mjs"]) {
    assert.doesNotMatch(
      await text(path),
      /Root-bound|Root binding|Root \+ ResponsiveContainer|configured LineChart/,
    );
  }
  for (const file of await readdir("content/docs/components")) {
    const source = await text(`content/docs/components/${file}`);
    assert.doesNotMatch(
      source,
      /`(?:Line|Area|Bar|Pie|Scatter|Radar|RadialBar|BoxPlot|Waterfall|Histogram)Series(?:`|\.)/,
    );
    assert.doesNotMatch(
      source,
      /### (?:Line|Area|Bar|Pie|Scatter|Radar|RadialBar|BoxPlot|Waterfall|Histogram)Series\b/,
    );
    assert.doesNotMatch(source, /<(?:Root|ResponsiveContainer|Chart\.[A-Z]\w*Chart)\b/);
  }
});

test("property-table checks target chart-owned frame and compound series", async () => {
  assert.match(
    await text("scripts/check-shared-tables.mjs"),
    /chart: \["ChartFrame", "LoadingReference"\]/,
  );
  for (const family of ["Line", "Area"]) {
    const name = `${family}Chart.Series props`;
    assert.ok(
      (await text(`scripts/check-${family.toLowerCase()}-tables.mjs`)).includes(`"${name}"`),
    );
    const page = await text(`content/docs/components/${family.toLowerCase()}.mdx`);
    assert.ok(page.includes(`aria-label="${name}"`));
    assert.ok(page.includes(`<span id="${family.toLowerCase()}series" />`));
  }
});

test("homepage trial example teaches LineChart composition", async () => {
  const recipes = await text("../showcase/lib/new-chart-recipes.ts");
  assert.match(recipes, /explicit LineChart axes, Series, Tooltip and Legend parts/);
  assert.doesNotMatch(recipes, /config API/);
});

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (/\.(?:tsx|mdx|md|mjs)$/.test(entry.name)) files.push(path);
  }
  return files;
}

test("copied examples and agent guidance omit removed chart wrappers and shortcuts", async () => {
  const files = [
    ...(await sourceFiles("examples")),
    ...(await sourceFiles("content")),
    ...(await sourceFiles("../../skills/kind-ui-charts")),
    "public/AGENTS.md",
  ];
  for (const path of files) {
    const source = await text(path);
    assert.doesNotMatch(
      source,
      /<(?:Root|ResponsiveContainer|Chart\.(?:LineChart|AreaChart|BarChart))\b/,
      path,
    );
    assert.doesNotMatch(source, /\b(?:rootProps|xDataKey|xAxisProps|yAxisProps)=/, path);
    for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']@kind-ui\/charts["']/g))
      assert.doesNotMatch(match[1], /\b(?:Root|RootProps|ResponsiveContainer)\b/, path);
  }
});
