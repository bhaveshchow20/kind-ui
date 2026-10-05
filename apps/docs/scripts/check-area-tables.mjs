import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { swipeUp } from "./touch-swipe.mjs";

const browser = await chromium.launch();
const url = "http://127.0.0.1:6373/docs/components/area/";
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  await desktop.goto(url);
  assert.equal(await desktop.getByRole("heading", { name: "Basic", exact: true }).count(), 0);
  assert.equal(await desktop.locator(".doc-footer").count(), 0);
  const tables = desktop.locator(".line-props-scroll");
  assert.equal(await tables.count(), 9);
  for (let i = 0; i < (await tables.count()); i++) {
    await tables.nth(i).scrollIntoViewIfNeeded();
    const box = await tables.nth(i).boundingBox();
    await desktop.mouse.move(box.x + 80, Math.max(150, Math.min(800, box.y + 100)));
    const before = await desktop.evaluate(() => scrollY);
    await desktop.mouse.wheel(0, 220);
    await desktop.waitForTimeout(250);
    assert.ok((await desktop.evaluate(() => scrollY)) > before + 60, `Table ${i} traps wheel`);
  }
  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobile.newPage();
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  const cdp = await mobile.newCDPSession(page);
  const mobileTables = page.locator(".line-props-scroll");
  for (let i = 0; i < (await mobileTables.count()); i++) {
    const table = mobileTables.nth(i);
    await table.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    const box = await table.boundingBox();
    await swipeUp(cdp, {
      x: 200,
      y: Math.max(160, Math.min(650, box.y + 70)),
      distance: 180,
    });
    await page.waitForTimeout(250);
    assert.ok((await page.evaluate(() => scrollY)) > before + 40, `Table ${i} traps touch`);
    assert.ok(await table.evaluate((node) => node.scrollWidth > node.clientWidth));
  }
  writeFileSync(
    "artifacts/area-tables-results.json",
    JSON.stringify(
      { tables: 9, wheel: "passed", touch: "passed", horizontalMobileScroll: "passed" },
      null,
      2,
    ),
  );
  console.log(
    "All 9 Area API tables chain wheel/touch; mobile horizontal scrolling retained; neutral heading/footer checks passed.",
  );
} finally {
  await browser.close();
}
