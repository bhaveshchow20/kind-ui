import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { itemNameFor, registryItems } from "../../../registry/catalog.mjs";
import { allExamples, examples } from "../examples/catalog.mjs";
import { installationFor, installationMarkdown } from "../lib/chart-installation.mjs";
import { componentBundlesSchema } from "../lib/component-bundles.server.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";
import { verificationFiles } from "./consumer-validation-files.mjs";

const source = readFileSync(
  new URL("../examples/candlestick/example.tsx", import.meta.url),
  "utf8",
);
const bundle = {
  id: "candlestick",
  family: "candlestick",
  title: "Candlestick Chart",
  version: "0.5.0",
  minimumCoreVersion: "0.6.0",
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
  assert.equal(result.steps[0].code, "npm install @kind-ui/charts@^0.6.0 motion recharts");
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
    assert.match(prompt, /Reference package: @kind-ui\/charts@0\.6\.0\./);
    assert.match(prompt, /Install @kind-ui\/charts@\^0\.6\.0 and its documented/);
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
      /source candidate|wait for|unreleased|checksum|provenance|127\.0\.0\.1|localhost/i,
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
    assert.equal(actual.minimumCoreVersion, "0.6.0");
    assert.equal(example.minimumCoreVersion, "0.6.0");
    assert.equal(actual.version, "0.5.0");
    assert.equal(
      JSON.parse(actual.files["package.json"]).dependencies["@kind-ui/charts"],
      "^0.6.0",
    );
    assert.equal(
      actual.files[`src/examples/${example.id}/example.tsx`],
      readFileSync(new URL(`../examples/${example.id}/example.tsx`, import.meta.url), "utf8"),
    );
    assert.doesNotMatch(
      actual.files["README.md"],
      /source candidate|wait for|unreleased|provenance/i,
    );
    const prompt = promptFor(actual, {});
    assert.match(prompt, /Reference package: @kind-ui\/charts@0\.6\.0\./);
    assert.match(prompt, /Install @kind-ui\/charts@\^0\.6\.0 and its documented/);
    const selectedSource = actual.defaultVariant
      ? `variants/${actual.defaultVariant}/example.tsx`
      : `src/examples/${example.id}/example.tsx`;
    assert.ok(
      prompt.includes(`https://kindui.dev/charts/docs/examples/${example.id}/${selectedSource}`),
    );
    assert.doesNotMatch(prompt, /source candidate|wait for|unreleased|provenance/i);
  }
  assert.equal(bundles.candlestick.registryItemName, "candlestick-chart");
});

