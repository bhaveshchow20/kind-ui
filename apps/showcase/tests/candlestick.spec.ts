import { expect, test } from "@playwright/test";

test("Candlestick card preserves source-labelled inspection, copied code and pending install boundary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => sessionStorage.setItem("candlestick-code", value),
      },
    });
  });
  await page.goto("./");
  await page.getByRole("tab", { name: "Candlestick", exact: true }).click();
  const card = page.locator(".demo-grid .chart-card");
  await expect(card).toHaveCount(1);
  await expect(card.locator(".chart-summary")).toContainText("USD/share · synthetic executions");
  await expect(card.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(20);
  const table = card.getByRole("table", {
    name: "Synthetic executions: daily OHLC in USD per share and volume in shares",
    exact: true,
  });
  await expect(table.getByRole("row")).toHaveCount(21);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await expect(table.getByRole("row").nth(1)).toContainText("Synthetic executions");
  const frame = card.locator('[data-kind-ui="chart"]').first();
  const readout = card.locator('[data-kind-ui="candlestick-content"][role="status"]');
  await frame.focus();
  await frame.press("Home");
  await expect(readout).toContainText("09-14");
  await expect(readout).toContainText("$187.30");
  await expect(readout).toContainText("420,000 shares");
  await frame.press("End");
  await expect(readout).toContainText("10-09");
  await expect(readout).toContainText("$206.40");
  await frame.press("Enter");
  await expect(table.locator('tr[data-selected="true"]')).toContainText("10-09");
  await frame.press("Escape");
  await expect(readout).toBeEmpty();
  await expect(table.locator('tr[data-selected="true"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Expand Session price action", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("slider", { name: "Wick weight", exact: true })).toHaveAttribute(
    "aria-valuenow",
    "1.5",
  );
  await expect(dialog.getByRole("slider", { name: "Candle width", exact: true })).toHaveAttribute(
    "aria-valuenow",
    "14",
  );
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  await dialog.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(dialog.locator('.playground-footer [role="status"]')).toHaveText("Code copied");
  const copied = await page.evaluate(() => sessionStorage.getItem("candlestick-code"));
  expect(copied).toContain('from "@kind-ui/charts"');
  expect(copied).toContain("<CandlestickChart.Volume");
  expect(copied).toContain("<CandlestickChart.DataTable<Row>");
  expect(copied).toContain("Synthetic executions");
  expect(copied).toContain("Requires the upcoming Core release");
  expect(copied).not.toMatch(/responsive|localhost|127\.0\.0\.1/);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

  const install = page.getByRole("region", { name: "Install Kind UI Charts" });
  await install.getByRole("tab", { name: "shadcn", exact: true }).click();
  const picker = install.locator(".install-chart-picker");
  const initial = await picker.getAttribute("aria-label");
  expect(initial).toBeTruthy();
  let wrapped = false;
  for (let index = 0; index < 30; index += 1) {
    const current = await picker.getAttribute("aria-label");
    expect(current).not.toMatch(/candlestick/i);
    await picker.click();
    await expect(picker).not.toHaveAttribute("aria-label", current ?? "");
    if ((await picker.getAttribute("aria-label")) === initial) {
      wrapped = true;
      break;
    }
  }
  expect(wrapped).toBe(true);
  expect(errors).toEqual([]);
});
