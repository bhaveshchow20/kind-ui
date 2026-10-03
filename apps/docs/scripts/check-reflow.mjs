import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../../../node_modules/@playwright/test/index.mjs";

const dir = new URL("../artifacts/reflow-check/", import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evidence = { scope: "Only the revised Combo page, final 200% text reflow", checks: [] };
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:6373/docs/components/combo/", { waitUntil: "networkidle" });
  await page.locator(".combo-demo .recharts-surface").waitFor();
  const font = async (selector) =>
    page
      .locator(selector)
      .first()
      .evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
  const baseHeading = await font(".doc-heading h1");
  const baseDescription = await font(".doc-heading > p");
  const baseTab = await font("[role=tab]");
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  await page.waitForFunction(
    (size) =>
      parseFloat(getComputedStyle(document.querySelector(".doc-heading h1")).fontSize) >=
      size * 1.99,
    baseHeading,
    { timeout: 5000 },
  );
  const enlargedHeading = await font(".doc-heading h1");
  const enlargedDescription = await font(".doc-heading > p");
  const enlargedTab = await font("[role=tab]");
  evidence.fontSizes = {
    baseHeading,
    enlargedHeading,
    baseDescription,
    enlargedDescription,
    baseTab,
    enlargedTab,
  };
  evidence.rootStyles = await page.evaluate(() => ({
    fontSize: getComputedStyle(document.documentElement).fontSize,
    style: document.documentElement.getAttribute("style"),
  }));
  await page.screenshot({ path: `${dir}/combo-mobile-200-percent.png`, fullPage: false });
  assert.ok(enlargedHeading >= baseHeading * 1.99);
  assert.ok(enlargedDescription >= baseDescription * 1.99);
  assert.ok(enlargedTab >= baseTab * 1.99);
  evidence.fontSizes = {
    baseHeading,
    enlargedHeading,
    baseDescription,
    enlargedDescription,
    baseTab,
    enlargedTab,
  };
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
    "Horizontal viewport overflow at 200%",
  );
  await page.screenshot({ path: `${dir}/combo-mobile-200-percent.png`, fullPage: false });
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page.locator(".source-code .shiki").waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
    "Code viewport overflow at 200%",
  );
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("dialog", { name: "Documentation navigation", exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
    "Navigation viewport overflow at 200%",
  );
  await page.screenshot({ path: `${dir}/navigation-mobile-200-percent.png`, fullPage: false });
  await page.getByRole("button", { name: "Close navigation", exact: true }).click();
  evidence.checks = [
    "Actual heading/description/tab text doubles",
    "No horizontal viewport overflow in Preview, Code or navigation at 390px",
    "Tabs and navigation remain operable",
  ];
  evidence.status = "passed";
  await context.close();
} catch (error) {
  evidence.status = "failed";
  evidence.error = error.stack;
  throw error;
} finally {
  writeFileSync(`${dir}/evidence.json`, JSON.stringify(evidence, null, 2) + "\n");
  await browser.close();
}
console.log(JSON.stringify(evidence, null, 2));
