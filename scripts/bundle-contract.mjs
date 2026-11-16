import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import tailwindcss from "@tailwindcss/vite";
import { z } from "zod";
import { browserDirectives } from "./browser-directives.mjs";
import { checkTypes } from "./check-types.mjs";
import { assertCompositionConsumerSource } from "./line-consumer-contract.mjs";

export const bundleFixtures = [
  "app",
  "primitive-kind",
  "primitive-native",
  "cartesian",
  "line-loading",
  "cartesian-native",
  "polar",
  "polar-native",
  "heatmap",
  "treemap",
  "sankey",
  "sankey-native",
];
const sizesSchema = z.strictObject({
  raw: z.number().int().nonnegative(),
  gzip: z.number().int().nonnegative(),
  brotli: z.number().int().nonnegative(),
});
const assetsSchema = z.strictObject({ js: sizesSchema, css: sizesSchema });
export const bundleBudgetSchema = z.strictObject({
  schemaVersion: z.literal(1),
  compression: z.strictObject({ gzipLevel: z.literal(9), brotliQuality: z.literal(11) }),
  tools: z.record(z.string(), z.string().min(1)),
  fixtures: z.record(z.string(), z.strictObject({ baseline: assetsSchema, maximum: assetsSchema })),
});
/** @typedef {z.infer<typeof sizesSchema>} Sizes */
/** @typedef {z.infer<typeof assetsSchema>} AssetSizes */
/** @typedef {z.infer<typeof bundleBudgetSchema>} BundleBudgets */
/** @typedef {{tools: Record<string, string>, fixtures: Record<string, AssetSizes>}} Measurements */

/** @param {string | Uint8Array} source @returns {Sizes} */
function compressedSizes(source) {
  const bytes = typeof source === "string" ? Buffer.from(source) : source;
  return {
    raw: bytes.byteLength,
    gzip: gzipSync(bytes, { level: 9 }).byteLength,
    brotli: brotliCompressSync(bytes, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).byteLength,
  };
}

/** @param {(string | Uint8Array)[]} sources @returns {Sizes} */
function sumSizes(sources) {
  return sources.reduce(
    (total, source) => {
      const size = compressedSizes(source);
      return {
        raw: total.raw + size.raw,
        gzip: total.gzip + size.gzip,
        brotli: total.brotli + size.brotli,
      };
    },
    { raw: 0, gzip: 0, brotli: 0 },
  );
}

/**
 * Module metadata can contain empty barrel modules. Check only emitted code;
 * summing renderedLength does not measure final minified application bytes.
 * @param {import("rolldown").RolldownOutput} result
 */
export function measureBundle(result) {
  const chunks = result.output.filter((item) => item.type === "chunk");
  const css = result.output.flatMap((item) =>
    item.type === "asset" && item.fileName.endsWith(".css") ? [item.source] : [],
  );
  return {
    js: sumSizes(chunks.map((chunk) => chunk.code)),
    css: sumSizes(css),
    modules: [
      ...new Set(
        chunks.flatMap((chunk) =>
          Object.entries(chunk.modules)
            .filter(([, module]) => module.renderedLength > 0)
            .map(([id]) => id.replaceAll("\\", "/")),
        ),
      ),
    ],
  };
}

