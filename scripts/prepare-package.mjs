import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdir, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { assertDocumentationContract } from "./documentation-contract.mjs";
import { assertPackageContract } from "./package-contract.mjs";
import { npmPackSchema, packageManifestSchema, parseJson } from "./tooling-schemas.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const charts = fileURLToPath(new URL("../packages/charts/", import.meta.url));
const npm = process.env.npm_execpath;
assert.ok(npm, "Run npm pack --workspace @kind-ui/charts from the repository");
/** @param {string[]} args @param {string} cwd */
function run(args, cwd) {
  return execFileSync(process.execPath, [npm ?? "", ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

// A clean rebuild prevents stale output from surviving removed/renamed sources.
await rm(new URL("../packages/charts/dist/", import.meta.url), { recursive: true, force: true });
run(["run", "build"], root);
const [packed] = npmPackSchema.parse(
  parseJson(run(["pack", "--dry-run", "--ignore-scripts", "--json"], charts)),
);
assert.ok(packed, "npm pack must return one artifact");
const files = packed.files.map((file) => file.path);
const manifest = packageManifestSchema.parse(
  parseJson(await readFile(new URL("../packages/charts/package.json", import.meta.url), "utf8")),
);
const sources = (
  await readdir(new URL("../packages/charts/src/", import.meta.url), { recursive: true })
).filter((file) => /\.tsx?$/.test(file));
assertPackageContract(manifest, files, sources);
assertDocumentationContract(
  await readFile(new URL("../packages/charts/README.md", import.meta.url), "utf8"),
  files,
);
