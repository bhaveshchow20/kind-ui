import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { allExamples, examples, families } from "../examples/catalog.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";
import { publicPath } from "../lib/routing.mjs";
import "./routing-contract.test.mjs";

const bundles = JSON.parse(readFileSync("generated/examples.json", "utf8"));
const provenance = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));
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
    .update(readFileSync("vendor/kind-ui-charts-0.1.0.tgz"))
    .digest("hex");
  assert.equal(digest, provenance.sha256);
  assert.equal(provenance.guardedArtifact, true);
  assert.equal(existsSync("public/package-provenance.json"), false);
  assert.equal(existsSync("public/examples/package"), false);
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
    assert.ok(
      promptFor(bundle, {}, "https://docs.example").includes(publicPath("/docs/components/area/")),
    );
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
