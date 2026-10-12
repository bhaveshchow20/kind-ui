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
import tailwindcss from "@tailwindcss/vite";
import { publint } from "publint";
import { formatMessage } from "publint/utils";
import { build } from "vite";
import { browserDirectives } from "./browser-directives.mjs";
import { checkBundleContract } from "./bundle-contract.mjs";
import { checkTypes } from "./check-types.mjs";
import { assertDocumentationContract } from "./documentation-contract.mjs";
import { writeFixtureEntry } from "./fixture-entry.mjs";
import {
  assertCompositionConsumerSource,
  assertLineConsumerSource,
} from "./line-consumer-contract.mjs";
import { assertPackageContract } from "./package-contract.mjs";
import {
  artifactReceiptSchema,
  npmPackSchema,
  packageIdentitySchema,
  packageManifestSchema,
  parseJson,
  workspaceManifestSchema,
} from "./tooling-schemas.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.env.npm_execpath;
assert.ok(npm, "Use npm run check:package to run the packed-package gate");
const peerNames = [
  "react",
  "react-dom",
  "react-is",
  "recharts",
  "motion",
  "tailwindcss",
  "@types/react",
  "@types/react-dom",
];
const rootManifest = workspaceManifestSchema.parse(
  parseJson(await readFile(join(root, "package.json"), "utf8")),
);
assert.equal(rootManifest.private, true, "Workspace must remain private");
const pinnedConsumerVersions = Object.fromEntries(
  peerNames.map((name) => [name, rootManifest.devDependencies[name]]),
);
// Match the checked-in root lock for Motion's ranged implementation dependencies.
// Ordinary npm host resolution stays independent and deliberately unpinned.
for (const name of ["framer-motion", "motion-dom", "motion-utils"]) {
  pinnedConsumerVersions[name] = packageIdentitySchema.parse(
    parseJson(await readFile(join(root, "node_modules", name, "package.json"), "utf8")),
  ).version;
}
const scratch = await mkdtemp(join(tmpdir(), "kind-ui-package-"));
const artifactDestination = join(root, "artifacts/package");
if (process.argv.includes("--keep-artifact")) {
  // A failed rerun must not leave an earlier artifact marked as validated.
  await rm(artifactDestination, { recursive: true, force: true });
}
/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} [cwd]
 * @param {"pipe" | "inherit"} [output]
 */
