import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { referenceTitle } from "../lib/api-reference.mjs";
import { swipeUp } from "./touch-swipe.mjs";

const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
const url = `${process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373"}/docs/components/line/`;
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  await desktop.goto(url);
  assert.equal(await desktop.getByRole("heading", { name: "Basic", exact: true }).count(), 0);
  assert.equal(await desktop.locator(".doc-footer").count(), 0);
  const tables = desktop.locator(".line-props-scroll");
  assert.deepEqual(
    await tables.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label"))),
    [
      "LineChart props",
      "LineSeries props",
      ...[
        "LinePresentationReference",
        "AreaPresentationReference",
        "BackgroundPatternReference",
      ].map((name) => `${referenceTitle(name)} props`),
    ],
  );
  for (let i = 0; i < (await tables.count()); i++) {
    assert.deepEqual(await tables.nth(i).locator("thead th").allTextContents(), [
      "Prop",
      "Type",
      "Default",
      "Description",
    ]);
    await tables.nth(i).scrollIntoViewIfNeeded();
    const box = await tables.nth(i).boundingBox();
    await desktop.mouse.move(box.x + 80, Math.max(150, Math.min(800, box.y + 100)));
    const before = await desktop.evaluate(() => scrollY);
    const direction = await desktop.evaluate(() =>
      document.documentElement.scrollHeight - innerHeight - scrollY > 150 ? 1 : -1,
    );
    await desktop.mouse.wheel(0, 220 * direction);
    await desktop.waitForTimeout(250);
    assert.ok(
      ((await desktop.evaluate(() => scrollY)) - before) * direction > 60,
      `Table ${i} traps wheel`,
    );
  }
  const mobile = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobile.newPage();
  await page.goto(url);
  const cdp = await mobile.newCDPSession(page);
  const mobileTables = page.locator(".line-props-scroll");
  for (let i = 0; i < (await mobileTables.count()); i++) {
    const table = mobileTables.nth(i);
    await table.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    const box = await table.boundingBox();
    const direction = await page.evaluate(() =>
      document.documentElement.scrollHeight - innerHeight - scrollY > 150 ? 1 : -1,
    );
    await swipeUp(cdp, {
      x: 200,
      y: Math.max(160, Math.min(550, box.y + 70)),
      distance: 180 * direction,
    });
    await page.waitForTimeout(250);
    assert.ok(
      ((await page.evaluate(() => scrollY)) - before) * direction > 40,
      `Table ${i} traps touch`,
    );
    assert.ok(await table.evaluate((node) => node.scrollWidth > node.clientWidth));
  }
  console.log(
    "All Line API tables chain wheel/touch; mobile horizontal scrolling retained; neutral heading/footer checks passed.",
  );
} finally {
  await browser.close();
}
