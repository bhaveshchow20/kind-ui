import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";
import { allExamples, families } from "../examples/catalog.mjs";
import { registryInstallCommand } from "../lib/example-files.mjs";
import { registryName } from "../lib/registry-catalog.mjs";
import { publicPath } from "../lib/routing.mjs";
import { validateCatalog } from "./registry.mjs";
import { registryItemSchema } from "./registry-schema.mjs";

const read = (file) => readFileSync(file, "utf8");
const index = JSON.parse(read("registry.json"));
test("registry covers all families, recipes and chart-like public exports", () => {
  validateCatalog(index);
  assert.equal(families.length, 13);
  assert.ok(index.items.some((item) => item.name === "activity-rings"));
  const source = ts.createSourceFile(
    "index.ts",
    read("../../packages/charts/src/index.ts"),
    ts.ScriptTarget.Latest,
    true,
  );
  const chartExports = source.statements
    .filter(ts.isExportDeclaration)
    .flatMap((node) =>
      node.exportClause && ts.isNamedExports(node.exportClause)
        ? node.exportClause.elements
            .filter((part) => !node.isTypeOnly && !part.isTypeOnly)
            .map((part) => part.name.text)
        : [],
    )
    .filter((name) => /Chart$/.test(name) || name === "ActivityRings");
  const recipes = allExamples.map(({ id }) => read(`examples/${id}/example.tsx`)).join("\n");
  assert.equal(chartExports.length, 14);
  for (const name of chartExports) assert.ok(recipes.includes(`Chart.${name}`), `${name} omitted`);
});
test("missing, duplicate and incompatible items fail the catalog gate", () => {
  const missing = structuredClone(index);
  missing.items.pop();
  assert.throws(() => validateCatalog(missing));
  const duplicate = structuredClone(index);
  duplicate.items.push(duplicate.items[0]);
  assert.throws(() => validateCatalog(duplicate));
  const drift = structuredClone(index);
  drift.items[0].dependencies[0] = "@kind-ui/charts@latest";
  assert.throws(() => validateCatalog(drift));
});
test("items use canonical source and every catalog example maps to a family item", () => {
  for (const item of index.items) {
    const built = JSON.parse(read(`public/r/${item.name}.json`));
    registryItemSchema.parse(built);
    assert.equal(built.files.length, item.files.length);
    for (const [i, file] of built.files.entries()) {
      assert.equal(file.content, read(item.files[i].path));
      assert.ok(file.target.startsWith("components/charts/"));
      assert.doesNotMatch(file.content, /const data =|const config =|packages\/charts|\.\/dist\//);
    }
  }
  for (const example of allExamples)
    assert.ok(index.items.some((item) => item.name === registryName(example.family, example.id)));
  assert.equal(readdirSync("public/r").length, 66);
  for (const example of allExamples)
    registryItemSchema.parse(JSON.parse(read(`public/r/kind-${example.id}.json`)));
});
test("retrieved pages show one family installation and preserve selected examples", () => {
  const usage = JSON.parse(read("registry/usage.json"));
  for (const family of families) {
    assert.ok(
      read(`content/docs/components/${family.id}.mdx`).includes(usage[family.id]),
      "Docs Usage differs from the typed consumer fixture",
    );
    const markdown = read(`public/markdown/components/${family.id}.md`);
    assert.ok(markdown.indexOf("## Installation") < markdown.indexOf("## Usage"));
    assert.ok(markdown.includes(`npx shadcn@latest add @kind-ui/${registryName(family.id)}`));
    assert.doesNotMatch(
      markdown,
      /\/r\/kind-|components\/charts\/line-start\/example|Install the editable recipe/,
    );
    assert.ok(markdown.includes("### Manual"));
  }
});

test("Markdown installs use the configured build origin or require the actual serving origin", () => {
  const path = publicPath("/r/line-chart.json");
  assert.equal(
    registryInstallCommand("line-chart", "https://example.test"),
    `npx shadcn@latest add https://example.test${path}`,
  );
  const command = registryInstallCommand("line-chart").replace(
    "npx shadcn@latest add",
    "printf '%s'",
  );
  const env = { ...process.env, KIND_DOCS_ORIGIN: "http://127.0.0.1:6374" };
  assert.equal(
    execFileSync("bash", ["-c", command], { env, encoding: "utf8" }),
    `http://127.0.0.1:6374${path}`,
  );
  delete env.KIND_DOCS_ORIGIN;
  assert.throws(
    () => execFileSync("bash", ["-c", command], { env, stdio: "pipe" }),
    /Set KIND_DOCS_ORIGIN to the docs site origin/,
  );
  assert.throws(
    () =>
      execFileSync(process.execPath, ["scripts/generate.mjs"], {
        env: { ...env, KIND_UI_DEPLOYMENT_ENV: "production" },
        stdio: "pipe",
      }),
    /KIND_DOCS_ORIGIN is required for production registry install commands/,
  );
});

test("browser checks explain missing registry consumer prerequisites before starting work", () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "kind-registry-browser-prereq-"));
  try {
    const launcher = path.resolve("scripts/start-browser-check.mjs");
    const check = () =>
      assert.throws(
        () => execFileSync(process.execPath, [launcher], { cwd: scratch, stdio: "pipe" }),
        /Run `npm run check:registry` before `npm run check:browser`/,
      );
    check();
    mkdirSync(path.join(scratch, "artifacts/registry-consumer"), { recursive: true });
    writeFileSync(path.join(scratch, "artifacts/registry-consumer/registry-results.json"), "{}");
    check();
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
