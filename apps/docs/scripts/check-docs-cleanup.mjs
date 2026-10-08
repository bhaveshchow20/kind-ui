import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";
import ts from "typescript";
import { families } from "../examples/catalog.mjs";
import { publicPath } from "../lib/routing.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
const evidence = [];
const errors = [];
const bundles = JSON.parse(readFileSync("generated/all-examples.json", "utf8"));
const publicIndex = ts.createSourceFile(
  "index.ts",
  readFileSync("../../packages/charts/src/index.ts", "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const chartExports = publicIndex.statements.flatMap((statement) =>
  ts.isExportDeclaration(statement) &&
  statement.exportClause &&
  ts.isNamedExports(statement.exportClause)
    ? statement.exportClause.elements
        .filter((entry) => !entry.isTypeOnly && /(?:Chart$|^ActivityRings$)/.test(entry.name.text))
        .map((entry) => entry.name.text)
    : [],
);
const loadingCoverage = chartExports.map((component) => {
  const bundle = Object.values(bundles).find((example) => {
    if (!example.variants?.loading) return false;
    const source = ts.createSourceFile(
      "example.tsx",
      example.variants.loading.source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    let found = false;
    function visit(node) {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        node.tagName.getText(source) === `Chart.${component}` &&
        node.attributes.properties.some(
          (attribute) =>
            ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "loading",
        )
      )
        found = true;
      ts.forEachChild(node, visit);
    }
    visit(source);
    return found;
  });
  assert.ok(bundle, `${component} needs a native loading example`);
  return { component, example: bundle.id };
});
function pages(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? pages(`${directory}/${entry.name}`, `${prefix}${entry.name}/`)
      : entry.name.endsWith(".mdx")
        ? [`${prefix}${entry.name.slice(0, -4)}`]
        : [],
  );
}
try {
  const context = await browser.newContext({ reducedMotion: "reduce", colorScheme: "dark" });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  for (const { width, zoom } of [
    ...[320, 390, 768, 1440].map((width) => ({ width, zoom: 1 })),
    { width: 390, zoom: 2 },
    { width: 1440, zoom: 2 },
  ]) {
    await page.setViewportSize({ width, height: 900 });
    for (const key of pages("content/docs")) {
      const url = publicPath(key === "index" ? "/docs/" : `/docs/${key}/`);
      assert.equal((await page.goto(origin + url)).status(), 200, url);
      await page.locator("h1").first().waitFor();
      await expect(page.getByRole("combobox", { name: "State", exact: true })).toHaveCount(0);
      await page.evaluate((zoom) => {
        document.documentElement.style.zoom = String(zoom);
      }, zoom);
      if (key.startsWith("components/")) {
        const family = key.split("/")[1];
        const id = family;
        const card = page.locator(`[data-component="${id}"]`);
        await card
          .locator(id === "heatmap" ? "[role=grid]" : "svg.recharts-surface")
          .first()
          .waitFor();
        assert.ok(
          (await page.locator(".doc-body > h2").first().innerText()).startsWith("Usage"),
          `${key} order`,
        );
        await expect(card.locator(".sr-only table")).toHaveCount(1);
        const loading = bundles[id].variants.loading;
        assert.ok(loading, `${id} loading source`);
        const pending = page.locator(`[data-component="${id}-loading"]`);
        await expect(page.locator("h2#loading-state")).toBeVisible();
        await expect(pending.getByRole("combobox")).toHaveCount(0);

        const referenceTables = page.locator(".line-props-scroll table");
        for (const table of await referenceTables.all()) {
          assert.ok(
            await table.evaluate((node) => node.getBoundingClientRect().width >= 649),
            `${key} readable reference width`,
          );
        }
        await expect(pending.locator('[data-kind-ui="chart-loading-skeleton"]')).toBeVisible();
        await pending.getByRole("tab", { name: "Code", exact: true }).click();
        assert.equal((await pending.locator("pre").textContent()).trim(), loading.source.trim());
        await pending.getByRole("tab", { name: "Preview", exact: true }).click();
      }
      const measurements = await page.evaluate(() => {
        const main = document.querySelector("[data-fd-full]").getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          tail: document.documentElement.scrollHeight - (main.bottom + scrollY),
        };
      });
      assert.ok(
        measurements.overflow <= 2,
        `${width} ${key} horizontal overflow ${measurements.overflow}`,
      );
      assert.ok(measurements.tail <= 2, `${width} ${key} blank tail ${measurements.tail}`);
      evidence.push({ width, zoom, page: key, ...measurements });
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin + publicPath("/docs/components/radial/"));
  await expect(page.locator('[data-state="loading"]')).toHaveCount(1);
  await expect(page.locator('[data-component="radial"] [data-kind-ui="radial-label"]')).toHaveCount(
    3,
  );
  const readyActivity = page.locator('[data-component="radial-activity"]');
  await expect(readyActivity.locator('[data-kind-ui="chart-loading-skeleton"]')).toHaveCount(0);
  await expect(readyActivity.locator(".recharts-radial-bar-sector")).toHaveCount(3);
  await page.goto(origin + publicPath("/docs/components/radar/"));
  const mark = page
    .locator(
      '[data-component="radar-selection"] [data-kind-ui="series-interaction"][role="button"]',
    )
    .last();
  await mark.waitFor();
  await mark.click({ force: true });
  assert.equal(await mark.evaluate((node) => node.matches(":focus-visible")), false);
  assert.equal(await mark.evaluate((node) => getComputedStyle(node).outlineStyle), "none");
  await page.keyboard.press("Tab");
  await mark.focus();
  assert.equal(await mark.evaluate((node) => node.matches(":focus-visible")), true);
  assert.equal(await mark.evaluate((node) => getComputedStyle(node).outlineStyle), "solid");
  const pressed = await mark.getAttribute("aria-pressed");
  await page.keyboard.press("Enter");
  await expect(mark).toHaveAttribute("aria-pressed", pressed === "true" ? "false" : "true");
  await page.goto(origin + publicPath("/docs/components/pie/"));
  const pie = page.locator('[data-component="pie-interaction"]');
  await expect(pie.locator('[data-kind-ui="pie-sector"]')).toHaveCount(3);
  await expect(page.getByRole("button", { name: /all categories/ })).toHaveCount(0);
  for (const [legacy, title] of [
    ["customization", "Line Chart"],
    ["identity-layout", "Identity and colors"],
  ]) {
    assert.equal((await page.goto(origin + publicPath(`/docs/guides/${legacy}/`))).status(), 200);
    await page.waitForURL(
      origin +
        publicPath(
          legacy === "customization" ? "/docs/components/line/" : "/docs/concepts/identity/",
        ),
    );
    assert.equal(await page.locator("h1").first().innerText(), title);
  }
  await page.goto(origin + publicPath("/docs/guides/customization/#loading"));
  await page.waitForURL(origin + publicPath("/docs/chart-components/root/#loading"));
  const icons = await page
    .locator('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
  const canonical = readFileSync("../showcase/public/cherry-blossom.png");
  for (const href of icons) {
    assert.equal(href, publicPath("/cherry-blossom.png"));
    assert.equal(
      createHash("sha256")
        .update(await (await page.request.get(origin + href)).body())
        .digest("hex"),
      createHash("sha256").update(canonical).digest("hex"),
    );
  }
  assert.equal(icons.length, 3);
  assert.deepEqual(errors, []);
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/docs-cleanup-results.json",
    JSON.stringify(
      {
        pages: evidence,
        families: families.length,
        loadingCoverage,
        pointerAndKeyboardFocus: "passed",
        favicon: "canonical bytes",
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `Docs cleanup: ${evidence.length} page/viewport checks, 13 family loading previews and ${loadingCoverage.length} native loading exports, focus and canonical favicon passed.`,
  );
} finally {
  await browser.close();
}
