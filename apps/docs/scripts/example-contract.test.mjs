import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { examples } from "../examples/catalog.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";

const bundles = JSON.parse(readFileSync("generated/examples.json", "utf8"));
const provenance = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));
test("only the published Line and Area components has a complete public consumer", () => {
  assert.deepEqual(
    examples.map((example) => example.id),
    ["line", "area"],
  );
  assert.deepEqual(Object.keys(bundles), ["line", "area"]);
  const bundle = bundles.line;
  assert.match(bundle.files["src/main.tsx"], /@kind-ui\/charts\/styles\.css/);
  const manifest = JSON.parse(bundle.files["package.json"]);
  assert.equal(manifest.private, true);
  assert.equal(manifest.dependencies["@kind-ui/charts"], "file:vendor/kind-ui-charts-0.0.0.tgz");
  const lock = JSON.parse(bundle.files["package-lock.json"]);
  assert.equal(lock.packages["node_modules/@kind-ui/charts"].integrity, provenance.integrity);
  for (const file of [
    "package.json",
    "package-lock.json",
    "src/main.tsx",
    "src/example.css",
    "src/examples/line/example.tsx",
  ])
    assert.ok(
      bundle.files["README.md"].includes(`/examples/line/${file}`),
      `Setup link missing: ${file}`,
    );
});
test("download package bytes match the validated snapshot", () => {
  const digest = createHash("sha256")
    .update(readFileSync("public/examples/package/kind-ui-charts-0.0.0.tgz"))
    .digest("hex");
  assert.equal(digest, provenance.sha256);
  assert.equal(provenance.guardedArtifact, true);
});

test("Line snippets are standalone public consumers with a shared data alternative", () => {
  const lines = JSON.parse(readFileSync("generated/line-examples.json", "utf8"));
  assert.equal(Object.keys(lines).length, 5);
  for (const bundle of Object.values(lines)) {
    const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
    const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
    assert.ok(
      imports.every((value) => value === "@kind-ui/charts"),
      `${bundle.id}: ${imports}`,
    );
    assert.ok(!Object.keys(bundle.files).some((file) => /settings\.ts|controls\.tsx/.test(file)));
    assert.ok(bundle.dataAlternative.rows.length >= 7);
    assert.deepEqual(filesFor(bundle, {}), bundle.files);
  }
  const basic = lines.line.files["src/examples/line/example.tsx"];
  assert.equal([...basic.matchAll(/<Chart\.LineChart\b/g)].length, 1);
  assert.ok(!/useState|useId|Root|ResponsiveContainer/.test(basic));
});

test("Line variant sources match selected public defaults without runtime compilation", () => {
  const lines = JSON.parse(readFileSync("generated/line-examples.json", "utf8"));
  for (const bundle of Object.values(lines).filter((bundle) => bundle.variants)) {
    for (const [value, variant] of Object.entries(bundle.variants)) {
      const files = filesFor(bundle, {}, value);
      assert.equal(files[`src/examples/${bundle.id}/example.tsx`], variant.source);
      assert.ok(variant.source.includes(`${bundle.variantControl.toLowerCase()} = "${value}"`));
      assert.ok(
        promptFor(bundle, {}, "https://docs.example", value).includes(
          `/variants/${value}/example.tsx`,
        ),
      );
    }
  }
});

test("Area consumers preserve explicit composition and consumer-owned stacked visibility", () => {
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
    assert.ok(promptFor(bundle, {}, "https://docs.example").includes("/docs/components/area/"));
    for (const [value, variant] of Object.entries(bundle.variants ?? {})) {
      assert.equal(
        filesFor(bundle, {}, value)[`src/examples/${bundle.id}/example.tsx`],
        variant.source,
      );
      assert.ok(variant.source.includes(`${bundle.variantControl.toLowerCase()} = "${value}"`));
    }
  }
  assert.match(
    areas["area-stacked"].files["src/examples/area-stacked/example.tsx"],
    /onVisibleSeriesChange={setVisibleSeries}/,
  );
});
