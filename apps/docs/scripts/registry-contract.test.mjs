import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";
import { allExamples, families } from "../examples/catalog.mjs";
import { registryInstallCommand } from "../lib/example-files.mjs";
import { publicPath } from "../lib/routing.mjs";
import { recipeSource, validateCatalog } from "./registry.mjs";
import { registryItemSchema } from "./registry-schema.mjs";

const read = (file) => readFileSync(file, "utf8");
const index = JSON.parse(read("registry.json"));
const bundles = JSON.parse(read("generated/all-examples.json"));
test("registry covers all families, recipes and chart-like public exports", () => {
  validateCatalog(index);
  assert.equal(families.length, 13);
  assert.ok(index.items.some((item) => item.name === "kind-radial-activity"));
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
test("every public JSON item contains only its recipe and required support files", () => {
  for (const item of index.items) {
    const built = JSON.parse(read(`public/r/${item.name}.json`));
    registryItemSchema.parse(built);
    assert.equal(built.files.length, item.files.length);
    assert.deepEqual(built.dependencies, item.dependencies);
    for (const file of built.files)
      assert.ok(file.content.length && file.target.startsWith("components/charts/"));
    const component = built.files.find((file) =>
      file.target.endsWith(`${item.meta.example}/example.tsx`),
    );
    assert.equal(component.content, recipeSource(bundles[item.meta.example]));
    assert.ok(component.content.includes('import * as Chart from "@kind-ui/charts"'));
    assert.ok(component.content.includes('import "../styles.css"'));
    assert.ok(component.content.includes("data-chart-alternative"));
    assert.doesNotMatch(component.content, /packages\/charts|\.\/dist\//);
    if (item.name === "kind-combo-motion")
      assert.ok(!built.files.some((file) => file.target.endsWith("/options.tsx")));
  }
});

test("retrieved registry usage preserves every fixed selected variant", () => {
  let loadingExamples = 0;
  for (const page of readdirSync("content/docs", { recursive: true }).filter((file) =>
    file.endsWith(".mdx"),
  )) {
    const markdown = read(`public/markdown/${page.replace(/\.mdx$/, ".md")}`);
    for (const [, id, variant] of read(`content/docs/${page}`).matchAll(
      /<ChartExample id="([\w-]+)"(?: variant="([\w-]+)")?/g,
    )) {
      const bundle = bundles[id];
      const selected = variant ?? bundle.defaultVariant;
      const props =
        selected && bundle.registry.variantProp
          ? ` ${bundle.registry.variantProp}=${JSON.stringify(selected)}`
          : "";
      assert.ok(
        markdown.includes(`Render \`<${bundle.registry.componentName}${props} />\``),
        `${page}: ${id}:${selected}`,
      );
      if (variant === "loading") loadingExamples++;
    }
  }
  assert.equal(loadingExamples, 13);
});

test("Markdown installs use the configured build origin or require the actual serving origin", () => {
  const path = publicPath("/r/kind-line.json");
  assert.equal(
    registryInstallCommand("line", "https://example.test"),
    `npx shadcn@latest add https://example.test${path}`,
  );
  const command = registryInstallCommand("line").replace("npx shadcn@latest add", "printf '%s'");
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