/** @param {string} fixture @param {string[]} modules */
export function assertBundleRetention(fixture, modules) {
  if (fixture.startsWith("primitive-")) {
    assert.ok(
      !modules.some((id) => /(?:motion|framer-motion|motion-dom|motion-utils)\//.test(id)),
      `${fixture}: primitive consumer must tree-shake Motion`,
    );
    assert.ok(
      !modules.some((id) => /@kind-ui\/charts\/dist\/(?!index\.js)/.test(id)),
      `${fixture}: primitive consumer must tree-shake Kind runtime`,
    );
  }
  const family = new Map([
    ["cartesian", "line"],
    ["line-loading", "line"],
    ["polar", "radar"],
    ["heatmap", "heatmap"],
    ["treemap", "treemap"],
    ["sankey", "sankey"],
  ]).get(fixture);
  if (!family) return;
  for (const id of modules) {
    assert.ok(
      family === "treemap" || (!id.includes("/d3-hierarchy/") && !id.includes("/dist/treemap/")),
      `${fixture}: unrelated hierarchy layout retained: ${id}`,
    );
    const standalone = /@kind-ui\/charts\/dist\/(heatmap(?:-[^/]+)?|sankey(?:-[^/]+)?)\.js$/.exec(
      id,
    )?.[1];
    assert.ok(
      !standalone || standalone.startsWith(family),
      `${fixture}: unrelated standalone family retained: ${id}`,
    );
    const composition = /@kind-ui\/charts\/dist\/composition\/([^/]+)\.js$/.exec(id)?.[1];
    assert.ok(
      !composition || composition === family || composition === "parts",
      `${fixture}: unrelated family retained: ${id}`,
    );
    const design = /loading-(cartesian|polar|standalone)-designs\.js$/.exec(id)?.[1];
    const allowedDesign =
      family === "radar" ? "polar" : family === "line" ? undefined : "standalone";
    assert.ok(
      !design || design === allowedDesign,
      `${fixture}: unrelated loading design retained: ${id}`,
    );
  }
  assert.ok(
    modules.some((id) => /loading-skeleton\.js$/.test(id)),
    `${fixture}: own supported loading implementation must remain retained`,
  );
}

/** @param {Measurements} measurements @param {BundleBudgets} budgets */
export function assertBundleBudgets(measurements, budgets) {
  assert.deepEqual(
    Object.keys(budgets.fixtures).sort(),
    [...bundleFixtures].sort(),
    "Bundle budgets must cover exactly the maintained fixtures",
  );
  assert.deepEqual(
    Object.keys(measurements.fixtures).sort(),
    [...bundleFixtures].sort(),
    "Bundle measurements must cover exactly the maintained fixtures",
  );
  assert.deepEqual(
    measurements.tools,
    budgets.tools,
    "Bundle dependency/tool pins changed; measure the tarball and review baselines before updating budgets",
  );
  for (const fixture of bundleFixtures) {
    const measured = measurements.fixtures[fixture];
    const budget = budgets.fixtures[fixture];
    assert.ok(measured && budget, `Missing bundle fixture: ${fixture}`);
    for (const asset of /** @type {const} */ (["js", "css"])) {
      for (const encoding of /** @type {const} */ (["raw", "gzip", "brotli"])) {
        assert.ok(
          budget.maximum[asset][encoding] >= budget.baseline[asset][encoding],
          `${fixture} ${asset}/${encoding}: maximum must cover recorded baseline`,
        );
        assert.ok(
          measured[asset][encoding] <= budget.maximum[asset][encoding],
          `${fixture} ${asset}/${encoding}: ${measured[asset][encoding]} bytes exceeds ${budget.maximum[asset][encoding]} byte budget; inspect retained modules and review a measured baseline update`,
        );
      }
    }
  }
  const publicBytes = measurements.fixtures["primitive-kind"]?.js.raw;
  const nativeBytes = measurements.fixtures["primitive-native"]?.js.raw;
  assert.ok(publicBytes !== undefined && nativeBytes !== undefined);
  assert.ok(
    Math.abs(publicBytes - nativeBytes) <= 100,
    `Public/native primitive bundle difference must remain negligible: ${publicBytes}/${nativeBytes}`,
  );
}

/** @param {string} path */
async function versionAt(path) {
  /** @type {unknown} */
  const json = JSON.parse(await readFile(path, "utf8"));
  return z.object({ version: z.string().min(1) }).parse(json).version;
}

/**
 * Reuses the package gate's installed tarball and build wrapper; never packs or
 * installs. No source aliases or package subpaths are used.
 * @param {{root: string, consumer: string, artifactSha256: string,
 * buildOutput: (config: import("vite").InlineConfig) => Promise<import("rolldown").RolldownOutput>}} options
 */
export async function checkBundleContract({ root, consumer, artifactSha256, buildOutput }) {
  const destination = join(consumer, "bundle");
  await mkdir(destination, { recursive: true });
  /** @type {unknown} */
  const json = JSON.parse(await readFile(join(root, "docs/bundle-budgets.json"), "utf8"));
  const budgets = bundleBudgetSchema.parse(json);
  /** @type {Record<string, string>} */
  const tools = {};
  for (const name of [
    "vite",
    "rolldown",
    "@tailwindcss/vite",
    "@tailwindcss/node",
    "@tailwindcss/oxide",
  ]) {
    tools[name] = await versionAt(join(root, "node_modules", name, "package.json"));
  }
  for (const name of [
    "react",
    "react-dom",
    "react-is",
    "recharts",
    "motion",
    "framer-motion",
    "motion-dom",
    "motion-utils",
    "tailwindcss",
    "clsx",
    "tailwind-merge",
  ]) {
    tools[name] = await versionAt(join(consumer, "node_modules", name, "package.json"));
  }
  await writeFile(
    join(destination, "chart.css"),
    '@import "tailwindcss" source(none);\n@source "../node_modules/@kind-ui/charts/dist";\n',
  );
  await writeFile(join(destination, "baseline.css"), '@import "tailwindcss" source(none);\n');
  for (const fixture of bundleFixtures) {
    const source = await readFile(join(root, "tests/fixtures/bundle", `${fixture}.tsx`), "utf8");
    if (
      !["primitive-native", "cartesian-native", "polar-native", "sankey-native"].includes(fixture)
    )
      assertCompositionConsumerSource(source);
    await writeFile(join(destination, `${fixture}.tsx`), source);
  }
  await checkTypes(
    destination,
    join(root, "node_modules/typescript/bin/tsc"),
    bundleFixtures.map((fixture) => `${fixture}.tsx`),
  );
  /** @type {Record<string, AssetSizes>} */
  const fixtures = {};
  /** @type {Record<string, string[]>} */
  const retainedPackageModules = {};
  for (const fixture of bundleFixtures) {
    const kind = [
      "primitive-kind",
      "cartesian",
      "line-loading",
      "polar",
      "heatmap",
      "treemap",
      "sankey",
    ].includes(fixture);
    await writeFile(
      join(destination, "index.html"),
      `<!doctype html><html lang="en"><head><title>Bundle fixture</title><link rel="stylesheet" href="./${kind ? "chart" : "baseline"}.css"></head><body><script type="module" src="./${fixture}.tsx"></script></body></html>`,
    );
    const diagnostics = browserDirectives(consumer);
    const result = await buildOutput({
      configFile: false,
      root: consumer,
      logLevel: "silent",
      plugins: [tailwindcss(), diagnostics.plugin],
      build: {
        write: false,
        minify: true,
        cssMinify: true,
        target: "es2022",
        sourcemap: false,
        rolldownOptions: { input: join(destination, "index.html"), onwarn: diagnostics.onwarn },
      },
    });
    const measured = measureBundle(result);
    assertBundleRetention(fixture, measured.modules);
    fixtures[fixture] = { js: measured.js, css: measured.css };
    retainedPackageModules[fixture] = measured.modules.flatMap((id) =>
      id.includes("/@kind-ui/charts/dist/") ? [id.split("/@kind-ui/charts/dist/")[1] ?? id] : [],
    );
  }
  const measurements = { tools, fixtures };
  const artifactDirectory = join(root, "artifacts");
  await mkdir(artifactDirectory, { recursive: true });
  await writeFile(
    join(artifactDirectory, "bundle-measurements.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        artifactSha256,
        node: process.version,
        target: "es2022",
        compression: budgets.compression,
        ...measurements,
        retainedPackageModules,
      },
      null,
      2,
    )}\n`,
  );
  assertBundleBudgets(measurements, budgets);
  console.log(
    "Packed bundle budgets: raw/gzip/brotli JavaScript and generated Tailwind CSS passed; primitive parity and family retention passed",
  );
  return measurements;
}
