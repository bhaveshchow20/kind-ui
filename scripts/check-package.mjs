import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { assertLineConsumerSource } from "./line-consumer-contract.mjs";
import { assertPackageContract } from "./package-contract.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.env.npm_execpath;
assert.ok(npm, "Use npm run check:package to run the packed-package gate");
const peerNames = [
  "react",
  "react-dom",
  "react-is",
  "recharts",
  "motion",
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
    env: {
      ...process.env,
      NODE_PATH: "",
    },
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
      "await import('@kind-ui/charts'); await import('motion/react'); try { import.meta.resolve('@kind-ui/charts/motion') } catch (error) { if (error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') process.exit(0); throw error } throw new Error('Removed motion subpath must not resolve')",
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
  async function copyFixture(folder, file, target = file) {
    const source = await readFile(join(root, "tests/fixtures", folder, file), "utf8");
    if (["line", "area", "bar", "pie", "combined"].includes(folder) && file.endsWith(".tsx"))
      assertLineConsumerSource(source);
    await writeFile(join(consumer, target), source);
  }
  async function typecheck(files) {
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
          files,
        }),
      );
      run(
        process.execPath,
        [join(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
        consumer,
      );
    }
  }
  async function production(entry, outDir) {
    await build({
      configFile: false,
      root: consumer,
      logLevel: "warn",
      build: {
        outDir: join(root, "artifacts", outDir),
        emptyOutDir: true,
        rolldownOptions: { input: join(consumer, entry) },
      },
    });
  }
  await writeFile(
    join(consumer, "index.tsx"),
    await readFile(join(root, "tests/consumer.tsx"), "utf8"),
  );
  await writeFile(
    join(consumer, "chart.test.mjs"),
    await readFile(join(root, "tests/chart.test.mjs"), "utf8"),
  );
  run(process.execPath, ["--test", "chart.test.mjs"], consumer);
  for (const file of ["host.tsx", "static.tsx", "static.html"]) await copyFixture("line", file);
  await typecheck(["index.tsx", "host.tsx", "static.tsx"]);
  await production("static.html", "packed-line-static");
  console.log(
    "Static line consumer: strict NodeNext/Bundler and production build passed with required Motion peer",
  );
  for (const file of ["motion.tsx", "motion.html"]) await copyFixture("line", file);
  await typecheck(["host.tsx", "motion.tsx"]);
  await production("motion.html", "packed-line-motion");
  console.log(
    "Motion line consumer: strict NodeNext/Bundler and production build passed using the same packed public imports",
  );
  for (const file of ["host.tsx", "static.tsx", "static.html", "motion.tsx", "motion.html"])
    await copyFixture("area", file);
  await typecheck(["host.tsx", "static.tsx", "motion.tsx"]);
  await production("static.html", "packed-area-static");
  await production("motion.html", "packed-area-motion");
  console.log(
    "Packed area public exports: strict NodeNext/Bundler and static/Motion production builds passed; host fixtures only, no implementation copying",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("bar", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-bar");
  console.log(
    "Bar tarball consumer: guarded public imports, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("pie", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-pie");
  console.log(
    "Pie tarball consumer: guarded public imports, strict NodeNext/Bundler and production build passed",
  );
  await copyFixture("combined", "host.tsx");
  await copyFixture("combined", "main.tsx", "combined.tsx");
  await copyFixture("combined", "index.html", "combined.html");
  await typecheck(["host.tsx", "combined.tsx"]);
  await production("combined.html", "packed-combined");
  console.log(
    "Combined area/bar tarball consumer: strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["index.html", "main.tsx", "consumer.css", "motion.tsx"])
    await copyFixture("styling", file);
  await typecheck(["index.tsx", "main.tsx", "motion.tsx"]);
  await production("index.html", "packed-chart");

  // Separate host recipe evidence, outside the public line/area/bar fixture proof.
  const legacy = join(consumer, "legacy");
  await mkdir(legacy);
  for (const file of [
    "recipe-motion.tsx",
    "bar-recipes.tsx",
    "area-recipes.tsx",
    "use-reduced-motion.ts",
  ]) {
    await writeFile(join(legacy, file), await readFile(join(root, "examples/chart", file), "utf8"));
  }
  await writeFile(
    join(legacy, "recipe-consumer.tsx"),
    await readFile(join(root, "tests/recipe-consumer.tsx"), "utf8"),
  );
  await typecheck(["legacy/recipe-consumer.tsx"]);
  console.log(
    "Migrated area and bar host recipe typechecks passed; separate from packed public-export proof",
  );
  console.log(
    "Packed contents, CSS, license, ESM import, component tests, strict consumers and production styling build passed",
  );
} finally {
  await rm(scratch, { recursive: true, force: true });
}
