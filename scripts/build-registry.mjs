import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { filesFor } from "../apps/docs/lib/example-files.mjs";
import { coreVersion, registryCss, registryHomepage, registryItems } from "../registry/catalog.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const staging = path.join(root, "artifacts/registry/source");
const output = path.join(root, "artifacts/registry/r");
rmSync(staging, { recursive: true, force: true });
rmSync(output, { recursive: true, force: true });
mkdirSync(path.join(staging, "components"), { recursive: true });
const packageJson = /** @type {unknown} */ (
  JSON.parse(readFileSync(path.join(root, "packages/charts/package.json"), "utf8"))
);
const manifest = z.object({ version: z.string() }).parse(packageJson);
if (manifest.version !== coreVersion)
  throw new Error(`Registry targets Core ${coreVersion}, source package is ${manifest.version}`);
const dependencies = [
  `@kind-ui/charts@${coreVersion}`,
  "react@^19.3.0",
  "react-dom@^19.3.0",
  "recharts@^3.10.1",
  "motion@^13.4.6",
];
const items = registryItems.map(({ exampleId, name, title, description }) => {
  const sourcePath = `src/examples/${exampleId}/example.tsx`;
  const files = filesFor(
    {
      id: exampleId,
      family: exampleId,
      files: {
        [sourcePath]: readFileSync(
          path.join(root, `apps/docs/examples/${exampleId}/example.tsx`),
          "utf8",
        ),
      },
    },
    {},
  );
  const source = files[sourcePath];
  if (!source) throw new Error(`Missing canonical composition ${exampleId}`);
  const relative = `components/${name}.tsx`;
  writeFileSync(path.join(staging, relative), source);
  return {
    name,
    type: "registry:component",
    title,
    description,
    dependencies,
    devDependencies: ["tailwindcss@^4.0.0"],
    css: registryCss,
    files: [{ path: relative, type: "registry:component", target: `@components/${name}.tsx` }],
  };
});
writeFileSync(
  path.join(staging, "registry.json"),
  `${JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "kind-ui",
      homepage: registryHomepage,
      items,
    },
    null,
    2,
  )}\n`,
);
// Use the official producer, pinned for reproducible schema and CLI behavior.
execFileSync(
  "npm",
  [
    "exec",
    "--yes",
    "--package=shadcn@4.21.4",
    "--",
    "shadcn",
    "build",
    "registry.json",
    "--cwd",
    staging,
    "--output",
    output,
  ],
  { cwd: root, stdio: "inherit" },
);
console.log(`Built ${items.length} editable compositions for https://kindui.dev/r/.`);
