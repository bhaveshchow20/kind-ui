import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { browserDirectives } from "./browser-directives.mjs";
import { checkTypes } from "./check-types.mjs";
import { assertDocumentationContract } from "./documentation-contract.mjs";
import {
  assertCompositionConsumerSource,
  assertLineConsumerSource,
} from "./line-consumer-contract.mjs";
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
const artifactDestination = join(root, "artifacts/package");
if (process.argv.includes("--keep-artifact")) {
  // A failed rerun must not leave an earlier artifact marked as validated.
  await rm(artifactDestination, { recursive: true, force: true });
}
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
  run(process.execPath, [
    "--test",
    "scripts/package-contract.test.mjs",
    "scripts/documentation-contract.test.mjs",
    "scripts/line-consumer-contract.test.mjs",
  ]);
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
      "--json",
      "--pack-destination",
      scratch,
    ]),
  );
  assert.equal(packed.filename, basename(packed.filename), "Unexpected tarball path");
  const tarball = join(scratch, packed.filename);
  const tarballBytes = await readFile(tarball);
  const sha256 = createHash("sha256").update(tarballBytes).digest("hex");
  assert.equal(
    `sha512-${createHash("sha512").update(tarballBytes).digest("base64")}`,
    packed.integrity,
    "Tarball must match npm pack integrity before installation",
  );
  // Ordinary React host: installing Kind alone must resolve its required engine
  // peers. Keep this distinct from the fully pinned reproducibility consumer.
  const ordinary = join(scratch, "ordinary-host");
  await mkdir(ordinary);
  await writeFile(
    join(ordinary, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: {
        react: rootManifest.devDependencies.react,
        "react-dom": rootManifest.devDependencies["react-dom"],
      },
      devDependencies: {
        "@types/react": rootManifest.devDependencies["@types/react"],
        "@types/react-dom": rootManifest.devDependencies["@types/react-dom"],
      },
    }),
  );
  run(
    process.execPath,
    [
      npm,
      "install",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      "--workspaces=false",
      tarball,
    ],
    ordinary,
  );
  run(process.execPath, [npm, "ls", "--all", "--json"], ordinary);
  const ordinaryConsumerVersions = {};
  for (const name of ["react", "react-dom", "react-is", "recharts", "motion"]) {
    ordinaryConsumerVersions[name] = JSON.parse(
      await readFile(join(ordinary, "node_modules", name, "package.json"), "utf8"),
    ).version;
  }
  for (const file of ["chart.test.mjs", "configured-line.test.mjs", "consumer.tsx"]) {
    await copyFile(join(root, "tests", file), join(ordinary, file));
  }
  run(process.execPath, ["--test", "chart.test.mjs", "configured-line.test.mjs"], ordinary);
  for (const mode of ["NodeNext", "Bundler"]) {
    await writeFile(
      join(ordinary, "tsconfig.json"),
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
          typeRoots: [join(ordinary, "node_modules/@types")],
        },
        files: ["consumer.tsx"],
      }),
    );
    run(
      process.execPath,
      [join(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
      ordinary,
    );
  }
  console.log(
    `Ordinary npm React host: Kind-only install, peer graph, component tests and strict types passed (${JSON.stringify(ordinaryConsumerVersions)})`,
  );
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
    (await readdir(join(root, "packages/charts/src"), { recursive: true })).filter((file) =>
      /\.tsx?$/.test(file),
    ),
  );
  assertDocumentationContract(
    await readFile(join(installed, "README.md"), "utf8"),
    await readdir(join(root, "examples/chart")),
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
    if (
      [
        "line",
        "area",
        "bar",
        "emphasis",
        "pie",
        "identity-colors",
        "combined",
        "polar",
        "combo",
        "scatter",
        "heatmap",
        "waterfall",
        "sankey",
        "histogram",
        "box-plot",
        "number-shuffle",
        "activity-rings",
      ].includes(folder) &&
      file.endsWith(".tsx")
    )
      assertLineConsumerSource(source);
    await writeFile(join(consumer, target), source);
  }
  async function typecheck(files) {
    await checkTypes(consumer, join(root, "node_modules/typescript/bin/tsc"), files);
  }
  async function production(entry, outDir, developmentReact = false) {
    const diagnostics = browserDirectives(consumer, [join(consumer, "host.tsx")]);
    await build({
      plugins: [diagnostics.plugin],
      configFile: false,
      root: consumer,
      logLevel: "warn",
      ...(developmentReact ? { define: { "process.env.NODE_ENV": '"development"' } } : {}),
      build: {
        outDir: join(root, "artifacts", outDir),
        emptyOutDir: true,
        rolldownOptions: { input: join(consumer, entry), onwarn: diagnostics.onwarn },
      },
    });
  }
  assert.match(
    await readFile(join(installed, "dist/index.js"), "utf8"),
    /^"use client";/,
    "Public reexports must retain the Next client boundary",
  );
  assertCompositionConsumerSource(
    await readFile(join(root, "tests/fixtures/composition/host.tsx"), "utf8"),
  );
  for (const file of ["host.tsx", "main.tsx", "contract.tsx", "index.html"])
    await copyFixture("composition", file);
  await typecheck(["host.tsx", "main.tsx", "contract.tsx"]);
  await production("index.html", "packed-composition");
  console.log(
    "Single-package named/namespace Cartesian, polar, scatter and pie compositions: strict NodeNext/Bundler parity and production build passed",
  );

  assertCompositionConsumerSource(
    await readFile(join(root, "tests/fixtures/configured-line/host.tsx"), "utf8"),
  );
  for (const file of ["host.tsx", "main.tsx", "contract.tsx", "index.html"])
    await copyFixture("configured-line", file);
  await typecheck(["host.tsx", "main.tsx", "contract.tsx"]);
  await production("index.html", "packed-configured-line");
  console.log(
    "Configured LineChart: public-only standalone/explicit/controlled consumers, generic props and strict NodeNext/Bundler passed",
  );

  await copyFixture("activity-rings", "index.html", "activity-rings.html");
  await copyFixture("activity-rings", "main.tsx");
  await typecheck(["main.tsx"]);
  await production("activity-rings.html", "packed-activity-rings");
  await writeFile(
    join(consumer, "activity-rings.test.mjs"),
    await readFile(join(root, "tests/activity-rings.test.mjs"), "utf8"),
  );
  run(process.execPath, ["--test", "activity-rings.test.mjs"], consumer);
  console.log(
    "ActivityRings: packed component tests, strict NodeNext/Bundler and production build passed",
  );

  // Compare the public surface with the same native-only consumer. A primitive
  // import must not pull Kind interaction/Motion into the production bundle.
  const bundleSizes = [];
  for (const source of ["@kind-ui/charts", "recharts"]) {
    await writeFile(
      join(consumer, "primitive.tsx"),
      `import { XAxis } from "${source}"; window.axis = XAxis;`,
    );
    const result = await build({
      configFile: false,
      root: consumer,
      logLevel: "warn",
      build: { write: false, rolldownOptions: { input: join(consumer, "primitive.tsx") } },
    });
    const chunks = result.output.filter((item) => item.type === "chunk");
    bundleSizes.push(chunks.reduce((bytes, chunk) => bytes + Buffer.byteLength(chunk.code), 0));
    for (const chunk of chunks) {
      assert.ok(
        !chunk.moduleIds.some((id) =>
          /(?:motion|framer-motion|motion-dom|motion-utils)\//.test(id),
        ),
        "Primitive consumer must tree-shake Motion",
      );
      assert.ok(
        !chunk.moduleIds.some((id) => /@kind-ui\/charts\/dist\/(?!index\.js)/.test(id)),
        "Primitive consumer must tree-shake Kind runtime",
      );
    }
  }
  assert.ok(
    Math.abs(bundleSizes[0] - bundleSizes[1]) <= 100,
    `Public/native primitive bundle difference must remain negligible: ${bundleSizes}`,
  );
  console.log(
    `Primitive-only production tree-shaking: public/native bytes ${bundleSizes.join("/")}; no Kind interaction or Motion runtime`,
  );

  const genericsConsumer = await readFile(join(root, "tests/series-generics-consumer.tsx"), "utf8");
  assertLineConsumerSource(genericsConsumer);
  await writeFile(join(consumer, "series-generics-consumer.tsx"), genericsConsumer);
  await typecheck(["series-generics-consumer.tsx"]);
  console.log("Line/Bar generics: packed public-only strict NodeNext/Bundler consumers passed");
  await writeFile(
    join(consumer, "index.tsx"),
    await readFile(join(root, "tests/consumer.tsx"), "utf8"),
  );
  await writeFile(
    join(consumer, "chart.test.mjs"),
    await readFile(join(root, "tests/chart.test.mjs"), "utf8"),
  );
  await writeFile(
    join(consumer, "configured-line.test.mjs"),
    await readFile(join(root, "tests/configured-line.test.mjs"), "utf8"),
  );
  run(process.execPath, ["--test", "chart.test.mjs", "configured-line.test.mjs"], consumer);
  for (const file of ["index.html", "main.tsx"]) await copyFixture("number-shuffle", file);
  await typecheck(["main.tsx"]);
  await production("index.html", "packed-number-shuffle");
  console.log(
    "Optional tooltip shuffle: public-only tarball NodeNext/Bundler types and production build passed",
  );
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
  for (const file of ["entrance.tsx", "entrance.html"]) await copyFixture("bar", file);
  await copyFile(
    join(root, "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"),
    join(consumer, "entrance-font.woff2"),
  );
  await typecheck(["entrance.tsx"]);
  await production("entrance.html", "packed-bar-entrance");
  console.log(
    "Bar tarball consumer: guarded public imports, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("waterfall", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-waterfall");
  console.log(
    "Waterfall tarball: guarded public imports, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("scatter", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-scatter");
  for (const file of ["legend.tsx", "legend.html"]) await copyFixture("scatter", file);
  await typecheck(["legend.tsx"]);
  await production("legend.html", "packed-scatter-legend");
  console.log(
    "Scatter tarball consumer: guarded public imports, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "contract.tsx", "index.html"])
    await copyFixture("heatmap", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await typecheck(["contract.tsx"]);
  await production("index.html", "packed-heatmap");
  console.log(
    "Heatmap tarball: public composition, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"])
    await copyFixture("identity-colors", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-identity-colors");
  console.log(
    "Identity colors: packed public consumer, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("pie", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-pie");
  console.log(
    "Pie tarball consumer: guarded public imports, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("polar", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-polar");
  await production("index.html", "packed-polar-development", true);
  console.log("Radar/radial tarball consumer: strict NodeNext/Bundler and production build passed");
  const polarGallery = await readFile(join(root, "examples/chart/polar-gallery.tsx"), "utf8");
  assertLineConsumerSource(polarGallery);
  await writeFile(join(consumer, "host.tsx"), polarGallery);
  for (const file of ["gallery.tsx", "gallery.html"]) await copyFixture("polar", file);
  await typecheck(["host.tsx", "gallery.tsx"]);
  await production("gallery.html", "packed-polar-gallery");
  console.log(
    "All 18 polar gallery composition paths: guarded public imports, strict NodeNext/Bundler and tarball build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("histogram", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-histogram");
  console.log("Histogram tarball: strict NodeNext/Bundler and public-only production build passed");
  await copyFixture("combined", "host.tsx");
  await copyFixture("combined", "main.tsx", "combined.tsx");
  await copyFixture("combined", "index.html", "combined.html");
  await typecheck(["host.tsx", "combined.tsx"]);
  await production("combined.html", "packed-combined");
  console.log(
    "Combined area/bar tarball consumer: strict NodeNext/Bundler and production build passed",
  );
  await copyFixture("combo", "host.tsx");
  await copyFixture("combo", "main.tsx", "combo.tsx");
  await copyFixture("combo", "index.html", "combo.html");
  await typecheck(["host.tsx", "combo.tsx"]);
  await production("combo.html", "packed-combo");
  console.log(
    "Combo tarball: guarded public imports, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("sankey", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-sankey");
  console.log(
    "Sankey tarball: guarded public exports, strict NodeNext/Bundler and production build passed",
  );
  for (const file of ["index.html", "main.tsx", "consumer.css", "motion.tsx"])
    await copyFixture("styling", file);
  await typecheck(["index.tsx", "main.tsx", "motion.tsx"]);
  await production("index.html", "packed-chart");

  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("box-plot", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-box-plot");
  console.log("Box plot tarball: public-only strict NodeNext/Bundler and production build passed");

  // The actual presentation recipe is independently checked through the installed tarball.
  for (const file of [
    "use-reduced-motion.ts",
    "presentation.tsx",
    "presentation-main.tsx",
    "presentation.css",
    "presentation.html",
  ]) {
    const source = await readFile(join(root, "examples/chart", file), "utf8");
    if (file.endsWith(".tsx") || file.endsWith(".ts")) assertLineConsumerSource(source);
    await writeFile(join(consumer, file), source);
  }
  await typecheck(["presentation.tsx", "presentation-main.tsx"]);
  await production("presentation.html", "packed-presentation");
  console.log(
    "Presentation recipe: guarded public imports, strict NodeNext/Bundler and tarball production build passed",
  );

  await copyFixture("emphasis", "index.html");
  await copyFixture("emphasis", "main.tsx");
  await typecheck(["main.tsx"]);
  await production("index.html", "packed-emphasis");
  console.log("Emphasis tarball: strict NodeNext/Bundler and production build passed");

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
  if (process.argv.includes("--keep-artifact")) {
    const destination = artifactDestination;
    await mkdir(destination, { recursive: true });
    assert.equal(
      createHash("sha256")
        .update(await readFile(tarball))
        .digest("hex"),
      sha256,
      "Tested tarball must not change before retention",
    );
    await copyFile(tarball, join(destination, packed.filename));
    assert.equal(
      createHash("sha256")
        .update(await readFile(join(destination, packed.filename)))
        .digest("hex"),
      sha256,
    );
    await writeFile(
      join(destination, "validated-artifact.json"),
      `${JSON.stringify(
        {
          filename: packed.filename,
          sha256,
          integrity: packed.integrity,
          package: { name: manifest.name, version: manifest.version },
          source: {
            checkoutCommit: run("git", ["rev-parse", "HEAD"]).trim(),
            pullRequestHeadCommit: process.env.KIND_UI_PR_HEAD_SHA || null,
            pullRequestBaseCommit: process.env.KIND_UI_PR_BASE_SHA || null,
            dirty: run("git", ["status", "--porcelain"]).trim().length > 0,
          },
          workflow: {
            runId: process.env.GITHUB_RUN_ID || null,
            runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
            event: process.env.GITHUB_EVENT_NAME || null,
            runUrl: process.env.GITHUB_RUN_ID
              ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
              : null,
          },
          tools: {
            node: process.version,
            npm: run(process.execPath, [npm, "--version"]).trim(),
            typescript: rootManifest.devDependencies.typescript,
            vite: rootManifest.devDependencies.vite,
          },
          consumerVersions: Object.fromEntries(
            peerNames.map((name) => [name, rootManifest.devDependencies[name]]),
          ),
          ordinaryConsumerVersions,
          validation: "installed tarball package gate; aggregate browser checks are separate",
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Validated artifact: ${join(destination, packed.filename)} (SHA-256 ${sha256})`);
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
