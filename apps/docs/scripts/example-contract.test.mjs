import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { allExamples, examples, families, variantDefinitions } from "../examples/catalog.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";
import { publicPath } from "../lib/routing.mjs";
import { verificationFiles } from "./consumer-validation-files.mjs";
import "./routing-contract.test.mjs";
import "./composition-guide.test.mjs";
import "./material-contract.test.mjs";

const bundles = JSON.parse(readFileSync("generated/examples.json", "utf8"));
const completeBundles = JSON.parse(readFileSync("generated/all-examples.json", "utf8"));
const provenance = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));
test("presentation options remain complete in copied and agent-retrieved consumers", () => {
  const bundle = completeBundles["combo-motion"];
  const file = "src/examples/combo-motion/options.tsx";
  const source = readFileSync("examples/combo-motion/options.tsx", "utf8");
  assert.equal(bundle.files[file], source);
  for (const variant of [undefined, ...Object.keys(bundle.variants ?? {})]) {
    assert.equal(filesFor(bundle, {}, variant)[file], source);
    assert.equal(verificationFiles(bundle, filesFor(bundle, {}, variant))[file], source);
  }
  assert.equal(readFileSync(`public/examples/combo-motion/${file}`, "utf8"), source);
  assert.ok(bundle.files["README.md"].includes(`/examples/combo-motion/${file}`));
  const reference = [
    "components/line",
    "components/bar",
    "components/combo",
    "components/sankey",
    "chart-components/root",
  ]
    .map((page) => readFileSync(`public/markdown/${page}.md`, "utf8"))
    .join("\n");
  for (const type of [
    "FillPattern",
    "ChartBackgroundPattern",
    "BarProjection",
    "createPercentStack",
    "PointMarker",
    "LineDashAnimation",
    "SankeyNodeLabel",
  ])
    assert.ok(reference.includes(type), `${type} reference missing`);
  assert.ok(!readFileSync("public/llms.txt", "utf8").includes("guides/customization.md"));
  assert.ok(readFileSync("public/llms-full.txt", "utf8").includes(source));
});
test("Introduction is the first Get Started page at the preserved docs root", () => {
  const root = JSON.parse(readFileSync("content/docs/meta.json", "utf8"));
  const start = JSON.parse(readFileSync("content/docs/start/meta.json", "utf8"));
  assert.equal(root.pages[0], "start");
  assert.ok(!root.pages.includes("index"));
  assert.ok(!root.pages.includes("agents"));
  assert.deepEqual(start, {
    title: "Get Started",
    pages: ["../index", "../installation", "../agents/consumer"],
  });
  assert.match(readFileSync("content/docs/index.mdx", "utf8"), /^title: Introduction$/m);
  assert.match(readFileSync("public/markdown/index.md", "utf8"), /^# Introduction\n/);
  const origin = process.env.KIND_DOCS_ORIGIN?.replace(/\/$/, "") || "";
  assert.ok(
    readFileSync("public/llms.txt", "utf8").includes(
      `[Introduction](${origin}${publicPath("/markdown/index.md")})`,
    ),
  );
  const index = readFileSync("public/llms.txt", "utf8");
  assert.ok(!index.includes("/markdown/start/"));
  for (const page of ["installation", "quickstart"]) {
    assert.equal(
      readFileSync(`public/markdown/start/${page}.md`, "utf8"),
      readFileSync("public/markdown/installation.md", "utf8"),
    );
  }
});
test("each registered family has a complete public consumer", () => {
  assert.deepEqual(
    examples.map((example) => example.id),
    families.map((family) => family.id),
  );
  assert.deepEqual(
    Object.keys(bundles),
    examples.map((example) => example.id),
  );
  const bundle = bundles.line;
  assert.match(bundle.files["src/main.tsx"], /@kind-ui\/charts\/styles\.css/);
  const manifest = JSON.parse(bundle.files["package.json"]);
  assert.equal(manifest.private, true);
  assert.equal(manifest.dependencies["@kind-ui/charts"], `^${provenance.version}`);
  assert.ok(!Object.hasOwn(bundle.files, "package-lock.json"));
  for (const file of [
    "package.json",
    "src/main.tsx",
    "src/example.css",
    "src/examples/line/example.tsx",
  ])
    assert.ok(
      bundle.files["README.md"].includes(`/examples/line/${file}`),
      `Setup link missing: ${file}`,
    );
});
test("private package bytes match validation without public provenance or archives", () => {
  const digest = createHash("sha256")
    .update(readFileSync("vendor/kind-ui-charts-0.3.0.tgz"))
    .digest("hex");
  assert.equal(digest, provenance.sha256);
  assert.equal(provenance.guardedArtifact, true);
  assert.equal(existsSync("public/package-provenance.json"), false);
  assert.equal(existsSync("public/examples/package"), false);
});

test("Line snippets are standalone public consumers with a shared data alternative", () => {
  const lines = JSON.parse(readFileSync("generated/line-examples.json", "utf8"));
  assert.equal(Object.keys(lines).length, 7);
  for (const bundle of Object.values(lines)) {
    const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
    const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
    assert.ok(
      imports.every((value) => value === "@kind-ui/charts" || value === "react"),
      `${bundle.id}: ${imports}`,
    );
    assert.ok(!Object.keys(bundle.files).some((file) => /settings\.ts|controls\.tsx/.test(file)));
    assert.ok(
      bundle.dataAlternative.rows.length >=
        (["line-presentation", "line-start"].includes(bundle.id) ? 4 : 7),
    );
    assert.deepEqual(filesFor(bundle, {}), bundle.files);
  }
  const basic = lines.line.files["src/examples/line/example.tsx"];
  assert.equal([...basic.matchAll(/<Chart\.LineChart\b/g)].length, 1);
  assert.ok(!/useId|Root|ResponsiveContainer/.test(basic));
});

test("Line variant sources match selected public defaults without runtime compilation", () => {
  const lines = JSON.parse(readFileSync("generated/line-examples.json", "utf8"));
  for (const bundle of Object.values(lines).filter((bundle) => bundle.variants)) {
    for (const [value, variant] of Object.entries(bundle.variants)) {
      const files = filesFor(bundle, {}, value);
      assert.equal(files[`src/examples/${bundle.id}/example.tsx`], variant.source);
      assert.ok(variant.source.includes(`${variantDefinitions[bundle.id].prop} = "${value}"`));
      assert.ok(
        promptFor(bundle, {}, "https://docs.example", value).includes(
          `/variants/${value}/example.tsx`,
        ),
      );
    }
  }
});

test("Area consumers preserve explicit composition and stacked series focus", () => {
  const areas = JSON.parse(readFileSync("generated/area-examples.json", "utf8"));
  assert.deepEqual(Object.keys(areas), ["area", "area-curves", "area-stacked", "area-materials"]);
  for (const bundle of Object.values(areas)) {
    const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
    assert.match(source, /"use client"/);
    assert.match(source, /satisfies Chart.SeriesConfig/);
    assert.match(source, /<Chart.Root\s+config=\{config\}/);
    assert.match(source, /<Chart.ResponsiveContainer width="100%" height=\{280\}>/);
    assert.match(source, /<Chart.AreaChart[\s\S]*?animate[\s\S]*?accessibilityLayer/);
    assert.match(source, /<Chart.AreaSeries/);
    assert.equal(bundle.dataAlternative.rows.length, 12);
    assert.ok(!/settings|controls|<Chart.AreaChart[^>]*config=/s.test(source));
    assert.ok(
      promptFor(bundle, {}, "https://docs.example").includes(publicPath("/docs/components/area/")),
    );
    for (const [value, variant] of Object.entries(bundle.variants ?? {})) {
      assert.equal(
        filesFor(bundle, {}, value)[`src/examples/${bundle.id}/example.tsx`],
        variant.source,
      );
      assert.ok(variant.source.includes(`${variantDefinitions[bundle.id].prop} = "${value}"`));
    }
  }
  assert.match(
    areas["area-stacked"].files["src/examples/area-stacked/example.tsx"],
    /mode: "focus"/,
  );
});

test("every family recipe is generated with its own prompt route and complete data alternative", () => {
  const all = JSON.parse(readFileSync("generated/all-examples.json", "utf8"));
  assert.deepEqual(Object.keys(all).sort(), allExamples.map(({ id }) => id).sort());
  for (const example of allExamples) {
    const bundle = all[example.id];
    assert.equal(bundle.family, example.family);
    assert.ok(
      promptFor(bundle, {}, "https://docs.example").includes(
        publicPath(`/docs/components/${example.family}/`),
      ),
    );
    assert.ok(bundle.dataAlternative.rows.length > 0);
    for (const row of bundle.dataAlternative.rows)
      for (const column of Object.keys(bundle.dataAlternative.columns))
        assert.ok(Object.hasOwn(row, column));
    for (const [value, variant] of Object.entries(bundle.variants ?? {}))
      assert.notEqual(variant.source, "", `${example.id}:${value}`);
  }
});

test("public copy rejects stale release receipts and registry install claims", async () => {
  const { assertPublicCopy } = await import("./public-copy.mjs");
  for (const stale of [
    "These examples use the validated, integrated release candidate",
    "Registry installation remains unverified",
    "See /package-provenance.json",
    "Download /examples/package/kind-ui-charts-0.2.0.tgz",
    "Download /examples/package/kind-ui-charts-0.3.0.tgz",
    "npx shadcn@latest add @kindui/line-chart",
  ])
    assert.throws(() => assertPublicCopy(stale, "fixture"));
  assert.doesNotThrow(() => assertPublicCopy("npm install @kind-ui/charts", "fixture"));
  for (const [id, bundle] of Object.entries(completeBundles)) {
    assertPublicCopy(promptFor(bundle, {}, "https://example.com"), `${id} prompt`);
    for (const [name, body] of Object.entries(bundle.files))
      if (/\.(?:md|json)$/.test(name)) assertPublicCopy(body, `${id}/${name}`);
  }
});

test("shared references are registered and chart pages retain family APIs", () => {
  const meta = JSON.parse(readFileSync("content/docs/meta.json", "utf8"));
  assert.ok(meta.pages.includes("chart-components"));
  const shared = JSON.parse(readFileSync("content/docs/chart-components/meta.json", "utf8"));
  assert.equal(shared.title, "Chart Components");
  for (const slug of shared.pages)
    assert.ok(existsSync(`public/markdown/chart-components/${slug}.md`), slug);
  for (const { id } of families) {
    const body = readFileSync(`content/docs/components/${id}.mdx`, "utf8");
    assert.ok(body.includes("## API reference"), `${id} family API`);
    assert.doesNotMatch(
      body,
      /^### (?:Root|Legend|Tooltip|Responsive(?:<wbr \/>)?Container|XAxis|YAxis|CartesianGrid)$/m,
      `${id} duplicates shared API`,
    );
  }
});

test("internal checks preserve the locked fixture across all public variants", () => {
  const before = JSON.stringify(completeBundles);
  const integrity = `sha512-${createHash("sha512").update(readFileSync("vendor/kind-ui-charts-0.3.0.tgz")).digest("base64")}`;
  for (const bundle of Object.values(completeBundles)) {
    for (const variant of [undefined, ...Object.keys(bundle.variants ?? {})]) {
      const publicFiles = filesFor(bundle, {}, variant);
      const files = verificationFiles(bundle, publicFiles);
      assert.ok(!Object.hasOwn(publicFiles, "package-lock.json"), bundle.id);
      const manifest = JSON.parse(files["package.json"]);
      const lock = JSON.parse(files["package-lock.json"]);
      assert.equal(
        manifest.dependencies["@kind-ui/charts"],
        "file:vendor/kind-ui-charts-0.3.0.tgz",
      );
      assert.deepEqual(manifest.dependencies, lock.packages[""].dependencies);
      assert.deepEqual(manifest.devDependencies, lock.packages[""].devDependencies);
      assert.equal(
        lock.packages["node_modules/@kind-ui/charts"].resolved,
        "file:vendor/kind-ui-charts-0.3.0.tgz",
      );
      assert.equal(lock.packages["node_modules/@kind-ui/charts"].integrity, integrity);
      assert.equal(lock.packages["node_modules/@kind-ui/charts"].version, provenance.version);
      for (const [name, body] of Object.entries(publicFiles)) {
        if (name !== "package.json") assert.equal(files[name], body, `${bundle.id}: ${name}`);
      }
    }
  }
  assert.equal(JSON.stringify(completeBundles), before);
});

test("page Markdown keeps selected examples and readable presentation fallbacks", () => {
  const pages = readdirSync("content/docs", { recursive: true }).filter((file) =>
    file.endsWith(".mdx"),
  );
  const index = readFileSync("public/llms.txt", "utf8");
  for (const file of pages) {
    const key = file.replace(/\.mdx$/, "");
    const mdx = readFileSync(`content/docs/${file}`, "utf8");
    const markdown = readFileSync(`public/markdown/${key}.md`, "utf8");
    assert.doesNotMatch(markdown, /<(?:Steps|Step|Tabs|Tab|Callout|ChartExample|ApiTable)\b/, key);
    for (const [, id, variant] of mdx.matchAll(
      /<ChartExample id="([\w-]+)"(?: variant="([\w-]+)")?/g,
    )) {
      const bundle = completeBundles[id];
      const source = variant
        ? bundle.variants[variant].source
        : bundle.files[`src/examples/${id}/example.tsx`];
      assert.ok(markdown.includes(source.trimEnd()), `${key}: ${id}:${variant ?? "default"}`);
    }
    if (mdx.includes("<ApiTable"))
      assert.ok(markdown.includes("| Prop | Type | Default | Description |"), key);
  }
  assert.equal((index.match(/^- /gm) ?? []).length, pages.length);
  for (const [alias, canonical] of [
    ["concepts/composition", "installation"],
    ["quickstart", "installation"],
    ["start/quickstart", "installation"],
    ["guides/release", "installation"],
  ]) {
    assert.equal(
      readFileSync(`public/markdown/${alias}.md`, "utf8"),
      readFileSync(`public/markdown/${canonical}.md`, "utf8"),
    );
    assert.ok(!index.includes(`/markdown/${alias}.md`));
  }
  assert.match(readFileSync("public/markdown/installation.md", "utf8"), /#### Next\.js/);
});

test("shared copied examples own complete data alternatives without preview duplication", () => {
  for (const id of [
    "bar-comparison",
    "line-markers",
    "line-comparison",
    "bar-horizontal",
    "pie-materials",
  ]) {
    const source = readFileSync(`examples/${id}/example.tsx`, "utf8");
    assert.ok(source.includes("data-chart-alternative"));
    assert.ok(source.includes("data.map((row)"));
    assert.ok(source.includes('scope="row"'));
    assert.equal(completeBundles[id].dataAlternativeInSource, true);
    assert.ok(completeBundles[id].dataAlternative.rows.length > 0);
    assert.equal(completeBundles[id].files[`src/examples/${id}/example.tsx`], source);
  }
});
