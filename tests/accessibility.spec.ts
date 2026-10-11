import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./browser";

// Automated WCAG checks complement the chart's keyboard, data and geometry contracts.
test("public chart remains accessible before and during keyboard inspection", async ({ page }) => {
  await page.goto("/");
  const chart = page.getByRole("application", { name: "Task outcomes by day" });
  await expect(chart).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  const audit = () =>
    new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect((await audit()).violations).toEqual([]);
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toBeVisible();
  expect((await audit()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("status")).not.toBeVisible();
});
