import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stripVTControlCharacters } from "node:util";
import { chromium, expect } from "@playwright/test";
import { families, variantDefinitions } from "../examples/catalog.mjs";
import { verificationFiles } from "./consumer-validation-files.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
const bundles = JSON.parse(readFileSync("generated/all-examples.json", "utf8"));
const marks = {
  area: ".recharts-area-area",
  bar: ".recharts-bar-rectangle",
  "box-plot": ".recharts-bar-rectangle",
  combo: ".recharts-bar-rectangle, .recharts-line-curve, .recharts-area-area",
  line: ".recharts-line-curve",
  pie: ".recharts-pie-sector",
  radar: ".recharts-radar-polygon",
  radial: ".recharts-radial-bar-sector",
  scatter: ".recharts-scatter-symbol",
  heatmap: '[data-kind-ui="heatmap-grid"] td',
  histogram: ".recharts-bar-rectangle",
  sankey: ".recharts-sankey-nodes > g, .recharts-sankey-links > g",
  waterfall: ".recharts-bar-rectangle",
};
const evidence = { variants: [], loading: [], staticKeys: [], errors: [] };
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
let fixture;
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  for (const family of families) {
    await page.goto(`${origin}/docs/components/${family.id}/`);
    await page.waitForFunction(() => document.querySelectorAll(".component-loading").length === 0);
    for (const example of family.examples) {
      const bundle = bundles[example.id];
      const card = page.locator(`[data-component="${example.id}"]`);
      const variants = bundle.variants ?? { default: { source: sourceFor(bundle) } };
      for (const [value, variant] of Object.entries(variants)) {
        if (value === "loading") continue;
        const options = Object.keys(variants).filter((key) => key !== "loading");
        if (options.length > 1) {
          await card.getByRole("combobox", { name: bundle.variantControl, exact: true }).click();
          await page.getByRole("option", { name: variant.label, exact: true }).click();
        }
        const legends = card.locator('[data-kind-ui="chart-legend"]');
        const expected =
          family.id === "line" ||
          /Chart\.(Legend|SankeyLegend|ActivityRings)\b/.test(variant.source);
        assert.equal(
          await legends.count(),
          expected ? 1 : 0,
          `${example.id}/${value} legend inventory`,
        );
        if (expected) {
          await exerciseLegend(page, card, family.id, variant.source, `${example.id}/${value}`);
        } else {
          assert.equal(await card.locator('[data-kind-ui="heatmap-legend"] button').count(), 0);
          evidence.staticKeys.push({ id: example.id, value, family: family.id });
        }
      }
    }
    console.log(`${family.id}: legend variants verified`);
  }
  for (const owner of [
    "root",
    "series-config",
    "responsive-container",
    "axes-grid",
    "legend",
    "tooltip",
    "labels",
  ]) {
    const mdx = readFileSync(`content/docs/chart-components/${owner}.mdx`, "utf8");
    const ids = [...mdx.matchAll(/<ChartExample id="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(ids.length > 0, `${owner} has a live public example`);
    await page.goto(`${origin}/docs/chart-components/${owner}/`);
    await page.waitForFunction(() => document.querySelectorAll(".component-loading").length === 0);
    for (const id of ids) {
      const bundle = bundles[id];
      await exerciseLegend(
        page,
        page.locator(`[data-component="${id}"]`),
        bundle.family,
        sourceFor(bundle),
        `${owner}/${id}`,
      );
    }
    console.log(`${owner}: shared legend verified`);
  }
  await context.close();
  fixture = await startConsumer();
  const consumer = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
  });
  consumer.on("pageerror", (error) => evidence.errors.push(error.message));
  await consumer.goto(fixture.origin);
  for (const id of [...families.map((family) => family.id), "radial-activity"]) {
    await consumer.getByLabel("Example").selectOption(id);
    const card = consumer.locator('[data-testid="consumer-example"]');
    await expect(card.locator('[data-kind-ui="chart-loading-skeleton"]')).toHaveCount(0);
    const family = bundles[id].family;
    const buttons = card.locator('[data-kind-ui="chart-legend"] button');
    await expect.poll(() => card.locator(marks[family]).count()).toBeGreaterThan(0);
    const count = await buttons.count();
    const focus = /mode:\s*["']focus/.test(sourceFor(bundles[id]));
    if (count > 1) {
      await buttons.first().click();
      await expect(buttons.first()).toHaveAttribute("aria-pressed", focus ? "true" : "false");
    }
    const selection = await buttons.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-pressed")),
    );
    assert.ok(marks[family], `${id} has an explicit geometry selector`);
    const readyMarks = await card.locator(marks[family]).count();
    assert.ok(readyMarks > 0, `${id} renders ready geometry`);
    await consumer.getByRole("button", { name: "Toggle pending", exact: true }).click();
    await expect(card.locator('[data-kind-ui="chart-loading-skeleton"]')).toHaveCount(1);
    await expect(
      card.getByRole("status").filter({ hasText: "Loading chart" }).first(),
    ).toBeAttached();
    const pendingButtons = await buttons.count();
    // Configuration controls outside the managed plot retain native public behavior.
    // The example's same Root instance must restore its selection when data returns.
    await consumer.getByRole("button", { name: "Toggle pending", exact: true }).click();
    await expect(card.locator('[data-kind-ui="chart-loading-skeleton"]')).toHaveCount(0);
    await expect(buttons).toHaveCount(count);
    assert.deepEqual(
      await buttons.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-pressed"))),
      selection,
      `${id} selection after loading`,
    );
    await expect(card.locator(marks[family])).toHaveCount(readyMarks);
    evidence.loading.push({
      id,
      buttons: count,
      pendingButtons,
      selectionRestored: true,
      geometryRestored: true,
    });
  }
  assert.deepEqual(evidence.errors, []);
  mkdirSync("artifacts", { recursive: true });
  writeFileSync("artifacts/legend-browser-results.json", JSON.stringify(evidence, null, 2));
  console.log(
    `${evidence.variants.length} interactive legend variants and 14 native loading round trips passed; ${evidence.staticKeys.length} quantitative/semantic or legend-free variants remain accurate.`,
  );
} finally {
  fixture?.process.kill("SIGTERM");
  await browser.close();
}

