import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allExamples } from "../examples/catalog.mjs";
import { registryItemSchema, registrySchema } from "./registry-schema.mjs";

export const docsRoot = fileURLToPath(new URL("..", import.meta.url));
export const coreVersion = "0.4.0";
export const publishedIntegrity =
  "sha512-M7lSyoxHRi3GR2t6LvyDdCwTNYYoH/fjrRwIGjbe0xGHJn1R+Gfdm9O74lsGxT10ONsC15V+O732YfbdEMvMjQ==";
const read = (file) => readFileSync(path.join(docsRoot, file), "utf8");
const write = (file, body) => {
  mkdirSync(path.dirname(path.join(docsRoot, file)), { recursive: true });
  writeFileSync(path.join(docsRoot, file), body);
};
export function validateCatalog(index) {
  registrySchema.parse(index);
  assert.deepEqual(
    index.items.map((item) => item.name).sort(),
    allExamples.map(({ id }) => `kind-${id}`).sort(),
    "Registry must cover every current example exactly once",
  );
  assert.equal(
    JSON.parse(read("../../packages/charts/package.json")).version,
    coreVersion,
    "Core version changed: review recipes against published npm before updating registry compatibility",
  );
  for (const item of index.items) {
    assert.deepEqual(item.dependencies, [
      `@kind-ui/charts@${coreVersion}`,
      "react@^19.3.0",
      "react-dom@^19.3.0",
      "recharts@^3.10.1",
      "motion@^13.4.6",
    ]);
    assert.equal(item.meta.coreVersion, coreVersion);
    assert.equal(
      item.registryDependencies?.length ?? 0,
      0,
      "A single recipe must not install other charts",
    );
  }
}
export function recipeSource(bundle) {
  const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
  const name = source.match(/export function (\w+)/)?.[1];
  assert.ok(name, `${bundle.id}: expected an exported example function`);
  const hasProps = !source.includes(`export function ${name}()`);
  const table = bundle.dataAlternativeInSource
    ? ""
    : `\n      <div className="sr-only">\n        <table data-chart-alternative aria-label=${JSON.stringify(`${bundle.title} data`)}>\n          <caption>${`{${JSON.stringify(bundle.dataAlternative.caption)}}`}</caption>\n          <thead><tr>${Object.values(
        bundle.dataAlternative.columns,
      )
        .map((label) => `<th scope="col">{${JSON.stringify(label)}}</th>`)
        .join("")}</tr></thead>\n          <tbody>${bundle.dataAlternative.rows
        .map(
          (row) =>
            `<tr>${Object.keys(bundle.dataAlternative.columns)
              .map(
                (key, i) =>
                  `<${i === 0 ? 'th scope="row"' : "td"}>{${JSON.stringify(row[key])}}</${i === 0 ? "th" : "td"}>`,
              )
              .join("")}</tr>`,
        )
        .join("")}</tbody>\n        </table>\n      </div>`;
  return (
    source
      .replace(
        'import "@kind-ui/charts/styles.css";',
        'import "@kind-ui/charts/styles.css";\nimport "../styles.css";',
      )
      .replace(`export function ${name}(`, `function ${name}Composition(`) +
    `\n// Editable composition; the chart engine remains in @kind-ui/charts@${coreVersion}.\nexport function ${name}(${hasProps ? `props: import("react").ComponentProps<typeof ${name}Composition>` : ""}) {\n  return (\n    <div className="chart-example">\n      <${name}Composition${hasProps ? " {...props}" : ""} />${table}\n    </div>\n  );\n}\n`
  );
}
export function buildRegistry(bundles) {
  const index = JSON.parse(read("registry.json"));
  validateCatalog(index);
  rmSync(path.join(docsRoot, "generated/registry"), { recursive: true, force: true });
  rmSync(path.join(docsRoot, "public/r"), { recursive: true, force: true });
  const staged = structuredClone(index);
  for (const item of staged.items) {
    const bundle = bundles[item.meta.example];
    assert.equal(bundle.version, coreVersion, "Docs and registry core versions differ");
    for (const file of item.files) {
      let content = read(file.path);
      if (file.path === `examples/${bundle.id}/example.tsx`) content = recipeSource(bundle);
      file.path = `generated/registry/${item.name}/${path.basename(file.path)}`;
      write(file.path, content);
    }
  }
  write("generated/registry.json", `${JSON.stringify(staged, null, 2)}\n`);
  execFileSync(
    "npm",
    [
      "exec",
      "--yes",
      "--package=shadcn@4.21.4",
      "--",
      "shadcn",
      "build",
      "generated/registry.json",
      "--output",
      "public/r",
    ],
    { cwd: docsRoot, stdio: "inherit" },
  );
  write("public/r/registry.json", `${JSON.stringify(index, null, 2)}\n`);
  for (const item of index.items) {
    const built = JSON.parse(read(`public/r/${item.name}.json`));
    registryItemSchema.parse(built);
    assert.ok(built.files.every((file) => typeof file.content === "string"));
  }
  console.log(
    `Built ${index.items.length} individually installable registry recipes for @kind-ui/charts@${coreVersion}.`,
  );
}
