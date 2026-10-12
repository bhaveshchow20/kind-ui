import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  coreVersion,
  isCoreVersionAvailable,
  itemNameFor,
  registryItems,
} from "../../../registry/catalog.mjs";
import { allExamples, examples } from "../examples/catalog.mjs";
import { installationFor, installationMarkdown } from "../lib/chart-installation.mjs";
import { componentBundlesSchema } from "../lib/component-bundles.server.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const pending = {
  id: "candlestick",
  family: "candlestick",
  title: "Candlestick Chart",
  version: "0.5.0",
  minimumCoreVersion: "0.6.0",
  releasePending: true,
  packageStatus: "@kind-ui/charts",
  localPackage: true,
  acceptance: "Exact original observations",
  files: {
    "package.json": '{"dependencies":{"@kind-ui/charts":"^0.6.0"}}',
    "src/examples/candlestick/example.tsx": "export function CandlestickExample() { return null; }",
  },
};

test("pending family remains documented while the existing registry is unchanged", () => {
  assert.equal(examples.find(({ id }) => id === "candlestick")?.minimumCoreVersion, "0.6.0");
  assert.equal(allExamples.filter(({ family }) => family === "candlestick").length, 3);
  assert.ok(
    allExamples
      .filter(({ family }) => family === "candlestick")
      .every(({ minimumCoreVersion }) => minimumCoreVersion === "0.6.0"),
  );
  assert.equal(
    registryItems.length,
    examples.filter(({ minimumCoreVersion }) => isCoreVersionAvailable(minimumCoreVersion)).length +
      1,
  );
  assert.equal(itemNameFor("line"), "line-chart");
  assert.equal(itemNameFor("radial-activity"), "activity-rings");
  if (isCoreVersionAvailable("0.6.0"))
    assert.equal(itemNameFor("candlestick"), "candlestick-chart");
  else assert.throws(() => itemNameFor("candlestick"), /No registry installation/);
});

test("release gate rejects a prerelease and activates the actual catalog after Core 0.6.0", async () => {
  assert.equal(isCoreVersionAvailable("0.6.0", "0.6.0-rc.1"), false);
  assert.equal(isCoreVersionAvailable("0.6.0", "0.6.0"), true);
  assert.equal(isCoreVersionAvailable("0.6.0", "0.7.0"), true);
  assert.throws(() => isCoreVersionAvailable("latest"), /semantic versions/);
  const scratch = mkdtempSync(path.join(os.tmpdir(), "kind-pending-registry-"));
  try {
    mkdirSync(path.join(scratch, "registry"));
    symlinkSync(path.join(root, "apps"), path.join(scratch, "apps"), "dir");
    symlinkSync(path.join(root, "node_modules"), path.join(scratch, "node_modules"), "dir");
    writeFileSync(path.join(scratch, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(scratch, "registry/names.mjs"),
      readFileSync(path.join(root, "registry/names.mjs")),
    );
    writeFileSync(
      path.join(scratch, "registry/catalog.mjs"),
      readFileSync(path.join(root, "registry/catalog.mjs"), "utf8").replace(
        `coreVersion = "${coreVersion}"`,
        'coreVersion = "0.6.0"',
      ),
    );
    const released = await import(pathToFileURL(path.join(scratch, "registry/catalog.mjs")).href);
    const existing = registryItems.filter(({ exampleId }) => exampleId !== "candlestick");
    assert.equal(released.registryItems.length, existing.length + 1);
    assert.equal(released.itemNameFor("candlestick"), "candlestick-chart");
    assert.deepEqual(
      released.registryItems.filter(({ exampleId }) => exampleId !== "candlestick"),
      existing,
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("pending installation emits a source-candidate notice instead of an unavailable CLI", () => {
  assert.throws(
    () => installationFor(pending),
    /Public npm and registry installation require Core 0.6.0/,
  );
  const markdown = installationMarkdown(pending);
  assert.match(markdown, /validated source candidate of Core 0.5.0/);
  assert.match(markdown, /Published Core 0.5.0 does not include these APIs/);
  assert.doesNotMatch(markdown, /npx|npm install|localhost|127\.0\.0\.1/);
  const released = {
    ...pending,
    releasePending: false,
    version: "0.6.0",
    registryItemName: "candlestick-chart",
  };
  assert.equal(
    installationFor(released).command,
    "npx shadcn@latest add @kind-ui/candlestick-chart",
  );
});

test("pending copy prompts preserve candidate provenance and the original source", () => {
  const validated = componentBundlesSchema.parse({ candlestick: pending }).candlestick;
  assert.equal(validated.minimumCoreVersion, "0.6.0");
  assert.equal(validated.releasePending, true);
  const prompt = promptFor(validated, {});
  assert.match(prompt, /Source candidate: @kind-ui\/charts@0.5.0/);
  assert.match(prompt, /Published Core 0.5.0 lacks this family/);
  assert.match(prompt, /Public installation requires Core 0.6.0 or later/);
  assert.match(prompt, /checksum and provenance/);
  assert.match(prompt, /Preserve the explicit readout and data table/);
  assert.doesNotMatch(prompt, /Reference package|localhost|127\.0\.0\.1/);
  assert.match(prompt, /https:\/\/kindui\.dev\/charts\/docs\/examples\/candlestick/);
  assert.deepEqual(filesFor(validated, {}), pending.files);
});

const generatedPath = path.join(root, "apps/docs/generated/all-examples.json");
test("generated pending consumers target the required release and retain source provenance", {
  skip: !existsSync(generatedPath),
}, () => {
  const bundles = JSON.parse(readFileSync(generatedPath, "utf8"));
  for (const example of allExamples.filter(({ family }) => family === "candlestick")) {
    const bundle = bundles[example.id];
    assert.ok(bundle, example.id);
    assert.equal(bundle.minimumCoreVersion, "0.6.0");
    if (!isCoreVersionAvailable(bundle.minimumCoreVersion)) {
      assert.equal(bundle.releasePending, true);
      assert.equal(bundle.localPackage, true);
      assert.equal(bundle.registryItemName, undefined);
      assert.equal(
        JSON.parse(bundle.files["package.json"]).dependencies["@kind-ui/charts"],
        "^0.6.0",
      );
      assert.match(bundle.files["README.md"], /Source candidate/);
      assert.match(bundle.files["README.md"], /wait for its publication before npm install/);
      assert.match(promptFor(bundle, {}), /approved candidate artifact/);
    }
  }
});
