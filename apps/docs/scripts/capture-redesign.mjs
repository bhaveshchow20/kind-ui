import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import { chromium } from "../../../node_modules/@playwright/test/index.mjs";

const dir = new URL("../artifacts/revised-preview/", import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const evidence = { scope: "One Combo Chart page and navigation", checks: [], screenshots: [] };
const url = "http://127.0.0.1:6373/docs/components/combo/";
async function ready(page) {
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".combo-demo .recharts-surface").waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".combo-demo svg path[d]")].some((node) => {
      const r = node.getBoundingClientRect();
      return r.width > 20 && r.height > 20;
    }),
  );
  await page.evaluate(() => document.fonts.ready);
}
function shot(name) {
  evidence.screenshots.push(name);
  return `${dir}/${name}.png`;
}
try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    colorScheme: "dark",
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await desktop.newPage();
  await ready(page);
  assert.equal(await page.getByRole("heading", { name: "Combo Chart", exact: true }).count(), 1);
  assert.equal(
    await page.getByRole("link", { name: "Combo Chart", exact: true }).getAttribute("aria-current"),
    "page",
  );
  await page.screenshot({ path: shot("components-combo-dark-desktop"), fullPage: false });
  evidence.desktop = await page.locator(".doc-article").boundingBox();
  await page.getByRole("tab", { name: "Preview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page.locator("[role=tab][data-state=active]").filter({ hasText: "Usage" }).waitFor();
  assert.equal(
    await page.getByRole("tab", { name: "Usage", exact: true }).getAttribute("aria-selected"),
    "true",
  );
  await page.keyboard.press("ArrowRight");
  await page.locator("[role=tab][data-state=active]").filter({ hasText: "Code" }).waitFor();
  assert.equal(
    await page.getByRole("tab", { name: "Code", exact: true }).getAttribute("aria-selected"),
    "true",
  );
  assert.ok(await page.locator(".source-code .shiki").count());
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page.screenshot({ path: shot("components-combo-dark-code"), fullPage: false });
  evidence.checks.push("Radix tab keyboard navigation and server-highlighted complete source");
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.getByRole("switch", { name: "Animation", exact: true }).check();
  await page.getByRole("button", { name: "Queued", exact: true }).click();
  await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(prompt.includes('"animate":true'));
  assert.ok(prompt.includes('"visible":["volume","latency"]'));
  assert.ok(prompt.includes("/markdown/components/combo.md"));
  assert.ok(prompt.length < 7000);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download example", exact: true }).click();
  const download = await downloadEvent;
  const zipPath = `${dir}/selected-example.zip`;
  await download.saveAs(zipPath);
  const entries = unzipSync(readFileSync(zipPath));
  const settings = strFromU8(entries["src/examples/combo/settings.ts"]);
  assert.ok(settings.includes('"animate": true'));
  assert.ok(!settings.includes('"buffer"'));
  assert.ok(entries["vendor/kind-ui-charts-0.0.0.tgz"]);
  evidence.checks.push(
    "Copy prompt and ZIP reproduce selected animation and visibility with pinned tarball",
  );
  evidence.promptCharacters = prompt.length;
  await page.getByRole("button", { name: "Search documentation", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  const input = page.getByRole("dialog").locator("input").first();
  await input.fill("visibility");
  await page.getByRole("dialog").getByRole("option").first().waitFor();
  await page.keyboard.press("Escape");
  evidence.checks.push("Lazy Fumadocs static search returns public documentation");
  await desktop.close();
  const light = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const lp = await light.newPage();
  await ready(lp);
  await lp.screenshot({ path: shot("components-combo-light-desktop"), fullPage: false });
  await light.close();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
    reducedMotion: "reduce",
    isMobile: true,
    hasTouch: true,
  });
  const mp = await mobile.newPage();
  await ready(mp);
  await mp.screenshot({ path: shot("components-combo-dark-mobile"), fullPage: false });
  await mp.getByRole("button", { name: "Open navigation", exact: true }).click();
  await mp.getByRole("dialog", { name: "Documentation navigation", exact: true }).waitFor();
  assert.equal(
    await mp
      .getByRole("dialog")
      .getByRole("link", { name: "Combo Chart", exact: true })
      .getAttribute("aria-current"),
    "page",
  );
  await mp.screenshot({ path: shot("components-navigation-dark-mobile"), fullPage: false });
  await mp.getByRole("button", { name: "Close navigation", exact: true }).click();
  for (const width of [390, 320]) {
    await mp.setViewportSize({ width, height: 844 });
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false, `Horizontal viewport overflow at ${width}px`);
  }
  await mp.setViewportSize({ width: 390, height: 844 });
  const originalTextSize = await mp
    .locator(".doc-heading h1")
    .evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
  await mp.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  const resizedTextSize = await mp
    .locator(".doc-heading h1")
    .evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
  assert.ok(
    resizedTextSize >= originalTextSize * 1.99,
    "Text actually doubles at 200% root font size",
  );
  assert.equal(
    await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
    "200% text viewport overflow",
  );
  evidence.checks.push(
    "Mobile dialog navigation, 390/320px containment and 200% root text containment",
  );
  await mobile.close();
  assert.deepEqual(errors, []);
  evidence.checks.push("No browser page errors");
  evidence.status = "passed";
} catch (error) {
  evidence.status = "failed";
  evidence.error = error.stack;
  throw error;
} finally {
  writeFileSync(`${dir}/evidence.json`, JSON.stringify(evidence, null, 2) + "\n");
  await browser.close();
}
console.log(JSON.stringify(evidence, null, 2));
