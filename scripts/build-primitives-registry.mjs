import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const root = new URL("../", import.meta.url).pathname;
const source = path.join(root, "packages/primitives/src");
const output = path.join(root, "artifacts/primitives/registry");
const files = (await fs.readdir(source))
  .filter((name) => /\.(tsx?|css)$/.test(name) && name !== "index.ts")
  .sort();
const manifest = z
  .object({
    dependencies: z.record(z.string(), z.string()),
    peerDependencies: z.record(z.string(), z.string()),
  })
  .parse(JSON.parse(await fs.readFile(path.join(source, "../package.json"), "utf8")));
await fs.mkdir(path.join(output, "ui"), { recursive: true });
const itemFiles = await Promise.all(
  files.map(async (name) => {
    const content = (await fs.readFile(path.join(source, name), "utf8")).replace(
      /(from\s+["']\.\/[^"']+)\.js(["'])/g,
      "$1$2",
    );
    const generatedName = name.endsWith("css") ? "theme.css" : name;
    await fs.writeFile(
      path.join(output, "ui", generatedName),
      `/* Generated from packages/primitives/src/${name}. Edit the maintained source. */\n${content}`,
    );
    return {
      path: `packages/primitives/src/${name}`,
      type: name.endsWith("css") ? "registry:style" : "registry:component",
      target: name.endsWith("css")
        ? "styles/kind-primitives.css"
        : `components/kind-ui/primitives/${name}`,
      content,
    };
  }),
);
itemFiles.push({
  path: "packages/primitives/LICENSE",
  type: "registry:file",
  target: "components/kind-ui/primitives/LICENSE",
  content: await fs.readFile(path.join(root, "packages/primitives/LICENSE"), "utf8"),
});
const item = {
  name: "kind-primitives",
  title: "Kind Primitives",
  type: "registry:block",
  description: "Composable interface primitives with shared Kind styles",
  dependencies: Object.entries({
    ...manifest.dependencies,
    motion: manifest.peerDependencies.motion,
  }).map(([name, version]) => `${name}@${version}`),
  files: itemFiles,
};
await fs.mkdir(output, { recursive: true });
await fs.writeFile(
  path.join(output, "kind-primitives.json"),
  `${JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry-item.json", ...item }, null, 2)}\n`,
);
await fs.writeFile(
  path.join(output, "registry.json"),
  `${JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", name: "kind-primitives", homepage: "https://kindui.dev", items: [{ ...item, files: item.files.map(({ content: _content, ...file }) => file) }] }, null, 2)}\n`,
);
console.log(`Prepared shared primitive source item and ${files.length} generated source files.`);
