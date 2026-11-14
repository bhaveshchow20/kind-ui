import { expect, test } from "./browser";

test("projected line example explains its encoding and stays responsive", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/projected-line.html");
  const chart = page.getByRole("application", { name: "Monthly totals and estimates" });
  const description = page.getByText(
    "Dashed line segments are caller-supplied projected estimates.",
  );
  await expect(chart).toBeVisible();
  await expect(description).toBeVisible();
  await expect(chart).toHaveAttribute("aria-describedby", "projected-line-description");
  await expect(page.getByRole("row", { name: "Mar 15 Projected" })).toBeVisible();
  await expect(page.getByRole("row", { name: "Apr 17 Projected" })).toBeVisible();
  await chart.focus();
  for (let index = 0; index < 3; index++) await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toContainText("Projected");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 320, height: 700 });
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await expect(chart).toBeVisible();
  expect(errors).toEqual([]);
});
