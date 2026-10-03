import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

const origin = "http://127.0.0.1:6373";
async function waitForSelectedTab(page, name) {
  // Radix roving focus schedules focus; automatic activation follows that focus.
  await page.waitForFunction(
    (name) =>
      [...document.querySelectorAll('[role="tab"]')].some(
        (node) =>
          node.textContent === name &&
          node.getAttribute("aria-selected") === "true" &&
          document.activeElement === node,
      ),
    name,
  );
  await page.getByRole("tabpanel").waitFor();
  assert.equal(await page.getByRole("tabpanel").count(), 1, "Only selected panel is exposed");
}
const bundles = JSON.parse(readFileSync("generated/examples.json", "utf8"));
const provenance = JSON.parse(readFileSync("vendor/provenance.json", "utf8"));
mkdirSync("artifacts/curated-polish", { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const errors = [];
  const results = [];
  const performance = [];
  async function ready(page, id) {
    await page.goto(`${origin}/docs/components/${id}/`, { waitUntil: "load" });
    await page.locator(`[data-component="${id}"] .chart-example`).waitFor();
    assert.equal(
      await page.locator(".chart-example select, .chart-example input").count(),
      0,
      `${id}: preview knobs removed`,
    );
    if (id === "heatmap") await page.locator('[role="grid"]').waitFor();
    else
      await page.waitForFunction(() =>
        [...document.querySelectorAll(".chart-example svg path, .chart-example svg rect")].some(
          (n) => {
            const b = n.getBoundingClientRect();
            return b.width > 1 && b.height > 1 && getComputedStyle(n).visibility !== "hidden";
          },
        ),
      );
  }
  async function checkWidth(page, label) {
    await page.waitForFunction(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2,
      null,
      { timeout: 2000 },
    );
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.width + 2,
      `${label} page overflows: ${JSON.stringify(dimensions)}`,
    );
  }
  for (const id of Object.keys(bundles)) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
      reducedMotion: "reduce",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push({ id, message: error.message }));
    await ready(page, id);
    await checkWidth(page, id);
    if (["combo", "donut", "scatter", "heatmap"].includes(id)) {
      const sample = await page.evaluate(() => ({
        usefulChartMs: Math.round(performance.now()),
        resources: performance
          .getEntriesByType("resource")
          .filter((entry) => new URL(entry.name).pathname.endsWith(".js"))
          .map((entry) => ({
            url: entry.name,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
          })),
      }));
      const paths = sample.resources.map((entry) =>
        decodeURIComponent(new URL(entry.url).pathname),
      );
      const gzipBytes = paths.reduce(
        (total, file) => total + gzipSync(readFileSync(`out${file}`)).byteLength,
        0,
      );
      performance.push({
        id,
        viewport: "desktop",
        chartReadyMs: sample.usefulChartMs,
        scripts: paths.length,
        localRawJSBytes: sample.resources.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
        estimatedGzipJSBytes: gzipBytes,
        compilerInClient: false,
        note: "Local static HTTP, no network throttling; gzip is a file-size estimate, not Sites transfer measurement.",
      });
      await page.screenshot({
        path: `artifacts/curated-polish/${id}-desktop-final.png`,
        fullPage: false,
      });
    }
    const workbench = page.locator(`[data-component="${id}"]`);
    if (id === "line") {
      assert.equal(await workbench.getByRole("tab", { name: "Usage", exact: true }).count(), 0);
    } else {
      await workbench.getByRole("tab", { name: "Usage", exact: true }).click();
      await workbench
        .getByRole("tabpanel")
        .filter({ visible: true })
        .getByText("npm ci", { exact: false })
        .first()
        .waitFor();
    }
    await workbench.getByRole("tab", { name: "Code", exact: true }).click();
    assert.equal(
      (await workbench.locator("pre code").last().textContent()).trimEnd(),
      bundles[id].files[`src/examples/${id}/example.tsx`].trimEnd(),
    );
    await workbench
      .getByRole("button", { name: id === "line" ? "Copy Text" : "Copy file", exact: true })
      .click();
    assert.equal(
      (await page.evaluate(() => navigator.clipboard.readText())).trimEnd(),
      bundles[id].files[`src/examples/${id}/example.tsx`].trimEnd(),
    );
    await workbench.getByRole("tab", { name: "Preview", exact: true }).click();
    await page.setViewportSize({ width: 375, height: 812 });
    await checkWidth(page, `${id} mobile`);
    if (["donut", "scatter", "heatmap"].includes(id))
      await page.screenshot({
        path: `artifacts/curated-polish/${id}-mobile-final.png`,
        fullPage: false,
      });
    results.push({ id, desktopAndMobile: "passed", tabsAndCopy: "passed" });
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    permissions: ["clipboard-read", "clipboard-write"],
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push({ id: "interactions", message: error.message }));
  await ready(page, "donut");
  const workbench = page.locator('[data-component="donut"]');
  await workbench.getByRole("button", { name: "Research", exact: true }).click();
  await workbench.getByRole("button", { name: "Copy prompt", exact: true }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(
    prompt.includes('"hole":52') &&
      prompt.includes('"material":"paper"') &&
      prompt.includes('"emphasis":"auto"'),
  );
  assert.ok(prompt.includes('"visible":["delivery","support","unplanned"]'));
  assert.ok(prompt.length < 7000);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    workbench.getByRole("button", { name: "Download example", exact: true }).click(),
  ]);
  const downloaded = await download.path();
  const files = unzipSync(readFileSync(downloaded));
  const selectedSource = strFromU8(files["src/examples/donut/settings.ts"]);
  assert.match(selectedSource, /"hole": 52/);
  assert.match(selectedSource, /"material": "paper"/);
  assert.ok(!selectedSource.includes('"research"'));
  assert.ok(prompt.includes(selectedSource));
  assert.equal(
    createHash("sha256").update(files["vendor/kind-ui-charts-0.0.0.tgz"]).digest("hex"),
    provenance.sha256,
  );
  for (const [name, bytes] of Object.entries(files)) {
    if (name.startsWith("vendor/")) continue;
    if (name.endsWith("settings.ts")) continue;
    assert.equal(strFromU8(bytes), bundles.donut.files[name]);
  }
  await workbench.getByRole("tab", { name: "Preview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await waitForSelectedTab(page, "Usage");
  assert.equal(
    await workbench.getByRole("tab", { name: "Usage", exact: true }).getAttribute("aria-selected"),
    "true",
  );
  await page.keyboard.press("End");
  await waitForSelectedTab(page, "Code");
  assert.equal(
    await workbench.getByRole("tab", { name: "Code", exact: true }).getAttribute("aria-selected"),
    "true",
  );
  await page.keyboard.press("Home");
  await waitForSelectedTab(page, "Preview");
  for (const name of ["Delivery", "Support", "Unplanned"])
    await workbench.getByRole("button", { name, exact: true }).click();
  await workbench
    .locator(".chart-example [role=status]")
    .filter({ hasText: "No allocated hours in included categories." })
    .waitFor();
  await workbench.getByRole("button", { name: "Copy prompt", exact: true }).click();
  assert.ok((await page.evaluate(() => navigator.clipboard.readText())).includes('"visible":[]'));
  await page.locator("#nd-sidebar").getByRole("link", { name: "Combo Chart", exact: true }).click();
  await page.waitForURL("**/docs/components/combo/");
  await page.locator('[data-component="combo"] .chart-example').waitFor();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  assert.equal(
    await page.getByRole("button", { name: "Completed", exact: true }).getAttribute("aria-pressed"),
    "false",
  );
  await page.getByRole("button", { name: "Search", exact: false }).first().click();
  await page.getByRole("dialog").getByRole("combobox").fill("waterfall");
  await page.getByRole("dialog").getByText("Waterfall", { exact: true }).first().waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Toggle Theme", exact: false }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await page.screenshot({ path: "artifacts/curated-polish/combo-dark-final.png", fullPage: false });
  await page.setViewportSize({ width: 320, height: 812 });
  await checkWidth(page, "320px dark Combo");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await checkWidth(page, "200% text dark Combo");
  await page.screenshot({
    path: "artifacts/curated-polish/combo-200pct-final.png",
    fullPage: false,
  });
  await context.close();
  writeFileSync(
    "artifacts/curated-browser-results.json",
    JSON.stringify(
      {
        examples: results,
        interactions: "passed",
        selectedDownload: "passed",
        compactPromptChars: prompt.length,
        errors,
        performance,
      },
      null,
      2,
    ) + "\n",
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(
    `13 family previews, source/copy parity, mobile widths, selected ZIP/prompt, filtering, keyboard tabs, family navigation, search, dark theme and enlarged text passed.`,
  );
} finally {
  await browser.close();
}
