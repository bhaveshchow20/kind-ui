import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve("artifacts/registry-consumer/dist");
const evidence = JSON.parse(readFileSync("artifacts/registry-consumer/registry-results.json"));
assert.equal(evidence.items.length, 14);
const server = createServer((req, res) => {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(`${root}/`)) throw new Error("Invalid path");
    res.setHeader(
      "Content-Type",
      file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html",
    );
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
const errors = [],
  results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  for (const id of [
    "line",
    "area",
    "bar",
    "pie",
    "radial-activity",
    "heatmap",
    "sankey",
    "scatter-bubble",
    "line-loading",
    "radial-activity-loading",
  ]) {
    await page.goto(`${origin}/?recipe=${id}`);
    const recipe = page.locator(`[data-recipe="${id}"]`);
    await recipe.waitFor();
    assert.ok(await recipe.locator("[data-chart-alternative]").count());
    if (id.endsWith("loading")) {
      await recipe.locator('[role="status"]').first().waitFor();
    } else {
      await recipe.locator('svg, [data-kind-ui="heatmap-grid"]').first().waitFor();
      assert.ok(await recipe.locator("[aria-label]").count(), `${id}: accessible name absent`);
    }
    if (id === "line") {
      const mark = await recipe.locator(".recharts-line-curve").first().elementHandle();
      const legend = recipe.locator('[data-kind-ui="chart-legend-button"]').first();
      await legend.focus();
      await page.keyboard.press("Enter");
      assert.equal(
        await mark.evaluate((node) => node.isConnected),
        true,
        "Legend replaced line identity",
      );
      await page.keyboard.press("Enter");
      assert.equal(await mark.evaluate((node) => node.isConnected), true);
      await recipe.locator(".recharts-surface").focus();
      await page.keyboard.press("ArrowRight");
      await page.locator('[data-kind-ui="chart-tooltip"]').first().waitFor();
      await page.waitForFunction(() =>
        [...document.querySelectorAll('[data-kind-ui="chart-tooltip"]')].some((node) =>
          node.innerText.includes("Visitors"),
        ),
      );
      const tooltip = await page
        .locator('[data-kind-ui="chart-tooltip"]:visible')
        .first()
        .innerText();
      assert.ok(tooltip.includes("Visitors"), `Unexpected line tooltip: ${tooltip}`);
      await page.keyboard.press("Escape");
    }
    if (id === "heatmap") {
      await recipe.locator('[data-kind-ui="heatmap-grid"] td[tabindex="0"]').first().focus();
      await page.keyboard.press("ArrowRight");
      await page.locator('[data-kind-ui="heatmap-tooltip"]').first().waitFor();
      await page.keyboard.press("Escape");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1)
      .catch(async () => {
        const overflow = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          nodes: [...document.querySelectorAll("body *")]
            .filter((node) => node.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 15)
            .map((node) => ({
              tag: node.tagName,
              class: node.getAttribute("class"),
              width: node.getBoundingClientRect().width,
              right: node.getBoundingClientRect().right,
            })),
        }));
        throw new Error(`${id}: mobile overflow ${JSON.stringify(overflow)}`);
      });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `${id}: mobile overflow`,
    );
    await page.setViewportSize({ width: 1000, height: 800 });
    results.push({ id, passed: true, motion: "reduced", dataAlternative: true });
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${origin}/?recipe=line-presentation-dashes`);
  const dashed = page.locator(".kind-ui-line-dash .recharts-line-curve").first();
  await dashed.waitFor();
  assert.equal(
    await dashed.evaluate((node) => getComputedStyle(node).animationName),
    "kind-ui-line-dash",
  );
  const dashedMark = await dashed.elementHandle();
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await dashed.evaluate((node) => getComputedStyle(node).animationName), "none");
  assert.equal(await dashedMark.evaluate((node) => node.isConnected), true);
  results.push({
    id: "line-presentation-dashes",
    passed: true,
    motion: "normal and reduced",
    identityPreserved: true,
  });
  // Exercise opt-in local frame composition as well as existing native caller compositions.
  for (const name of [
    "area",
    "bar",
    "box-plot",
    "combo",
    "heatmap",
    "histogram",
    "line",
    "pie",
    "radar",
    "radial",
    "sankey",
    "scatter",
    "waterfall",
    "activity-rings",
  ]) {
    await page.goto(`${origin}/?recipe=installed-${name}`);
    const chart = page.locator(`[data-recipe="installed-${name}"]`);
    await chart.locator('svg, [data-kind-ui="heatmap-grid"]').first().waitFor();
    results.push({ id: `installed-${name}`, passed: true, callerData: true });
  }
  assert.deepEqual(errors, []);
  mkdirSync("artifacts/registry", { recursive: true });
  writeFileSync(
    "artifacts/registry/browser.json",
    JSON.stringify(
      { publishedCore: evidence.coreVersion, recipes: results, browserErrors: errors },
      null,
      2,
    ),
  );
  console.log(
    "Published-core registry consumer: representative charts, ActivityRings, loading, reduced motion, data alternatives and mobile passed.",
  );
} finally {
  await browser.close();
  server.close();
}
