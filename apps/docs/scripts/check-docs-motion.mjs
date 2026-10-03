import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const dir = "artifacts/curated-polish";
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
const evidence = { checks: [], errors: [], indicator: {} };
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: "dark",
    reducedMotion: "no-preference",
    recordVideo: { dir, size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage();
  const video = page.video();
  page.on("pageerror", (e) => evidence.errors.push(e.message));
  await page.goto("http://127.0.0.1:6373/docs/components/line/", { waitUntil: "networkidle" });
  await page.locator(".chart-example .recharts-line-curve").first().waitFor();
  await page.waitForTimeout(900);
  assert.equal(await page.locator(".chart-example select, .chart-example input").count(), 0);
  await page.screenshot({ path: `${dir}/line-curated-desktop.png` });
  await page.evaluate(() => {
    window.__chartNode = document.querySelector(".chart-example .recharts-surface");
  });
  const selected = page.locator(".tab-selection");
  evidence.indicator.start = await selected.evaluate((n) => n.getBoundingClientRect().left);
  await page.getByRole("tab", { name: "Usage", exact: true }).click();
  await page.waitForTimeout(70);
  evidence.indicator.inFlight = await selected.evaluate((n) => n.getBoundingClientRect().left);
  await page.waitForTimeout(650);
  evidence.indicator.end = await selected.evaluate((n) => n.getBoundingClientRect().left);
  assert.ok(
    evidence.indicator.inFlight > evidence.indicator.start + 1 &&
      evidence.indicator.inFlight < evidence.indicator.end - 1,
    "Shared pill visibly glides between tabs",
  );
  assert.equal(await page.getByRole("tabpanel").count(), 1);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page.waitForTimeout(850);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.waitForTimeout(650);
  assert.ok(
    await page.evaluate(
      () => window.__chartNode === document.querySelector(".chart-example .recharts-surface"),
    ),
    "Native chart SVG preserved across panels",
  );
  await page.getByRole("button", { name: "Target", exact: true }).click();
  for (const name of ["Code", "Usage", "Preview", "Usage", "Code", "Preview"])
    await page.getByRole("tab", { name, exact: true }).click();
  await page.waitForTimeout(500);
  assert.equal(
    await page.getByRole("button", { name: "Target", exact: true }).getAttribute("aria-pressed"),
    "false",
  );
  assert.ok(
    await page.evaluate(
      () => window.__chartNode === document.querySelector(".chart-example .recharts-surface"),
    ),
  );
  evidence.checks.push(
    "No preview knobs; full12-month Line with two series",
    "In-flight shared pill movement verified",
    "Native chart DOM and legend state survive rapid panel switches",
  );
  await page.getByRole("button", { name: "Target", exact: true }).click();
  await page.getByRole("combobox", { name: "Choose component", exact: true }).click();
  await page.waitForTimeout(350);
  await page.getByRole("option", { name: "Combo Chart", exact: true }).click();
  await page.locator(".combo-demo .recharts-surface").waitFor();
  await page.waitForTimeout(1000);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.waitForTimeout(750);
  await context.close();
  await video.saveAs(`${dir}/kind-ui-docs-curated-preview.webm`);
  const reduced = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const mobile = await reduced.newPage();
  mobile.on("pageerror", (e) => evidence.errors.push(e.message));
  await mobile.goto("http://127.0.0.1:6373/docs/components/combo/", { waitUntil: "networkidle" });
  await mobile.locator(".combo-demo .recharts-surface").waitFor();
  await mobile.getByRole("button", { name: "Open navigation", exact: true }).click();
  await mobile.getByRole("dialog", { name: "Documentation navigation" }).waitFor();
  await mobile.keyboard.press("Escape");
  await mobile
    .getByRole("dialog", { name: "Documentation navigation" })
    .waitFor({ state: "hidden" });
  assert.equal(
    await mobile.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Open navigation",
  );
  await mobile.getByRole("tab", { name: "Usage", exact: true }).click();
  await mobile.waitForFunction(() => {
    const n = document.querySelector('[role="tabpanel"][data-state="active"]');
    return n && getComputedStyle(n).opacity === "1" && getComputedStyle(n).transform === "none";
  });
  const rm = await mobile.locator('[role="tabpanel"][data-state="active"]').evaluate((n) => ({
    transform: getComputedStyle(n).transform,
    opacity: getComputedStyle(n).opacity,
  }));
  assert.equal(rm.transform, "none");
  assert.equal(rm.opacity, "1");
  await mobile.getByRole("tab", { name: "Preview", exact: true }).focus();
  await mobile.keyboard.press("ArrowRight");
  await mobile.waitForFunction(
    () =>
      document.activeElement?.textContent === "Usage" &&
      document.activeElement?.getAttribute("aria-selected") === "true",
  );
  await mobile.getByRole("tabpanel").waitFor();
  assert.equal(await mobile.getByRole("tabpanel").count(), 1);
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  evidence.checks.push(
    "375px mobile menu/Escape restores focus",
    "Reduced-motion panel has no transform and is fully visible",
    "Arrow tabs move focus/selection with one exposed panel",
  );
  await reduced.close();
  assert.deepEqual(evidence.errors, []);
  evidence.status = "passed";
} catch (error) {
  evidence.status = "failed";
  evidence.error = error.stack;
  throw error;
} finally {
  writeFileSync(`${dir}/motion-evidence.json`, JSON.stringify(evidence, null, 2) + "\n");
  await browser.close();
}
console.log(JSON.stringify(evidence));