test("public Candlestick minimum preserves verified candidate identity and rejects old published artifacts", () => {
  assert.equal(registryItems.length, 15);
  assert.equal(
    registryItems.find(({ name }) => name === "candlestick-chart").minimumCoreVersion,
    "0.6.0",
  );
  for (const item of registryItems.filter(({ name }) => name !== "candlestick-chart"))
    assert.equal(item.minimumCoreVersion, undefined);
  const bundles = JSON.parse(
    readFileSync(new URL("../generated/all-examples.json", import.meta.url), "utf8"),
  );
  const provenance = JSON.parse(
    readFileSync(new URL("../vendor/provenance.json", import.meta.url), "utf8"),
  );
  assert.equal(provenance.version, "0.5.0");
  const tarball = readFileSync(new URL("../vendor/kind-ui-charts-0.5.0.tgz", import.meta.url));
  assert.equal(createHash("sha256").update(tarball).digest("hex"), provenance.sha256);
  for (const bundle of Object.values(bundles).filter(({ family }) => family !== "candlestick")) {
    assert.equal(bundle.minimumCoreVersion, undefined);
    assert.match(promptFor(bundle, {}), /Install @kind-ui\/charts and its documented/);
    assert.equal(
      JSON.parse(bundle.files["package.json"]).dependencies["@kind-ui/charts"],
      `^${bundle.version}`,
    );
  }
  for (const id of ["candlestick", "candlestick-binary", "candlestick-updates"]) {
    const files = verificationFiles(bundles[id]);
    assert.equal(
      JSON.parse(files["package.json"]).dependencies["@kind-ui/charts"],
      "file:vendor/kind-ui-charts-0.5.0.tgz",
    );
  }
  const checker = readFileSync(
    new URL("../../../scripts/check-registry-consumers.mjs", import.meta.url),
    "utf8",
  );
  const substitute = checker.match(
    /dependencies: item.dependencies.map\(\(dependency\) =>\s*([\s\S]*?),\s*\)/,
  )?.[1];
  assert.ok(substitute);
  for (const dependency of [
    "@kind-ui/charts@0.5.0",
    "@kind-ui/charts@^0.6.0",
    "@kind-ui/charts@>=0.6.0",
  ])
    assert.equal(
      runInNewContext(substitute, { dependency, endpoint: "https://test.invalid" }),
      "https://test.invalid/candidate.tgz",
    );
  assert.equal(
    runInNewContext(substitute, { dependency: "react@^19.3.0", endpoint: "https://test.invalid" }),
    "react@^19.3.0",
  );
  assert.match(checker, /assert.equal\(receipt.package.version, coreVersion\)/);
  assert.match(
    checker,
    /assert.equal\(createHash\("sha256"\).update\(tarball\).digest\("hex"\), receipt.sha256\)/,
  );
  const guard = checker.match(/if \(published\) \{[\s\S]*?\n\}\n(?=const publishedMetadata)/)?.[0];
  assert.ok(guard);
  const evaluate = (coreVersion) =>
    runInNewContext(guard, { published: true, coreVersion, registryItems, assert });
  assert.throws(() => evaluate("0.5.0"), /candlestick-chart requires Core 0.6.0 or later/);
  evaluate("0.6.0");
  evaluate("0.7.0");
  const homepage = readFileSync(new URL("../../showcase/app/page.tsx", import.meta.url), "utf8");
  for (const manager of ["npm", "pnpm", "yarn", "bun"])
    assert.ok(
      homepage.includes(
        `${manager} ${manager === "npm" ? "install" : "add"} @kind-ui/charts@^0.6.0`,
      ),
    );
});

test("streaming history agrees with catalog observations and immutable updates retain OHLC validity", () => {
  const parsed = ts.createSourceFile(
    "example.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const selected = parsed.statements.filter(
    (node) =>
      (ts.isFunctionDeclaration(node) && ["history", "advance"].includes(node.name?.text)) ||
      (ts.isVariableStatement(node) &&
        node.declarationList.declarations.some((declaration) =>
          ["start", "round"].includes(declaration.name.getText(parsed)),
        )),
  );
  const code = ts.transpileModule(
    selected.map((node) => node.getText(parsed)).join("\n") + "\n({ history, advance })",
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const { history, advance } = runInNewContext(code);
  const initial = history();
  const catalog = JSON.parse(
    readFileSync(new URL("../generated/all-examples.json", import.meta.url), "utf8"),
  ).candlestick;
  assert.deepEqual(JSON.parse(JSON.stringify(initial)), catalog.dataAlternative.rows);
  let feed = { rows: initial, tick: 0 };
  for (let tick = 1; tick <= 24; tick++) {
    const before = JSON.stringify(feed);
    const next = advance(feed);
    assert.equal(JSON.stringify(feed), before);
    assert.notEqual(next.rows, feed.rows);
    assert.equal(next.rows.length, initial.length + Math.floor(tick / 8));
    for (const [index, row] of next.rows.entries()) {
      assert.ok(row.low <= Math.min(row.open, row.close));
      assert.ok(row.high >= Math.max(row.open, row.close));
      assert.ok(row.volume >= 0);
      if (index) assert.equal(row.time - next.rows[index - 1].time, 60000);
    }
    assert.equal(next.rows.at(-1).state, "partial");
    feed = next;
  }
});
