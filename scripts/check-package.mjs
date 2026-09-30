import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { assertPackageContract } from "./package-contract.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.env.npm_execpath;
assert.ok(npm, "Use npm run check:package to run the packed-package gate");
const rootManifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
assert.equal(rootManifest.private, true, "Workspace must remain private");
const scratch = await mkdtemp(join(tmpdir(), "kind-ui-package-"));
function run(command, args, cwd = root) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NODE_PATH: "" },
    stdio: ["ignore", "pipe", "inherit"],
  });
}
try {
  const workspacePath = await realpath(root);
  const scratchPath = await realpath(scratch);
  assert.ok(
    scratchPath !== workspacePath && !scratchPath.startsWith(workspacePath + sep),
    "Temporary consumer must be outside the workspace",
  );
  const [packed] = JSON.parse(
    run(process.execPath, [
      npm,
      "pack",
      "--workspace",
      "kind-ui",
      "--ignore-scripts",
      "--json",
      "--pack-destination",
      scratch,
    ]),
  );
  assert.equal(packed.filename, basename(packed.filename), "Unexpected tarball path");
  const consumer = join(scratch, "consumer");
  await mkdir(consumer);
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run(
    process.execPath,
    [
      npm,
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      "--workspaces=false",
      join(scratch, packed.filename),
    ],
    consumer,
  );
  const installed = join(consumer, "node_modules", "kind-ui");
  assert.equal(
    await realpath(installed),
    join(await realpath(consumer), "node_modules", "kind-ui"),
    "Consumer must use the tarball, not a workspace link",
  );
  const manifest = JSON.parse(await readFile(join(installed, "package.json"), "utf8"));
  assertPackageContract(
    manifest,
    packed.files.map((file) => file.path),
  );
  assert.equal(
    await readFile(join(installed, "LICENSE"), "utf8"),
    await readFile(join(root, "LICENSE"), "utf8"),
    "Packed license must match the repository license",
  );
  run(process.execPath, ["--input-type=module", "-e", "await import('kind-ui')"], consumer);
  await writeFile(join(consumer, "index.ts"), 'import * as ui from "kind-ui";\nvoid ui;\n');
  for (const mode of ["NodeNext", "Bundler"]) {
    await writeFile(
      join(consumer, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: mode === "Bundler" ? "ESNext" : mode,
          moduleResolution: mode,
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          typeRoots: [join(consumer, "node_modules", "@types")],
        },
        include: ["index.ts"],
      }),
    );
    run(
      process.execPath,
      [join(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
      consumer,
    );
  }
  console.log("Packed contents, license, ESM import, NodeNext and Bundler declarations passed");
} finally {
  await rm(scratch, { recursive: true, force: true });
}
