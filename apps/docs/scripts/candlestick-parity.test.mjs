import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { itemNameFor, registryItems } from "../../../registry/catalog.mjs";
import { allExamples, examples } from "../examples/catalog.mjs";
import { installationFor, installationMarkdown } from "../lib/chart-installation.mjs";
import { componentBundlesSchema } from "../lib/component-bundles.server.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";

const source = readFileSync(
  new URL("../examples/candlestick/example.tsx", import.meta.url),
  "utf8",
);
const bundle = {
  id: "candlestick",
  family: "candlestick",
  title: "Candlestick Chart",
  version: "0.5.0",
  registryItemName: "candlestick-chart",
  packageStatus: "@kind-ui/charts",
  localPackage: true,
  acceptance: "Original observations and units",
  files: { "src/examples/candlestick/example.tsx": source },
};

test("Candlestick joins the canonical flat registry without changing existing names", () => {
  assert.equal(allExamples.filter(({ family }) => family === "candlestick").length, 3);
  assert.equal(registryItems.length, examples.length + 1);
  assert.equal(itemNameFor("candlestick"), "candlestick-chart");
  assert.equal(itemNameFor("line"), "line-chart");
  assert.equal(itemNameFor("radial-activity"), "activity-rings");
});

test("Candlestick uses the established CLI and complete four-step manual composition", () => {
  const result = installationFor(bundle);
  assert.equal(result.command, "npx shadcn@latest add @kind-ui/candlestick-chart");
  assert.deepEqual(
    result.steps.map(({ title }) => title),
    ["Install Core", "Configure Tailwind CSS v4", "Create the composition", "Render the chart"],
  );
  assert.equal(result.steps[2].code, source);
  assert.equal(result.steps[2].filename, "components/candlestick-chart.tsx");
  assert.match(
    result.steps[3].code,
    /import \{ AssetCandlestickChart \} from "@\/components\/candlestick-chart"/,
  );
  assert.match(installationMarkdown(bundle), /### CLI[\s\S]*### Manual/);
  assert.doesNotMatch(
    installationMarkdown(bundle),
    /LICENSE|source candidate|wait for|provenance|127\.0\.0\.1|localhost/i,
  );
});

test("installation reports missing registry and source contracts", () => {
  assert.throws(
    () => installationFor({ ...bundle, registryItemName: undefined }),
    /No registry installation/,
  );
  assert.throws(() => installationFor({ ...bundle, files: {} }), /Missing installation source/);
});

test("Candlestick copy prompts retain the source, data alternatives and deployed retrieval links", () => {
  const validated = componentBundlesSchema.parse({ candlestick: bundle }).candlestick;
  const prompt = promptFor(validated, {});
  assert.match(prompt, /https:\/\/kindui\.dev\/charts\/docs\/components\/candlestick\//);
  assert.match(prompt, /https:\/\/kindui\.dev\/charts\/docs\/examples\/candlestick/);
  assert.match(prompt, /Preserve the explicit readout and data table/);
  assert.doesNotMatch(
    prompt,
    /source candidate|wait for|unreleased|checksum|provenance|0\.6\.0|127\.0\.0\.1|localhost/i,
  );
  assert.deepEqual(filesFor(validated, {}), bundle.files);
});

test("generated Candlestick examples expose complete source and standard installation metadata", () => {
  const bundles = JSON.parse(
    readFileSync(new URL("../generated/all-examples.json", import.meta.url), "utf8"),
  );
  for (const example of allExamples.filter(({ family }) => family === "candlestick")) {
    const actual = bundles[example.id];
    assert.ok(actual, example.id);
    assert.equal(actual.releasePending, undefined);
    assert.equal(actual.minimumCoreVersion, undefined);
    assert.equal(
      JSON.parse(actual.files["package.json"]).dependencies["@kind-ui/charts"],
      `^${actual.version}`,
    );
    assert.equal(
      actual.files[`src/examples/${example.id}/example.tsx`],
      readFileSync(new URL(`../examples/${example.id}/example.tsx`, import.meta.url), "utf8"),
    );
    assert.doesNotMatch(
      actual.files["README.md"],
      /source candidate|wait for|unreleased|provenance|0\.6\.0/i,
    );
    assert.doesNotMatch(
      promptFor(actual, {}),
      /source candidate|wait for|unreleased|provenance|0\.6\.0/i,
    );
  }
  assert.equal(bundles.candlestick.registryItemName, "candlestick-chart");
});
