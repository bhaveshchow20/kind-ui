import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { coreVersion, registryItems } from "../../../registry/catalog.mjs";
import {
  coreInstallCommands,
  installationFor,
  installationMarkdown,
} from "../lib/chart-installation.mjs";

const docs = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, docs), "utf8");

test("CLI and manual installation use each canonical editable composition", () => {
  for (const { exampleId, name } of registryItems) {
    const source = read(`examples/${exampleId}/example.tsx`);
    const bundle = {
      id: exampleId,
      version: coreVersion,
      registryItemName: name,
      files: { [`src/examples/${exampleId}/example.tsx`]: source },
    };
    const installation = installationFor(bundle);
    assert.equal(installation.command, `npx shadcn@latest add @kind-ui/${name}`);
    assert.deepEqual(installation.cliCommands, [
      { manager: "npm", command: `npx shadcn@latest add @kind-ui/${name}` },
      { manager: "pnpm", command: `pnpm dlx shadcn@latest add @kind-ui/${name}` },
      { manager: "yarn", command: `yarn dlx shadcn@latest add @kind-ui/${name}` },
      { manager: "bun", command: `bunx shadcn@latest add @kind-ui/${name}` },
    ]);
    assert.deepEqual(
      installation.steps.map(({ title }) => title),
      ["Install Core", "Configure Tailwind CSS v4", "Create the composition", "Render the chart"],
    );
    assert.equal(installation.steps[0].code, coreInstallCommands[0].command);
    const composition = installation.steps.find(({ title }) => title === "Create the composition");
    assert.equal(composition?.code, source);
    assert.equal(composition?.filename, `components/${name}.tsx`);
    assert.ok(installation.steps.some(({ code }) => code.includes(`from "@/components/${name}"`)));
    const markdown = installationMarkdown(bundle);
    assert.ok(markdown.includes(source.trimEnd()));
    assert.ok(markdown.includes(installation.command));
    assert.match(markdown, /npm install @kind-ui\/charts motion recharts/);
    for (const { manager, command } of installation.cliCommands) {
      assert.ok(markdown.includes(`#### ${manager}\n`));
      assert.ok(markdown.includes(command));
    }
    for (const { manager, command } of installation.coreInstallCommands) {
      assert.ok(markdown.includes(`##### ${manager}\n`));
      assert.ok(markdown.includes(command));
    }
    assert.doesNotMatch(
      markdown,
      /LICENSE|localhost|127\.0\.0\.1|\/charts\/docs\/r\/|add @kind-ui\/charts\//,
    );
  }
});

test("shared Core installation keeps the same packages for every consumer package manager", () => {
  assert.deepEqual(coreInstallCommands, [
    { manager: "npm", command: "npm install @kind-ui/charts motion recharts" },
    { manager: "pnpm", command: "pnpm add @kind-ui/charts motion recharts" },
    { manager: "yarn", command: "yarn add @kind-ui/charts motion recharts" },
    { manager: "bun", command: "bun add @kind-ui/charts motion recharts" },
  ]);
});

test("package installation uses native Fumadocs tabs, steps and titled highlighted blocks", () => {
  const packageInstall = read("components/package-install.tsx");
  assert.match(packageInstall, /import \{ Tab, Tabs \} from "fumadocs-ui\/components\/tabs"/);
  assert.match(packageInstall, /import \{ Pre \} from "fumadocs-ui\/components\/codeblock"/);
  assert.match(packageInstall, /highlight\(command/);
  assert.match(packageInstall, /<TrackedCodeBlock title="Terminal">/);
  assert.match(packageInstall, /<Tab key=\{manager\} value=\{manager\}>/);
  assert.match(packageInstall, /groupId="kind-ui-package-manager"/);
  const installation = read("components/chart-installation.tsx");
  assert.match(installation, /import \{ Step, Steps \} from "fumadocs-ui\/components\/steps"/);
  assert.match(installation, /<PackageInstall commands=\{cliCommands\} \/>/);
  assert.match(installation, /<PackageInstall commands=\{coreInstallCommands\} \/>/);
  assert.match(installation, /steps\.slice\(1\)\.map\(installationCode\)/);
  assert.doesNotMatch(installation, /LICENSE|licen[cs]e/i);
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
