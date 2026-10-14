import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { satisfies } from "semver";
import { itemNameFor, registryItems } from "../../../registry/catalog.mjs";
import { family } from "../examples/treemap-catalog.mjs";
import { installationFor, installationMarkdown } from "../lib/chart-installation.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";
import { verificationFiles } from "./consumer-validation-files.mjs";
import { assertPublicCopy } from "./public-copy.mjs";

const docs = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, docs), "utf8");
const bundles = JSON.parse(read("generated/treemap-examples.json"));
const provenance = JSON.parse(read("vendor/provenance.json"));
const archive = "vendor/kind-ui-charts-0.5.0.tgz";
const forbidden =
  /candidate|await.*release|after publication|does not (?:contain|export)|checksum|SHA-256|sourceCommit|vendor\/|\.tgz|LICENSE-copy/i;

function publicCopy(body, label) {
  assertPublicCopy(body, label);
  assert.doesNotMatch(body, forbidden, label);
  for (const receipt of [provenance.sha256, provenance.sourceCommit])
    assert.ok(!body.includes(receipt), `Internal receipt exposed in ${label}`);
}

test("Treemap CLI and manual installation use the canonical composition", () => {
  const bundle = bundles.treemap;
  assert.equal(itemNameFor("treemap"), "treemap-chart");
  assert.ok(registryItems.some((item) => item.name === "treemap-chart"));
  const result = installationFor(bundle);
  assert.equal(result.available, true);
  assert.equal(result.command, "npx shadcn@latest add @kind-ui/treemap-chart");
  assert.equal(result.steps.length, 4);
  assert.equal(result.steps[0].code, "npm install @kind-ui/charts motion recharts");
  assert.match(
    result.steps[3].code,
    /import \{ CloudSpendTreemap \} from "@\/components\/treemap-chart"/,
  );
  assert.match(installationMarkdown(bundle), /### CLI[\s\S]*### Manual/);
  assert.doesNotMatch(installationMarkdown(bundle), /pending|after release/);
  assert.doesNotMatch(result.steps[2].code, /<TreemapChart.Tiles \/>\n\n/);
  assert.doesNotMatch(installationMarkdown(bundle), /@\^0\.6\.0/);
  const page = read("content/docs/components/treemap.mdx");
  assert.ok(page.includes('## Installation\n\n<ChartInstallation id="treemap" />'));
  assert.ok(page.includes("## Usage"));
  publicCopy(page, "Treemap page");
});

test("Treemap setup files stay public while validation installs the exact local package", () => {
  for (const example of family.examples) {
    const bundle = bundles[example.id];
    assert.equal(bundle.candidateSha256, undefined);
    assert.equal(bundle.packageStatus, "@kind-ui/charts");
    const manifest = JSON.parse(bundle.files["package.json"]);
    assert.equal(manifest.dependencies["@kind-ui/charts"], "^0.5.0");
    assert.equal(satisfies("0.5.0", manifest.dependencies["@kind-ui/charts"]), true);
    assert.equal(satisfies("0.6.0", manifest.dependencies["@kind-ui/charts"]), false);
    publicCopy(bundle.files["README.md"], `${example.id} README`);
    assert.ok(!Object.keys(bundle.files).some((file) => /\.tgz$|provenance/.test(file)));
    const verified = verificationFiles(bundle);
    assert.equal(
      JSON.parse(verified["package.json"]).dependencies["@kind-ui/charts"],
      `file:${archive}`,
    );
    assert.equal(
      JSON.parse(verified["package-lock.json"]).packages["node_modules/@kind-ui/charts"].integrity,
      provenance.integrity,
    );
  }
});

test("Treemap selected source and prompts preserve deployed link parity without release prose", () => {
  for (const example of family.examples) {
    const bundle = bundles[example.id];
    const before = JSON.stringify(bundle);
    for (const variant of [undefined, ...Object.keys(bundle.variants ?? {})]) {
      const prompt = promptFor(bundle, {}, variant);
      publicCopy(prompt, `${example.id}:${variant} prompt`);
      assert.ok(prompt.includes(`Selected example: ${example.id}`));
      const selected = variant ?? bundle.defaultVariant;
      const expectedURL = selected
        ? `/examples/${example.id}/variants/${selected}/example.tsx`
        : `/examples/${example.id}/src/examples/${example.id}/example.tsx`;
      assert.ok(prompt.includes(`https://kindui.dev/charts/docs${expectedURL}`));
      for (const [url] of prompt.matchAll(/https?:\/\/[^\s]+/g))
        assert.equal(new URL(url.replace(/\.$/, "")).origin, "https://kindui.dev");
      const source = filesFor(bundle, {}, variant)[`src/examples/${example.id}/example.tsx`];
      assert.equal(
        source,
        selected
          ? bundle.variants[selected].source
          : bundle.files[`src/examples/${example.id}/example.tsx`],
      );
      if (variant === "loading") {
        assert.match(source, /state = "loading"/);
      }
    }
    assert.equal(JSON.stringify(bundle), before);
  }
});
