import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "artifacts/primitives/package");
await fs.mkdir(output, { recursive: true });
const manifest = z
  .object({
    name: z.literal("@kind-ui/primitives"),
    version: z.literal("0.0.0"),
    private: z.literal(true),
    peerDependencies: z.record(z.string(), z.string()),
    dependencies: z.record(z.string(), z.string()),
  })
  .parse(
    JSON.parse(await fs.readFile(path.join(root, "packages/primitives/package.json"), "utf8")),
  );
const workspace = z
  .object({ devDependencies: z.record(z.string(), z.string()) })
  .parse(JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")));

execFileSync("npm", ["pack", "--workspace", manifest.name, "--pack-destination", output], {
  cwd: root,
  stdio: "inherit",
});
const tarball = path.join(output, "kind-ui-primitives-0.0.0.tgz");
const consumer = await fs.mkdtemp(path.join(os.tmpdir(), "kind-primitives-consumer-"));
const peers = Object.fromEntries(
  Object.keys(manifest.peerDependencies).map((name) => {
    const version = workspace.devDependencies[name];
    assert.ok(version, `Pin the ${name} consumer peer in the workspace`);
    return [name, version];
  }),
);
await fs.writeFile(
  path.join(consumer, "package.json"),
  JSON.stringify({
    name: "kind-primitives-isolated-consumer",
    private: true,
    type: "module",
    dependencies: {
      [manifest.name]: `file:${tarball}`,
      ...peers,
      typescript: workspace.devDependencies.typescript,
      "@types/react": workspace.devDependencies["@types/react"],
      "@types/react-dom": workspace.devDependencies["@types/react-dom"],
    },
  }),
);
execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
  cwd: consumer,
  stdio: "inherit",
});
const families = ["primitives", "table", "dialog", "combobox", "hover-card"];
for (const family of families) {
  for (const extension of ["test.mjs", "types.tsx"]) {
    await fs.copyFile(
      path.join(root, `tests/${family}.${extension}`),
      path.join(consumer, `${family}.${extension}`),
    );
  }
}
execFileSync(process.execPath, ["--test", ...families.map((name) => `${name}.test.mjs`)], {
  cwd: consumer,
  stdio: "inherit",
});
// A package consumer must not acquire either Charts or an AI runtime.
const packageSource = path.join(consumer, "node_modules/@kind-ui/primitives");
for (const name of await fs.readdir(path.join(packageSource, "src"))) {
  if (!/\.(tsx?|css)$/.test(name)) continue;
  assert.doesNotMatch(
    await fs.readFile(path.join(packageSource, "src", name), "utf8"),
    /from\s+["'](?:@kind-ui\/(?:ai|charts)|@ai-sdk\/|ai["'])/,
  );
}
await fs.access(path.join(packageSource, "LICENSE"));
await fs.access(path.join(packageSource, "README.md"));
await fs.access(path.join(packageSource, "src/styles.css"));
const registry = z
  .object({
    dependencies: z.array(z.string()),
    files: z.array(z.object({ target: z.string(), content: z.string() })),
  })
  .parse(
    JSON.parse(
      await fs.readFile(
        path.join(root, "artifacts/primitives/registry/kind-primitives.json"),
        "utf8",
      ),
    ),
  );
for (const [name, version] of Object.entries(manifest.dependencies)) {
  assert.ok(
    registry.dependencies.includes(`${name}@${version}`),
    `Missing registry dependency ${name}`,
  );
}
for (const file of registry.files) {
  const target = path.resolve(consumer, "copied", file.target);
  assert.ok(target.startsWith(`${consumer}/copied/`), "Registry target escaped the consumer");
  assert.doesNotMatch(file.content, /["']@kind-ui\/primitives(?:\/|["'])/);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, file.content);
}
for (const mode of ["NodeNext", "Bundler"]) {
  await fs.writeFile(
    path.join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: mode === "Bundler" ? "ESNext" : "NodeNext",
        moduleResolution: mode,
        jsx: "react-jsx",
        strict: true,
        exactOptionalPropertyTypes: true,
        skipLibCheck: true,
        noEmit: true,
      },
      // Copied source uses extensionless imports, as shadcn's Bundler consumers do.
      include: [
        "*.types.tsx",
        ...(mode === "Bundler" ? ["copied/**/*.ts", "copied/**/*.tsx"] : []),
      ],
    }),
  );
  execFileSync(path.join(consumer, "node_modules/.bin/tsc"), ["-p", "tsconfig.json"], {
    cwd: consumer,
    stdio: "inherit",
  });
}
const checksum = createHash("sha256")
  .update(await fs.readFile(tarball))
  .digest("hex");
await fs.writeFile(
  path.join(output, "receipt.json"),
  `${JSON.stringify(
    {
      tarball,
      sha256: checksum,
      consumer,
      peers,
      resolution: ["NodeNext", "Bundler"],
      copiedSource: "Bundler",
      runtimeTests: families,
    },
    null,
    2,
  )}\n`,
);
console.log(`Verified private primitive tarball and copied source: ${checksum}`);
