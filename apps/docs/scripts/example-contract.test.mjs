import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { examples } from "../examples/catalog.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";

const bundles = JSON.parse(readFileSync("generated/examples.json", "utf8"));
const provenance = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));
test("every family has a public-export-only complete consumer", () => {
  assert.equal(examples.length, 13);
  assert.deepEqual(
    Object.keys(bundles),
    examples.map((example) => example.id),
  );
  for (const bundle of Object.values(bundles)) {
    const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
    assert.ok(source);
    const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
    assert.ok(
      imports.every((value) =>
        ["@kind-ui/charts", "react", "recharts", "../shared/controls", "./settings"].includes(
          value,
        ),
      ),
      `${bundle.id}: ${imports}`,
    );
    assert.match(bundle.files["src/main.tsx"], /@kind-ui\/charts\/styles\.css/);
    const manifest = JSON.parse(bundle.files["package.json"]);
    assert.equal(manifest.private, true);
    assert.equal(manifest.dependencies["@kind-ui/charts"], "file:vendor/kind-ui-charts-0.0.0.tgz");
    const lock = JSON.parse(bundle.files["package-lock.json"]);
    assert.equal(lock.packages["node_modules/@kind-ui/charts"].integrity, provenance.integrity);
  }
});
test("selected state replaces the actual settings source without mutating defaults", () => {
  const bundle = bundles.donut;
  const selected = {
    ...bundle.settings,
    visible: ["delivery"],
    material: "paper",
    hole: 36,
    animate: true,
    emphasis: "none",
  };
  const original = JSON.stringify(bundle);
  const files = filesFor(bundle, selected);
  assert.match(files["src/examples/donut/settings.ts"], /"visible": \[\s*"delivery"/);
  assert.match(files["src/examples/donut/settings.ts"], /"hole": 36/);
  assert.equal(JSON.stringify(bundle), original);
  const prompt = promptFor(bundle, selected, "https://docs.example.test");
  assert.ok(prompt.includes(JSON.stringify(selected)));
  assert.ok(prompt.includes(files["src/examples/donut/settings.ts"]));
  assert.match(prompt, /https:\/\/docs.example.test\/markdown\/components\/donut.md/);
  assert.ok(prompt.length < 7000, `Compact prompt is ${prompt.length} characters`);
  assert.ok(!prompt.includes(bundle.files["src/examples/donut/example.tsx"]));
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
