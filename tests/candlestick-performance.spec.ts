import { expect, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const url = `http://127.0.0.1:${4204 + offset}`;

test("inspection of a 240-candle history does not repaint unchanged consumer geometry", async ({
  page,
}) => {
  await page.goto(`${url}/?performance&custom`);
  await expect(page.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(240);
  await page.waitForTimeout(250);
  const svg = await page.locator("svg.recharts-surface").first().boundingBox();
  if (!svg) throw new Error("Missing native chart surface");
  const before = await page.evaluate(() => document.documentElement.dataset.candlePaints);
  for (let index = 0; index < 12; index++) {
    await page.mouse.move(svg.x + 50 + index * 65, svg.y + 150);
  }
  await expect(page.locator('[data-kind-ui="candlestick-content"]')).toContainText("Open");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.candlePaints))
    .toBe(before);
  await expect(page.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(240);
});

test("viewport changes retain the logical default candle nodes", async ({ page }) => {
  await page.goto(`${url}/?performance`);
  await expect(page.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(240);
  await page.waitForTimeout(250);
  const mark = await page
    .locator('[data-kind-ui="candlestick-mark"][aria-label^="1760007200000:"]')
    .elementHandle();
  if (!mark) throw new Error("Missing retained historical candle");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(162);
  expect(await mark.evaluate((node) => node.isConnected)).toBe(true);
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect(page.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(240);
  expect(await mark.evaluate((node) => node.isConnected)).toBe(true);
  // Native Bars supply grouping/tooltip registration without per-candle background work.
  await expect(page.locator(".recharts-bar-background-rectangle")).toHaveCount(0);
  expect(await page.locator(".recharts-bar-rectangle").count()).toBeLessThan(8);
});