function run(command, args, cwd = root, output = "pipe") {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_PATH: "",
    },
    stdio: ["ignore", output, "inherit"],
  });
}
/** @param {import("vite").InlineConfig} config */
async function buildOutput(config) {
  const result = await build(config);
  assert.ok(!Array.isArray(result) && "output" in result, "Expected a single completed Vite build");
  return result;
}
try {
  run(process.execPath, [
    "--test",
    "scripts/package-contract.test.mjs",
    "scripts/documentation-contract.test.mjs",
    "scripts/line-consumer-contract.test.mjs",
    "scripts/bundle-contract.test.mjs",
  ]);
  const workspacePath = await realpath(root);
  const scratchPath = await realpath(scratch);
  assert.ok(
    scratchPath !== workspacePath && !scratchPath.startsWith(workspacePath + sep),
    "Temporary consumer must be outside the workspace",
  );
  const [packed] = npmPackSchema.parse(
    parseJson(
      run(process.execPath, [
        npm,
        "pack",
        "--workspace",
        "@kind-ui/charts",
        "--json",
        "--pack-destination",
        scratch,
      ]),
    ),
  );
  assert.ok(packed, "Expected one npm pack result");
  assert.equal(packed.filename, basename(packed.filename), "Unexpected tarball path");
  const tarball = join(scratch, packed.filename);
  const tarballBytes = await readFile(tarball);
  const sha256 = createHash("sha256").update(tarballBytes).digest("hex");
  assert.equal(
    `sha512-${createHash("sha512").update(tarballBytes).digest("base64")}`,
    packed.integrity,
    "Tarball must match npm pack integrity before installation",
  );
  const packageLint = await publint({
    pack: {
      tarball: tarballBytes.buffer.slice(
        tarballBytes.byteOffset,
        tarballBytes.byteOffset + tarballBytes.byteLength,
      ),
    },
    strict: true,
    level: "error",
  });
  assert.equal(
    packageLint.messages.length,
    0,
    packageLint.messages.map((message) => formatMessage(message, packageLint.pkg)).join("\n"),
  );
  // The package declares ESM imports only. ATTW still checks every exported
  // entrypoint in supported ESM/Bundler modes without adding a CJS promise.
  run(
    process.execPath,
    [
      join(root, "node_modules/@arethetypeswrong/cli/dist/index.js"),
      tarball,
      "--profile",
      "esm-only",
    ],
    root,
    "inherit",
  );
  console.log("Exact packed artifact: strict publint and ATTW ESM profile passed");
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
  /** @type {Record<string, string>} */
  const ordinaryConsumerVersions = {};
  for (const name of ["react", "react-dom", "react-is", "recharts", "motion"]) {
    ordinaryConsumerVersions[name] = packageIdentitySchema.parse(
      parseJson(await readFile(join(ordinary, "node_modules", name, "package.json"), "utf8")),
    ).version;
  }
  for (const file of [
    "chart.test.mjs",
    "chart-frame.test.mjs",
    "compound-chart.test.mjs",
    "candlestick-model.test.mjs",
    "candlestick-viewport.test.mjs",
    "candlestick-render.test.mjs",
    "tailwind-classes.test.mjs",
    "consumer.tsx",
  ]) {
    await copyFile(join(root, "tests", file), join(ordinary, file));
  }
  // Stream component failures; captured child output can truncate the failing TAP record.
  run(
    process.execPath,
    [
      "--test",
      "chart.test.mjs",
      "chart-frame.test.mjs",
      "compound-chart.test.mjs",
      "candlestick-model.test.mjs",
      "candlestick-viewport.test.mjs",
      "candlestick-render.test.mjs",
      "tailwind-classes.test.mjs",
    ],
    ordinary,
    "inherit",
  );
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
          noUncheckedIndexedAccess: true,
          // Recharts' Redux Toolkit declarations do not support exact optional
          // properties with declaration checking. Owned sources and the focused
          // packed negative consumer check this flag separately.
          exactOptionalPropertyTypes: false,
          noImplicitOverride: true,
          isolatedModules: true,
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
      ...Object.entries(pinnedConsumerVersions).map(([name, version]) => `${name}@${version}`),
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
  const manifest = packageManifestSchema.parse(
    parseJson(await readFile(join(installed, "package.json"), "utf8")),
  );
  assertPackageContract(
    manifest,
    packed.files.map((file) => file.path),
    (await readdir(join(root, "packages/charts/src"), { recursive: true })).filter((file) =>
      /\.tsx?$/.test(file),
    ),
  );
  assertDocumentationContract(
    await readFile(join(installed, "README.md"), "utf8"),
    packed.files.map((file) => file.path),
  );
  assert.equal(
    await readFile(join(installed, "LICENSE"), "utf8"),
    await readFile(join(root, "LICENSE"), "utf8"),
    "Packed license must match the repository license",
  );
  run(process.execPath, ["--input-type=module", "-e", "await import('@kind-ui/charts')"], consumer);
  assert.ok(
    !packed.files.some((file) => file.path.endsWith(".css")),
    "Consumer Tailwind generates chart styles; package ships no CSS",
  );
  await writeFile(
    join(consumer, "chart-tailwind.css"),
    '@import "tailwindcss/theme" layer(theme);\n@import "tailwindcss/utilities" layer(utilities);\n@source "./node_modules/@kind-ui/charts/dist";',
  );
  await writeFile(join(consumer, "missing-source.css"), '@import "tailwindcss" source(none);');
  const missingSourceBuild = await buildOutput({
    configFile: false,
    root: consumer,
    logLevel: "silent",
    plugins: [tailwindcss()],
    build: { write: false, rolldownOptions: { input: join(consumer, "missing-source.css") } },
  });
  const missingSourceCss = missingSourceBuild.output
    .flatMap((item) =>
      item.type === "asset" && item.fileName.endsWith(".css") ? [String(item.source)] : [],
    )
    .join("\n");
  assert.doesNotMatch(
    missingSourceCss,
    /--popover,Canvas/,
    "Without source registration Tailwind must not secretly include chart styles",
  );
  /** @param {string} folder @param {string} file @param {string} [target] */
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
        "candlestick",
        "number-shuffle",
        "activity-rings",
        "tailwind-setup",
      ].includes(folder) &&
      file.endsWith(".tsx")
    )
      assertLineConsumerSource(source);
    await writeFile(join(consumer, target), source);
  }
  /** @param {string[]} files */
  async function typecheck(files) {
    await checkTypes(consumer, join(root, "node_modules/typescript/bin/tsc"), files);
  }
  /** @param {string} entry @param {string} outDir @param {boolean} [developmentReact] */
  async function production(entry, outDir, developmentReact = false) {
    const diagnostics = browserDirectives(consumer, [join(consumer, "host.tsx")]);
    const productionOutput = await buildOutput({
      plugins: [
        tailwindcss(),
        diagnostics.plugin,
        {
          name: "consumer-tailwind-setup",
          transformIndexHtml: {
            order: "pre",
            handler(html) {
              return {
                html,
                tags: [
                  {
                    tag: "link",
                    attrs: { rel: "stylesheet", href: "/chart-tailwind.css" },
                    injectTo: "head",
                  },
                ],
              };
            },
          },
        },
      ],
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
    const generatedCss = productionOutput.output
      .flatMap((item) =>
        item.type === "asset" && item.fileName.endsWith(".css") ? [String(item.source)] : [],
      )
      .join("\n");
    assert.match(
      generatedCss,
      /--popover,Canvas/,
      "Package @source must discover chart token utilities in the installed tarball",
    );
  }
  assert.match(
    await readFile(join(installed, "dist/index.js"), "utf8"),
    /^"use client";/,
    "Public reexports must retain the Next client boundary",
  );
  assertCompositionConsumerSource(
    await readFile(join(root, "tests/fixtures/composition/host.tsx"), "utf8"),
  );
  for (const file of ["host.tsx", "main.tsx", "contract.tsx", "compound.tsx", "index.html"])
    await copyFixture("composition", file);
  await typecheck(["host.tsx", "main.tsx", "contract.tsx", "compound.tsx"]);
  await production("index.html", "packed-composition");
  console.log(
    "Single-package named/namespace Cartesian, polar, scatter and pie compositions: strict NodeNext/Bundler parity and production build passed",
  );

  assertCompositionConsumerSource(
    await readFile(join(root, "tests/fixtures/chart-frame/host.tsx"), "utf8"),
  );
  for (const file of ["host.tsx", "main.tsx", "contract.tsx", "index.html"])
    await copyFixture("chart-frame", file);
  await typecheck(["host.tsx", "main.tsx", "contract.tsx"]);
  await production("index.html", "packed-chart-frame");
  console.log(
    "LineChart: explicit public parts, controlled consumers, generic props and strict NodeNext/Bundler passed",
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

  await checkBundleContract({ root, consumer, artifactSha256: sha256, buildOutput });

  await copyFile(join(root, "tests/core-contracts.tsx"), join(consumer, "core-contracts.tsx"));
  await checkTypes(
    consumer,
    join(root, "node_modules/typescript/bin/tsc"),
    ["core-contracts.tsx"],
    { strictOptionalTypes: true },
  );
  console.log("Core unsafe-input type regressions: packed NodeNext/Bundler consumers passed");
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
    join(consumer, "chart-frame.test.mjs"),
    await readFile(join(root, "tests/chart-frame.test.mjs"), "utf8"),
  );
  await copyFile(
    join(root, "tests/compound-chart.test.mjs"),
    join(consumer, "compound-chart.test.mjs"),
  );
  await copyFile(
    join(root, "tests/tailwind-classes.test.mjs"),
    join(consumer, "tailwind-classes.test.mjs"),
  );
  for (const file of [
    "candlestick-model.test.mjs",
    "candlestick-viewport.test.mjs",
    "candlestick-render.test.mjs",
  ]) {
    await copyFile(join(root, "tests", file), join(consumer, file));
  }
  run(
    process.execPath,
    [
      "--test",
      "chart.test.mjs",
      "chart-frame.test.mjs",
      "compound-chart.test.mjs",
      "candlestick-model.test.mjs",
      "candlestick-viewport.test.mjs",
      "candlestick-render.test.mjs",
      "tailwind-classes.test.mjs",
    ],
    consumer,
    "inherit",
  );
  for (const file of ["loading.tsx", "loading.css", "chart-utilities.css"])
    await copyFixture("browser", file);
  await writeFixtureEntry(consumer, "loading", "./loading.js");
  await typecheck(["loading.tsx", "loading-entry.tsx"]);
  await production("loading.html", "packed-loading");
  // LazyMotion's strict enforcement runs only in development.
  await production("loading.html", "packed-loading-development", true);
  console.log("Loading boundary: packed public-only strict types and production preview passed");
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
  // Emit only the already strictly checked host fixture beside the installed tarball.
  // Node SSR and browser hydration both consume that package, never workspace source.
  run(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "-p",
      "tsconfig.NodeNext.json",
      "--noEmit",
      "false",
      "--outDir",
      "pie-ssr",
    ],
    consumer,
  );
  const pieSsr = run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
      import { createElement } from 'react';
      import { renderToString } from 'react-dom/server';
      import { SelectiveGlowHost } from './pie-ssr/host.js';
      console.log(JSON.stringify({
        field: renderToString(createElement(SelectiveGlowHost, { accessor: false })),
        accessor: renderToString(createElement(SelectiveGlowHost, { accessor: true })),
      }));
    `,
    ],
    consumer,
  );
  const pieShells = JSON.parse(pieSsr);
  for (const markup of [pieShells.field, pieShells.accessor]) {
    assert.equal(typeof markup, "string");
    assert.match(markup, /Glow allocation/);
    assert.doesNotMatch(markup, /pie-halo/);
  }
  await writeFile(join(root, "artifacts/packed-pie/ssr.json"), pieSsr);
  console.log(
    "Pie tarball consumer: guarded public imports, strict NodeNext/Bundler, production build and Node SSR shells passed",
  );
  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("polar", file);
  await typecheck(["host.tsx", "main.tsx"]);
  await production("index.html", "packed-polar");
  await production("index.html", "packed-polar-development", true);
  console.log("Radar/radial tarball consumer: strict NodeNext/Bundler and production build passed");
  for (const file of ["host.tsx", "main.tsx", "index.html", "render.mjs"])
    await copyFixture("tailwind-setup", file);
  await typecheck(["host.tsx", "main.tsx"]);
  // Hydrate the same public packed host, rather than duplicating the chart’s server markup.
  run(
    process.execPath,
    [
      join(root, "node_modules/typescript/bin/tsc"),
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--jsx",
      "react-jsx",
      "--target",
      "ES2022",
      "--outDir",
      "ssr",
      "host.tsx",
    ],
    consumer,
  );
  run(process.execPath, ["render.mjs"], consumer);
  await production("index.html", "packed-tailwind-production");
  await production("index.html", "packed-tailwind-development", true);
  console.log(
    "Tailwind source registration: packed SSR hydration consumer built in both modes without chart CSS imports",
  );
  const polarGallery = await readFile(
    join(root, "tests/fixtures/browser/polar-gallery.tsx"),
    "utf8",
  );
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

  for (const file of ["host.tsx", "main.tsx", "index.html"]) await copyFixture("candlestick", file);
  await copyFile(
    join(root, "tests/candlestick-consumer.tsx"),
    join(consumer, "candlestick-consumer.tsx"),
  );
  await typecheck(["host.tsx", "main.tsx", "candlestick-consumer.tsx"]);
  await production("index.html", "packed-candlestick");
  await production("index.html", "packed-candlestick-development", true);
  console.log(
    "Candlestick tarball: public-only strict NodeNext/Bundler and production build passed",
  );

  // Presentation behavior is independently checked through the installed tarball.
  for (const file of [
    "use-reduced-motion.ts",
    "presentation.tsx",
    "presentation-main.tsx",
    "presentation.css",
  ]) {
    const source = await readFile(join(root, "tests/fixtures/browser", file), "utf8");
    if (file.endsWith(".tsx") || file.endsWith(".ts")) assertLineConsumerSource(source);
    await writeFile(join(consumer, file), source);
  }
  await writeFixtureEntry(consumer, "presentation", "./presentation-main.js");
  await typecheck(["presentation.tsx", "presentation-main.tsx", "presentation-entry.tsx"]);
  await production("presentation.html", "packed-presentation");
  console.log(
    "Presentation recipe: guarded public imports, strict NodeNext/Bundler and tarball production build passed",
  );

  await copyFixture("emphasis", "index.html");
  await copyFixture("emphasis", "main.tsx");
  await typecheck(["main.tsx"]);
  await production("index.html", "packed-emphasis");
  console.log("Emphasis tarball: strict NodeNext/Bundler and production build passed");

  console.log(
    "Packed contents, Tailwind class discovery, license, ESM import, component tests, strict consumers and production styling build passed",
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
        artifactReceiptSchema.parse({
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
          consumerVersions: pinnedConsumerVersions,
          ordinaryConsumerVersions,
          validation: "installed tarball package gate; aggregate browser checks are separate",
        }),
        null,
        2,
      )}\n`,
    );
    console.log(`Validated artifact: ${join(destination, packed.filename)} (SHA-256 ${sha256})`);
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
