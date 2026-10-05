import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { catalog, githubRepository, httpBase } from "../registry/catalog.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, "apps/docs/public/r");
const check = process.argv.includes("--check");
const require = createRequire(
  process.env.REGISTRY_TOOL_ROOT
    ? resolve(process.env.REGISTRY_TOOL_ROOT, "package.json")
    : new URL("../package.json", import.meta.url),
);
const formatter = require.resolve("@biomejs/biome/bin/biome");
const encode = (value) => {
  const result = spawnSync(
    process.execPath,
    [formatter, "format", "--stdin-file-path=registry.json"],
    { cwd: root, input: JSON.stringify(value), encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(`Registry formatting failed: ${result.stderr}`);
  return result.stdout;
};
export async function buildOutputs() {
  const outputs = new Map([["registry.json", encode(catalog)]]);
  const items = [];
  for (const item of catalog.items) {
    const files = await Promise.all(
      item.files.map(async (file) => {
        const path = resolve(root, file.path);
        if (relative(root, path).startsWith(".."))
          throw new Error(`Unsafe source path: ${file.path}`);
        return { ...file, content: await readFile(path, "utf8") };
      }),
    );
    const built = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      ...item,
      files,
      ...(item.registryDependencies
        ? {
            registryDependencies: item.registryDependencies.map((dep) =>
              dep.startsWith(`${githubRepository}/`)
                ? `${httpBase}/${dep.slice(githubRepository.length + 1)}.json`
                : dep,
            ),
          }
        : {}),
    };
    items.push(built);
    outputs.set(`apps/docs/public/r/${item.name}.json`, encode(built));
  }
  outputs.set("apps/docs/public/r/registry.json", encode({ ...catalog, items }));
  return outputs;
}
const outputs = await buildOutputs();
if (!check) await mkdir(output, { recursive: true });
for (const [path, content] of outputs) {
  const absolute = resolve(root, path);
  if (check) {
    if ((await readFile(absolute, "utf8").catch(() => "")) !== content)
      throw new Error(`Stale registry output: ${path}. Run node scripts/build-registry.mjs.`);
  } else await writeFile(absolute, content);
}
for (const name of await readdir(output)) {
  if (name.endsWith(".json") && !outputs.has(`apps/docs/public/r/${name}`))
    throw new Error(`Unexpected registry output: ${name}`);
}
console.log(
  `Registry ${check ? "freshness checked" : "generated"}: ${catalog.items.length} items.`,
);
