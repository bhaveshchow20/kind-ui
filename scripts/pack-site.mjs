#!/usr/bin/env node
// Packs the built docs site and registry into the release asset kindui.dev serves:
// artifacts/site/charts-site-<version>.tar.gz, with docs/ and r/ at its root, and its .sha256.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "packages/charts/package.json"), "utf8"));
const outDir = join(root, "artifacts/site");
const stage = join(outDir, "stage");
const sources = {
  docs: ["apps/docs/out", "npm run build:docs"],
  r: ["artifacts/registry/r", "npm run build:registry"],
};

rmSync(outDir, { recursive: true, force: true });
for (const [name, [source, command]] of Object.entries(sources)) {
  if (!existsSync(join(root, source))) throw new Error(`${source} is missing; run \`${command}\``);
  cpSync(join(root, source), join(stage, name), { recursive: true });
}
const asset = `charts-site-${version}.tar.gz`;
execFileSync("tar", ["-czf", join(outDir, asset), "-C", stage, ...Object.keys(sources)]);
rmSync(stage, { recursive: true });
const sha256 = createHash("sha256")
  .update(readFileSync(join(outDir, asset)))
  .digest("hex");
writeFileSync(join(outDir, `${asset}.sha256`), `${sha256}  ${asset}\n`);
console.log(`packed artifacts/site/${asset} (${sha256})`);
