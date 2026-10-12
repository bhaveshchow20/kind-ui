import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
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

test("Candlestick copy prompts preserve the parts actually included in each recipe", () => {
  for (const example of allExamples.filter(({ family }) => family === "candlestick")) {
    const recipeSource = readFileSync(
      new URL(`../examples/${example.id}/example.tsx`, import.meta.url),
      "utf8",
    );
    const recipeBundle = {
      ...bundle,
      id: example.id,
      title: example.title,
      files: { [`src/examples/${example.id}/example.tsx`]: recipeSource },
    };
    const validated = componentBundlesSchema.parse({ [example.id]: recipeBundle })[example.id];
    const prompt = promptFor(validated, {});
    assert.match(prompt, /https:\/\/kindui\.dev\/charts\/docs\/components\/candlestick\//);
    assert.ok(
      prompt.includes(
        `https://kindui.dev/charts/docs/examples/${example.id}/src/examples/${example.id}/example.tsx`,
      ),
    );
    assert.match(recipeSource, /<CandlestickContent/);
    if (example.id === "candlestick-updates") {
      assert.match(recipeSource, /<CandlestickDataTable/);
      assert.match(prompt, /Preserve the explicit readout and data table parts/);
    } else {
      assert.doesNotMatch(recipeSource, /<CandlestickDataTable/);
      assert.match(prompt, /Preserve the explicit readout part/);
      assert.doesNotMatch(prompt, /data table|alternative tables/);
    }
    assert.doesNotMatch(
      prompt,
      /source candidate|wait for|unreleased|checksum|provenance|0\.6\.0|127\.0\.0\.1|localhost/i,
    );
    assert.deepEqual(filesFor(validated, {}), recipeBundle.files);
  }
});

test("Candlestick Usage is a client module and consumer selection guidance has no obsolete release gate", () => {
  const page = readFileSync(
    new URL("../content/docs/components/candlestick.mdx", import.meta.url),
    "utf8",
  );
  const usage = page.match(
    /```tsx title="components\/candlestick-example\.tsx"\n([\s\S]*?)\n```/,
  )?.[1];
  assert.ok(usage, "Missing complete Candlestick Usage module");
  const parsed = ts.createSourceFile(
    "candlestick-example.tsx",
    usage,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const directive = parsed.statements[0];
  assert.ok(
    directive &&
      ts.isExpressionStatement(directive) &&
      ts.isStringLiteral(directive.expression) &&
      directive.expression.text === "use client",
    "Usage must declare its client boundary before importing compound chart parts",
  );
  assert.match(usage, /import \{ CandlestickChart \} from "@kind-ui\/charts"/);
  const emitted = ts.transpileModule(usage, {
    fileName: "candlestick-example.tsx",
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  assert.deepEqual(emitted.diagnostics ?? [], []);
  const guidance = readFileSync(
    new URL("../../../skills/kind-ui-charts/rules/composition.md", import.meta.url),
    "utf8",
  );
  assert.match(guidance, /\| OHLC price intervals \| Candlestick \|/);
  for (const text of [page, guidance])
    assert.doesNotMatch(text, /source candidate|wait for|unreleased|Core 0\.6\.0/i);
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
    const prompt = promptFor(actual, {});
    const selectedSource = actual.defaultVariant
      ? `variants/${actual.defaultVariant}/example.tsx`
      : `src/examples/${example.id}/example.tsx`;
    assert.ok(
      prompt.includes(`https://kindui.dev/charts/docs/examples/${example.id}/${selectedSource}`),
    );
    assert.doesNotMatch(prompt, /source candidate|wait for|unreleased|provenance|0\.6\.0/i);
  }
  assert.equal(bundles.candlestick.registryItemName, "candlestick-chart");
});
