import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, expect } from "@playwright/test";

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const evidence = [];
mkdirSync("artifacts/sankey", { recursive: true });
try {
  for (const width of [1440, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:6373/docs/components/sankey/");
    const first = page.locator('[data-component="sankey"]');
    const flows = first.locator('path[role="button"]');
    await flows.first().waitFor({ state: "attached" });
    assert.equal(await flows.count(), 18);
    const entrance = first.locator('[data-kind-ui="sankey-link-entrance"]');
    assert.equal(await entrance.count(), 18);
    // Completion removes the masks; observe that contract rather than assuming
    // the 900 ms animation and its React update finish inside a fixed 1 s sleep.
    await expect(entrance).toHaveCount(0, { timeout: 5000 });
    await flows.first().focus();
    await page.keyboard.press("Enter");
    assert.equal(await flows.first().getAttribute("aria-pressed"), "true");
    assert.match(await first.locator('p[role="status"]').textContent(), /Solar → North: 30 MWh/);
    await page.keyboard.press("Escape");
    assert.equal(await flows.first().getAttribute("aria-pressed"), "false");
    const point = await flows.first().evaluate((path) => {
      const local = path.getPointAtLength(path.getTotalLength() * 0.4);
      const screen = new DOMPoint(local.x, local.y).matrixTransform(path.getScreenCTM());
      return { x: screen.x, y: screen.y };
    });
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(100);
    assert.match(await first.locator(".recharts-tooltip-wrapper").textContent(), /30 MWh/);
    const region = first.getByRole("region", {
      name: "Energy flow diagram; scroll horizontally on small screens",
    });
    if (width < 540) {
      assert.equal(
        await region.evaluate((element) => element.scrollWidth > element.clientWidth),
        true,
      );
      await region.evaluate((element) => {
        element.scrollLeft = 100;
      });
      assert.ok((await region.evaluate((element) => element.scrollLeft)) > 0);
      await region.evaluate((element) => {
        element.scrollLeft = 0;
      });
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.mouse.move(width / 2, 450);
    const prior = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(150);
    assert.ok((await page.evaluate(() => scrollY)) > prior);
    await page.evaluate(() => {
      document.activeElement?.blur();
      scrollTo(0, 0);
    });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(100);
    await page.screenshot({ path: `artifacts/sankey/${width}.png`, fullPage: true });
    await page.screenshot({ path: `artifacts/sankey/${width}-viewport.png` });
    assert.deepEqual(errors, []);
    evidence.push({
      width,
      flows: 18,
      keyboardSelection: true,
      tooltip: true,
      horizontalScroll: width < 540,
      verticalWheel: true,
    });
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto("http://127.0.0.1:6373/docs/components/sankey/");
  await page.locator('path[role="button"]').first().waitFor({ state: "attached" });
  assert.equal(await page.locator('[data-kind-ui="sankey-link-entrance"]').count(), 0);
  const finishes = page.locator('[data-component="sankey-finishes"]');
  await finishes.getByRole("combobox", { name: "Finish" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("option", { name: "Default", exact: true }).waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "option");
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(() => document.activeElement?.textContent === "Clay");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() =>
    document
      .querySelector('[data-component="sankey-finishes"] [role="combobox"]')
      ?.textContent.includes("Clay"),
  );
  await finishes.getByRole("tab", { name: "Code", exact: true }).click();
  assert.match(await finishes.locator("pre").textContent(), /finish = "clay"/);
  await finishes.getByRole("tab", { name: "Preview", exact: true }).click();
  assert.equal(await finishes.locator('path[role="button"][filter]').count(), 18);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
    scrollTo(0, 0);
  });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: "artifacts/sankey/text-200.png", fullPage: true });
  await page.goto("http://127.0.0.1:6373/docs/components/line/");
  await page
    .locator('[data-component="line"] .recharts-line')
    .first()
    .waitFor({ state: "attached" });
  assert.ok(await page.getByRole("heading", { name: "Line Chart", exact: true }).count());
  evidence.push({
    reducedMotion: true,
    finishCodeParity: true,
    text200: true,
    lineCompatibility: true,
  });
  writeFileSync("artifacts/sankey/browser-results.json", JSON.stringify(evidence, null, 2));
  console.log(
    "Sankey desktop/mobile, selection, tooltip, finish parity, scrolling, reduced motion, 200% text and Line smoke checks passed.",
  );
} finally {
  await browser.close();
}
