import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { coreVersion, registryItems } from "../../../registry/catalog.mjs";
import { installationFor, installationMarkdown } from "../lib/chart-installation.mjs";

const docs = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, docs), "utf8");

test("CLI and manual installation use each canonical editable composition", () => {
  for (const { exampleId, name, minimumCoreVersion } of registryItems) {
    const source = read(`examples/${exampleId}/example.tsx`);
    const bundle = {
      id: exampleId,
      version: coreVersion,
      registryItemName: name,
      ...(minimumCoreVersion ? { minimumCoreVersion } : {}),
      files: { [`src/examples/${exampleId}/example.tsx`]: source },
    };
    const installation = installationFor(bundle);
    if (!installation.available) continue;
    assert.equal(installation.command, `npx shadcn@latest add @kind-ui/${name}`);
    const composition = installation.steps.find(({ title }) => title === "Create the composition");
    assert.equal(composition?.code, source);
    assert.equal(composition?.filename, `components/${name}.tsx`);
    assert.ok(installation.steps.some(({ code }) => code.includes(`from "@/components/${name}"`)));
    const markdown = installationMarkdown(bundle);
    assert.ok(markdown.includes(source.trimEnd()));
    assert.ok(markdown.includes(installation.command));
    if (installation.available)
      assert.match(markdown, /npm install @kind-ui\/charts motion recharts/);
    assert.doesNotMatch(
      markdown,
      /LICENSE|localhost|127\.0\.0\.1|\/charts\/docs\/r\/|add @kind-ui\/charts\//,
    );
  }
});

test("generated installation metadata agrees with the catalog and source files", () => {
  const bundles = JSON.parse(read("generated/all-examples.json"));
  assert.equal(
    Object.values(bundles).filter((bundle) => bundle.registryItemName).length,
    registryItems.length,
  );
  for (const { exampleId, name } of registryItems) {
    const bundle = bundles[exampleId];
    assert.equal(bundle.registryItemName, name);
    assert.equal(bundle.version, coreVersion);
    const installation = installationFor(bundle);
    if (!installation.available) continue;
    assert.equal(
      installation.steps.find(({ title }) => title === "Create the composition")?.code,
      read(`examples/${exampleId}/example.tsx`),
    );
  }
});

test("chart Installation sections cover flat item commands without changing Usage", () => {
  const primary = registryItems.filter(({ exampleId }) => exampleId !== "radial-activity");
  for (const { exampleId } of primary) {
    const page = read(`content/docs/components/${exampleId}.mdx`);
    const installation = page.split("## Installation\n")[1]?.split("## Usage\n")[0];
    assert.ok(installation?.includes(`<ChartInstallation id="${exampleId}" />`), exampleId);
    assert.ok(!page.split("## Usage\n")[1]?.includes("ChartInstallation"), exampleId);
  }
  assert.ok(
    read("content/docs/components/radial.mdx").includes(
      '<ChartInstallation id="radial-activity" />',
    ),
  );
});

test("installation rejects missing source, missing exports and unknown items", () => {
  assert.throws(
    () =>
      installationFor({
        id: "line",
        version: coreVersion,
        registryItemName: "line-chart",
        files: {},
      }),
    /Missing installation source/,
  );
  assert.throws(
    () =>
      installationFor({
        id: "line",
        version: coreVersion,
        registryItemName: "line-chart",
        files: { "src/examples/line/example.tsx": "const x = 1;" },
      }),
    /Missing composition export/,
  );
  assert.throws(
    () => installationFor({ id: "unknown", version: coreVersion, files: {} }),
    /No registry installation/,
  );
});
