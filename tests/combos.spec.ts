import { expect, test } from "@playwright/test";

test("Combo recipes render three useful compositions with independently controlled legends", async ({
  page,
}) => {
  await page.goto("/combos.html");
  const load = page.getByRole("region", { name: "Workload & latency", exact: true });
  const cash = page.getByRole("region", { name: "Net cash against plan", exact: true });
  const forecast = page.getByRole("region", { name: "Actuals & forecast", exact: true });
  await expect(load.locator(".recharts-area-area")).toHaveCount(1);
  await expect(load.locator(".recharts-line-curve")).toHaveCount(1);
  await expect(load.locator(".recharts-bar")).toHaveCount(1);
  await expect(cash.locator(".recharts-bar")).toHaveCount(2);
  await expect(forecast.locator(".recharts-line-dots path")).toHaveCount(6);
  await load.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(load.locator(".recharts-bar")).toHaveCount(0);
  await expect(forecast.locator(".recharts-bar")).toHaveCount(1);
  await cash.getByText("View data", { exact: true }).click();
  await expect(cash.getByRole("table")).toContainText("No data");
  await expect(cash.getByRole("row").filter({ hasText: "Wed" })).toContainText("0");
});

test("phone layout and shared keyboard tooltip remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/combos.html");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const load = page.getByRole("region", { name: "Workload & latency", exact: true });
  await load.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(load.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveCount(3);
  await expect(load.locator('[data-kind-ui="chart-tooltip"]')).toContainText("ms");
});

test("recipe Motion replay runs entrances and preserves hidden legends", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("/combos.html");
  const load = page.getByRole("region", { name: "Workload & latency", exact: true });
  await load.getByRole("button", { name: "Completed", exact: true }).click();
  await page.getByLabel("Motion", { exact: true }).check();
  await expect(load.locator('[data-combo-reveal="line"]')).toHaveCount(1);
  await expect(load.locator('[data-combo-reveal="area"]')).toHaveCount(1);
  await expect(load.getByRole("button", { name: "Completed", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(load.locator(".recharts-bar")).toHaveCount(0);
  await page.clock.runFor(1500);
  await expect(page.locator('[data-combo-reveal], [data-kind-ui="bar-reveal"]')).toHaveCount(0);
});