async function exerciseLegend(page, card, family, source, id) {
  const legend = card.locator('[data-kind-ui="chart-legend"]');
  const buttons = legend.locator("button");
  const items = legend.locator('[data-kind-ui="chart-legend-item"]');
  await expect(buttons).toHaveCount(await items.count());
  const count = await buttons.count();
  assert.ok(count > 0, `${id} has interactive public legend`);
  const focus = !/mode:\s*["']visibility/.test(source);
  if (focus) {
    await expect.poll(() => card.locator(marks[family]).count()).toBeGreaterThan(0);
    const geometry = () =>
      card
        .locator(marks[family])
        .evaluateAll((nodes) =>
          nodes.map((node) =>
            [
              node,
              ...node.querySelectorAll("path, rect, circle, polygon, polyline, line, ellipse"),
            ].map((shape) =>
              ["d", "points", "x", "y", "width", "height", "cx", "cy", "transform"].map((key) =>
                shape.getAttribute(key),
              ),
            ),
          ),
        );
    const originalGeometry = await geometry();
    const plotCount = await card.locator(marks[family]).count();
    assert.ok(plotCount > 0, `${id} focus preserves plotted marks`);
    const dimmedPaint = () =>
      card
        .locator(
          '[data-emphasis="dimmed"] [data-kind-ui="emphasis-paint"], [data-kind-ui="sankey-focus-mark"] > g, [data-kind-ui="series-interaction-paint"], [data-focus="dimmed"]',
        )
        .evaluateAll((nodes) => nodes.filter((node) => Number(node.style.opacity) < 1).length);
    await buttons.first().focus();
    await page.keyboard.press("Escape");
    await expect(legend.locator('button[aria-pressed="true"]')).toHaveCount(0);
    await buttons.first().click();
    await expect(buttons.first()).toHaveAttribute("aria-pressed", "true");
    if (count > 1) {
      await expect
        .poll(dimmedPaint, { message: `${id} changes plotted focus paint` })
        .toBeGreaterThan(0);
    } else {
      await expect.poll(dimmedPaint).toBe(0);
    }
    await expect(card.locator(marks[family])).toHaveCount(plotCount);
    assert.deepEqual(await geometry(), originalGeometry, `${id} focus preserves geometry`);
    await buttons.first().focus();
    await page.keyboard.press("Enter");
    await expect(buttons.first()).toHaveAttribute("aria-pressed", "false");
    await expect.poll(dimmedPaint).toBe(0);
    await page.keyboard.press("Space");
    await expect(buttons.first()).toHaveAttribute("aria-pressed", "true");
    if (count > 1) await expect.poll(dimmedPaint).toBeGreaterThan(0);
    else await expect.poll(dimmedPaint).toBe(0);
    await page.keyboard.press("Escape");
    await expect(legend.locator('button[aria-pressed="true"]')).toHaveCount(0);
    await expect.poll(dimmedPaint).toBe(0);
    await expect(card.locator(marks[family])).toHaveCount(plotCount);
    assert.deepEqual(await geometry(), originalGeometry, `${id} focus preserves geometry`);
    evidence.variants.push({
      id,
      mode: "focus",
      pointer: true,
      enter: true,
      space: true,
      escape: true,
      paint: true,
    });
    return;
  }
  const selector = marks[family];
  assert.ok(selector, `${id} needs a geometry selector`);
  await expect.poll(() => card.locator(selector).count()).toBeGreaterThan(0);
  const geometry = () =>
    card
      .locator(selector)
      .evaluateAll((nodes) =>
        nodes.map((node) =>
          [
            node,
            ...node.querySelectorAll("path, rect, circle, polygon, polyline, line, ellipse"),
          ].map((shape) =>
            ["d", "points", "x", "y", "width", "height", "cx", "cy", "transform"].map((key) =>
              shape.getAttribute(key),
            ),
          ),
        ),
      );
  const originalGeometry = await geometry();
  const hiddenMarks = () =>
    card.locator(selector).evaluateAll(
      (nodes) =>
        nodes.filter((node) => {
          const shapes = node.matches("path, rect, circle, polygon, polyline, line, ellipse")
            ? [node]
            : [...node.querySelectorAll("path, rect, circle, polygon, polyline, line, ellipse")];
          return (
            shapes.length > 0 &&
            shapes.every((shape) => {
              const paint = getComputedStyle(shape);
              return (
                paint.visibility === "hidden" ||
                paint.display === "none" ||
                shape.getClientRects().length === 0
              );
            })
          );
        }).length,
    );
  const originallyHidden = await hiddenMarks();
  const before = await card.locator(selector).count();
  assert.ok(before > 0, `${id} has plotted marks`);
  const shareLabels = card.locator(".recharts-label-list text");
  const originalShares =
    family === "pie" && /dataKey="share"/.test(source) ? await shareLabels.allTextContents() : null;
  if (originalShares) assert.deepEqual(originalShares, ["42%", "31%", "17%", "10%"]);
  if (count > 1) {
    await buttons.first().click();
    await expect(buttons.first()).toHaveAttribute("aria-pressed", "false");
    await expect(card.locator(selector)).toHaveCount(before);
    await expect.poll(hiddenMarks).toBeGreaterThan(originallyHidden);
    assert.deepEqual(await geometry(), originalGeometry, `${id} hiding preserves geometry`);
    if (originalShares) await expect(shareLabels).toHaveText(originalShares);
    await buttons.first().focus();
    await page.keyboard.press("Enter");
    await expect(buttons.first()).toHaveAttribute("aria-pressed", "true");
    await expect(card.locator(selector)).toHaveCount(before);
    await page.keyboard.press("Space");
    await expect(buttons.first()).toHaveAttribute("aria-pressed", "false");
    await expect(card.locator(selector)).toHaveCount(before);
    await expect.poll(hiddenMarks).toBeGreaterThan(originallyHidden);
    assert.deepEqual(await geometry(), originalGeometry, `${id} hiding preserves geometry`);
    await page.keyboard.press("Space");
    await expect(buttons.first()).toHaveAttribute("aria-pressed", "true");
  }
  for (let i = 0; i < count - 1; i++) await buttons.nth(i).click();
  await expect(legend.locator('button[aria-pressed="true"]')).toHaveCount(1);
  const last = buttons.nth(count - 1);
  const remaining = await card.locator(selector).count();
  await last.click();
  await expect(last).toHaveAttribute("aria-pressed", "true");
  await last.focus();
  await page.keyboard.press("Enter");
  await expect(last).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(last).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator(selector)).toHaveCount(remaining);
  assert.ok(remaining > 0, `${id} protected last item keeps geometry`);
  assert.deepEqual(await geometry(), originalGeometry, `${id} hiding preserves full allocation`);
  for (let i = 0; i < count - 1; i++) await buttons.nth(i).click();
  await expect(legend.locator('button[aria-pressed="true"]')).toHaveCount(count);
  await expect(card.locator(selector)).toHaveCount(before);
  if (originalShares) await expect(shareLabels).toHaveText(originalShares);
  assert.deepEqual(await geometry(), originalGeometry, `${id} restoring preserves geometry`);
  evidence.variants.push({
    id,
    mode: "visibility",
    pointer: true,
    enter: true,
    space: true,
    lastProtected: true,
    geometry: true,
  });
}

