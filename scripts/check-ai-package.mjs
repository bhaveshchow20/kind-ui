import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "artifacts/ai/package");
await fs.mkdir(output, { recursive: true });
await fs.rm(path.join(output, "receipt.json"), { force: true });
const manifestSchema = z.object({
  name: z.string(),
  version: z.literal("0.0.0"),
  private: z.literal(true),
  peerDependencies: z.record(z.string(), z.string()),
  exports: z.record(z.string(), z.unknown()),
});
const manifest = manifestSchema.parse(
  JSON.parse(await fs.readFile(path.join(root, "packages/ai/package.json"), "utf8")),
);
assert.equal(manifest.name, "@kind-ui/ai");
const workspace = z
  .object({ devDependencies: z.record(z.string(), z.string()) })
  .parse(JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")));
const peers = Object.fromEntries(
  Object.keys(manifest.peerDependencies).map((name) => {
    const version = workspace.devDependencies[name];
    assert.ok(version, `Pin the ${name} consumer peer in the workspace`);
    return [name, version];
  }),
);
for (const name of ["primitives", "ai"]) {
  execFileSync("npm", ["pack", "--workspace", `@kind-ui/${name}`, "--pack-destination", output], {
    cwd: root,
    stdio: "inherit",
  });
}
const tarball = path.join(output, "kind-ui-ai-0.0.0.tgz");
const consumer = await fs.mkdtemp(path.join(os.tmpdir(), "kind-ai-consumer-"));
try {
  await fs.writeFile(
    path.join(consumer, "package.json"),
    JSON.stringify({
      name: "kind-ai-isolated-consumer",
      private: true,
      type: "module",
      dependencies: {
        "@kind-ui/ai": `file:${tarball}`,
        "@kind-ui/primitives": `file:${path.join(output, "kind-ui-primitives-0.0.0.tgz")}`,
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
  const packed = path.join(consumer, "node_modules/@kind-ui/ai");
  for (const file of [
    "LICENSE",
    "THIRD_PARTY.md",
    "src/styles.css",
    "licenses/ai-elements-NOTICE",
    "licenses/assistant-ui-LICENSE",
    "licenses/lucide-LICENSE",
  ]) {
    await fs.access(path.join(packed, file));
  }
  for (const name of await fs.readdir(path.join(root, "packages/ai/src"))) {
    if (!/\.tsx?$/.test(name)) continue;
    const stem = name.replace(/\.tsx?$/, "");
    for (const extension of ["js", "d.ts"])
      await fs.access(path.join(packed, `dist/${stem}.${extension}`));
  }
  const entries = Object.keys(manifest.exports).filter((entry) => !entry.endsWith(".css"));
  await fs.writeFile(
    path.join(consumer, "exports.mjs"),
    entries
      .map(
        (entry) =>
          `await import(${JSON.stringify(entry === "." ? manifest.name : `${manifest.name}/${entry.slice(2)}`)});`,
      )
      .join("\n"),
  );
  execFileSync(process.execPath, ["exports.mjs"], { cwd: consumer, stdio: "inherit" });
  for (const excluded of ["charts", "ai-sdk"]) {
    await assert.rejects(fs.access(path.join(consumer, `node_modules/@kind-ui/${excluded}`)));
  }
  await assert.rejects(fs.access(path.join(consumer, "node_modules/ai")));
  /** @type {string[]} */
  const runtimeTests = [];
  /** @type {string[]} */
  const typeTests = [];
  for (const directory of ["tests", "packages/ai/tests"]) {
    const source = path.join(root, directory);
    const files = await fs.readdir(source).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    for (const name of files) {
      if (directory === "tests" && !name.startsWith("ai-")) continue;
      if (!/\.(test\.mjs|types\.tsx)$/.test(name)) continue;
      await fs.copyFile(path.join(source, name), path.join(consumer, name));
      (name.endsWith(".test.mjs") ? runtimeTests : typeTests).push(name);
    }
  }
  assert.ok(runtimeTests.length, "Add public-export AI component tests");
  assert.ok(typeTests.length, "Add strict AI consumer types");
  execFileSync(process.execPath, ["--test", ...runtimeTests], { cwd: consumer, stdio: "inherit" });
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
        include: typeTests,
      }),
    );
    execFileSync(path.join(consumer, "node_modules/.bin/tsc"), ["-p", "tsconfig.json"], {
      cwd: consumer,
      stdio: "inherit",
    });
  }
  const sha256 = createHash("sha256")
    .update(await fs.readFile(tarball))
    .digest("hex");
  await fs.writeFile(
    path.join(output, "receipt.json"),
    `${JSON.stringify(
      {
        tarball,
        sha256,
        peers,
        runtimeTests,
        typeTests,
        resolution: ["NodeNext", "Bundler"],
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Verified private AI tarball: ${sha256}`);
} finally {
  await fs.rm(consumer, { recursive: true, force: true });
}
