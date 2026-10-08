import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { referenceTitle } from "../lib/api-reference.mjs";
import { swipeUp } from "./touch-swipe.mjs";

const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
const api = JSON.parse(readFileSync("generated/api.json", "utf8"));
const pages = {
  root: ["Root", "LoadingReference"],
  legend: ["Legend"],
  tooltip: ["Tooltip", "TooltipContent"],
  "series-config": ["SeriesMetadata"],
};
const evidence = [];
const errors = [];
const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: mobile ? 375 : 1440, height: mobile ? 812 : 1080 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const cdp = mobile ? await context.newCDPSession(page) : undefined;
    for (const [slug, names] of Object.entries(pages)) {
      assert.equal((await page.goto(`${origin}/docs/chart-components/${slug}/`)).status(), 200);
      await page.evaluate(() => document.fonts.ready);
      const tables = page.locator(".line-props-scroll");
      assert.deepEqual(
        await tables.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label"))),
        names.map((name) => `${referenceTitle(name)} props`),
      );
      assert.ok((await page.locator("pre").count()) > 0, `${slug} usage source`);
      for (const [i, name] of names.entries()) {
        const table = tables.nth(i);
        assert.deepEqual(await table.locator("thead th").allTextContents(), [
          "Prop",
          "Type",
          "Default",
          "Description",
        ]);
        assert.deepEqual(
          await table.locator("tbody td:first-child").allTextContents(),
          api[name].map((entry) => entry.name),
        );
        await table.scrollIntoViewIfNeeded();
        const box = await table.boundingBox();
        const before = await page.evaluate(() => scrollY);
        const direction = before > 150 ? -1 : 1;
        const y = Math.max(200, Math.min(mobile ? 500 : 800, box.y + 70));
        if (mobile) await swipeUp(cdp, { x: 200, y, distance: 180 * direction });
        else {
          await page.mouse.move(Math.min(box.x + 80, 1000), y);
          await page.mouse.wheel(0, 220 * direction);
        }
        await page.waitForTimeout(300);
        assert.ok(
          ((await page.evaluate(() => scrollY)) - before) * direction > (mobile ? 40 : 60),
          `${name} traps ${mobile ? "touch" : "wheel"}`,
        );
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          `${name} page overflow`,
        );
        evidence.push({
          name,
          mobile,
          gesture: mobile ? "touch" : "wheel",
          fullProps: true,
          pageBounds: true,
        });
      }
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    "artifacts/shared-tables-results.json",
    JSON.stringify({ evidence, errors }, null, 2),
  );
  console.log(
    "All six shared API tables retain public props and chain desktop wheel/mobile touch without page overflow.",
  );
} finally {
  await browser.close();
}