async function startConsumer() {
  const root = path.resolve("artifacts/legend-consumer");
  const first = bundles.area;
  for (const [name, body] of Object.entries(verificationFiles(first))) write(name, body);
  if (first.localPackage) {
    mkdirSync(path.join(root, "vendor"), { recursive: true });
    cpSync("vendor/kind-ui-charts-0.4.0.tgz", path.join(root, "vendor/kind-ui-charts-0.4.0.tgz"));
  }
  const imports = [];
  const examples = [];
  for (const id of [...families.map((family) => family.id), "radial-activity"]) {
    const bundle = bundles[id];
    for (const [name, body] of Object.entries(bundle.files))
      if (name.startsWith("src/examples/")) write(name, body);
    const name = sourceFor(bundle).match(/export function (\w+)/)?.[1];
    assert.ok(name, `${id} exported component`);
    const control = variantDefinitions[id];
    assert.ok(
      control.options.some((option) => option.value === "loading"),
      `${id} native loading variant`,
    );
    imports.push(`import { ${name} as Example${imports.length} } from "./examples/${id}/example";`);
    examples.push(
      `{ id: ${JSON.stringify(id)}, render: (pending: boolean) => <Example${imports.length - 1} ${control.prop}={pending ? "loading" : ${JSON.stringify(control.default)}} /> }`,
    );
  }
  write(
    "src/main.tsx",
    `import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import "./example.css";
${imports.join("\n")}
const examples = [${examples.join(",\n")}];
function App() {
 const [index, setIndex] = useState(0);
 const [pending, setPending] = useState(false);
 return <><label>Example <select value={examples[index].id} onChange={(event) => { setPending(false); setIndex(examples.findIndex((example) => example.id === event.target.value)); }}>{examples.map((example) => <option key={example.id}>{example.id}</option>)}</select></label><button type="button" onClick={() => setPending((old) => !old)}>Toggle pending</button><main data-testid="consumer-example" style={{width: 900, maxWidth: "100%"}}>{examples[index].render(pending)}</main></>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
`,
  );
  const config = JSON.parse(readFileSync(path.join(root, "tsconfig.json"), "utf8"));
  config.compilerOptions.skipLibCheck = false;
  config.compilerOptions.types = ["react", "react-dom"];
  write("tsconfig.json", JSON.stringify(config));
  execFileSync("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: root,
    stdio: "inherit",
  });
  assert.equal(
    JSON.parse(readFileSync(path.join(root, "node_modules/@kind-ui/charts/package.json"))).version,
    first.version,
  );
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  const port = Number(process.env.KIND_DOCS_LEGEND_CONSUMER_PORT || 6376);
  const preview = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: root, stdio: ["ignore", "pipe", "inherit"] },
  );
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Legend consumer did not start")), 15000);
      preview.once("error", reject);
      preview.once("exit", (code) => reject(new Error(`Legend consumer exited ${code}`)));
      let startupOutput = "";
      preview.stdout.on("data", (chunk) => {
        startupOutput += chunk.toString();
        if (stripVTControlCharacters(startupOutput).includes(`:${port}`)) {
          clearTimeout(timer);
          resolve();
        }
      });
    });
    return { process: preview, origin: `http://127.0.0.1:${port}` };
  } catch (error) {
    preview.kill("SIGTERM");
    throw error;
  }
  function write(name, body) {
    const target = path.join(root, name);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
  }
}

function sourceFor(bundle) {
  return bundle.files[`src/examples/${bundle.id}/example.tsx`];
}
