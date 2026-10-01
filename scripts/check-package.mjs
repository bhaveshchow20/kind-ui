import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { assertPackageContract } from "./package-contract.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.env.npm_execpath;
assert.ok(npm, "Use npm run check:package to run the packed-package gate");
const peerNames = [
  "react",
  "react-dom",
  "react-is",
  "recharts",
  "@types/react",
  "@types/react-dom",
];
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
      "@kind-ui/charts",
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
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      "--workspaces=false",
      join(scratch, packed.filename),
      ...peerNames.map((name) => `${name}@${rootManifest.devDependencies[name]}`),
    ],
    consumer,
  );
  run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "await import('@kind-ui/charts'); try { import.meta.resolve('motion') } catch (error) { if (error.code === 'ERR_MODULE_NOT_FOUND') process.exit(0); throw error } throw new Error('Baseline must not install Motion')",
    ],
    consumer,
  );
  run(
    process.execPath,
    [
      npm,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      "--workspaces=false",
      `motion@${rootManifest.devDependencies.motion}`,
    ],
    consumer,
  );
  const installed = join(consumer, "node_modules", "@kind-ui/charts");
  assert.equal(
    await realpath(installed),
    join(await realpath(consumer), "node_modules", "@kind-ui/charts"),
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
  run(process.execPath, ["--input-type=module", "-e", "await import('@kind-ui/charts')"], consumer);
  assert.equal(
    await readFile(join(installed, "dist/styles.css"), "utf8"),
    await readFile(join(root, "packages/charts/src/styles.css"), "utf8"),
    "Packed CSS must match the component defaults",
  );
  for (const file of ["index.html", "main.tsx", "consumer.css", "motion.tsx"]) {
    await writeFile(
      join(consumer, file),
      await readFile(join(root, "tests/fixtures/styling", file)),
    );
  }
  await writeFile(
    join(consumer, "chart.test.mjs"),
    await readFile(join(root, "tests/chart.test.mjs"), "utf8"),
  );
  run(process.execPath, ["--test", "chart.test.mjs"], consumer);
  await writeFile(
    join(consumer, "index.tsx"),
    await readFile(join(root, "tests/consumer.tsx"), "utf8"),
  );
  for (const file of [
    "line-recipes.tsx",
    "line-motion.tsx",
    "recipe-motion.tsx",
    "bar-recipes.tsx",
    "area-recipes.tsx",
    "use-reduced-motion.ts",
  ]) {
    await writeFile(
      join(consumer, file),
      await readFile(join(root, "examples/chart", file), "utf8"),
    );
  }
  await writeFile(
    join(consumer, "recipe-consumer.tsx"),
    await readFile(join(root, "tests/recipe-consumer.tsx"), "utf8"),
  );
  for (const mode of ["NodeNext", "Bundler"]) {
    await writeFile(
      join(consumer, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          jsx: "react-jsx",
          esModuleInterop: true,
          module: mode === "Bundler" ? "ESNext" : mode,
          moduleResolution: mode,
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          typeRoots: [join(consumer, "node_modules", "@types")],
        },
        include: [
          "index.tsx",
          "main.tsx",
          "motion.tsx",
          "line-recipes.tsx",
          "area-recipes.tsx",
          "recipe-consumer.tsx",
        ],
      }),
    );
    run(
      process.execPath,
      [join(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
      consumer,
    );
  }
  await build({
    configFile: false,
    root: consumer,
    logLevel: "warn",
    build: { outDir: join(root, "artifacts/packed-chart"), emptyOutDir: true },
  });
  console.log(
    "Packed contents, CSS, license, ESM import, component tests, strict consumers and production styling build passed",
  );
} finally {
  await rm(scratch, { recursive: true, force: true });
}
