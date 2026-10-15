import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4204 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;

test("initial default selection survives loading and is consumed only once", async ({ page }) => {
  await page.goto(`${url}/?selection-contract&initial-empty`);
  const callbacks = page.locator('output[aria-label="Selection callbacks"]');
  const content = page.locator('[data-kind-ui="candlestick-readout"]');
  await expect(callbacks).toHaveText("[]");
  await page.getByRole("button", { name: "Change default selection", exact: true }).click();
  await page.getByRole("button", { name: "Load observations", exact: true }).click();
  await expect(content).toContainText("selected 2000");
  await expect(callbacks).toHaveText("[]");
  await page.getByRole("button", { name: "Empty observations", exact: true }).click();
  await expect(callbacks).toHaveText("[null]");
  await page.getByRole("button", { name: "Load observations", exact: true }).click();
  await expect(content).toContainText("selected None");
  await expect(callbacks).toHaveText("[null]");
});

test("Enter and Space preserve persistent selection without transient inspection", async ({
  page,
}) => {
  await page.goto(`${url}/?selection-contract`);
  const content = page.locator('[data-kind-ui="candlestick-readout"]');
  const frame = page.locator('[data-kind-ui="chart"]').first();
  await frame.focus();
  await expect(content).toContainText("selected 2000");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(content).toContainText("selected 2000");
  await expect(page.locator('output[aria-label="Selection callbacks"]')).toHaveText("[]");
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(content).toContainText("selected 1000");
  await page.keyboard.press("Escape");
  await expect(content).toContainText("selected None");
  await expect(page.locator('output[aria-label="Selection callbacks"]')).toHaveText("[1000,null]");
});

test("Candlestick focus opacity uses supplied transitions and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?selection-contract&motion`);
  const price = page.getByRole("button", { name: "Highlight Observed price", exact: true });
  const volumePaint = page.locator(
    '[data-series="volume"] [data-kind-ui="series-interaction-paint"]',
  );
  await expect(price).toBeVisible();
  await price.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  const opacity = await volumePaint.evaluate((node) => Number(getComputedStyle(node).opacity));
  expect(opacity).toBeGreaterThan(0.8);
  expect(opacity).toBeLessThan(1);
  await expect(volumePaint).toHaveCSS("opacity", "0.28");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.press("Escape");
  await expect(volumePaint).toHaveCSS("opacity", "1");
  await page.keyboard.press("Enter");
  await expect(volumePaint).toHaveCSS("opacity", "0.28");
});

test("missing pending selection reports removal after first history arrives", async ({ page }) => {
  await page.goto(`${url}/?selection-contract&initial-empty&missing-default`);
  const callbacks = page.locator('output[aria-label="Selection callbacks"]');
  await expect(callbacks).toHaveText("[]");
  await page.getByRole("button", { name: "Load observations", exact: true }).click();
  await expect(callbacks).toHaveText("[null]");
  await expect(page.locator('[data-kind-ui="candlestick-readout"]')).toContainText("selected None");
});
