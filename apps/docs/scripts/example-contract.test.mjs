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
