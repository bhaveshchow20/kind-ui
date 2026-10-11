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

test("shared legend browser checks visit current compound documentation pages", async () => {
  const browserCheck = await text("scripts/check-legend-browser.mjs");
  const owners = browserCheck.match(/for \(const owner of \[([\s\S]*?)\]\)/)[1];
  const names = [...owners.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(names.includes("chart"));
  for (const name of names) {
    const page = await text(`content/docs/chart-components/${name}.mdx`);
    assert.match(page, /<ChartExample id="[^"]+"/);
  }
});

test("chart pages begin with their example instead of a dataset scenario", async () => {
  const files = (await readdir("content/docs/components")).filter((file) => file.endsWith(".mdx"));
  assert.equal(files.length, 13);
  for (const file of files) {
    const source = await text(`content/docs/components/${file}`);
    const body = source.replace(/^---[\s\S]*?---\s*/, "");
    assert.match(body, /^<(?:Chart|Line|Area)Example\b/, file);
  }
});

test("histogram reference separates binning parameters and bounds native axis detail", async () => {
  const source = await text("content/docs/components/histogram.mdx");
  const binning = source.split("### binHistogram")[1].split("### HistogramChart")[0];
  const parameters = [...binning.matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]);
  assert.deepEqual(parameters, ["samples", "edges"]);
  const chart = source.split("### HistogramChart\n")[1].split("### Histogram axes")[0];
  for (const name of ["config", "aria-label", "children", "interaction", "frameProps"])
    assert.ok(chart.includes(`\`${name}\``), `${name} belongs to HistogramChart`);
  const axes = source.split("### Histogram axes")[1].split('<span id="histogramseries"')[0];
  assert.doesNotMatch(axes, /<ApiTable/);
  assert.equal([...axes.matchAll(/^\| `/gm)].length, 6);
  assert.match(axes, /https:\/\/recharts\.github\.io\/en-US\/api\/XAxis\//);
  assert.match(axes, /https:\/\/recharts\.github\.io\/en-US\/api\/YAxis\//);
  assert.match(axes, /chart-owned and cannot be overridden/);
  assert.ok(source.includes('<span id="histogramseries" />'));
});
