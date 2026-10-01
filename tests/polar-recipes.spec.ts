import { expect, test } from "@playwright/test";

test("polar recipes use public components, accessible tables and controlled legends", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/polar.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Radar & radial charts");
  await expect(page.locator(".polar-card")).toHaveCount(6);
  await expect(page.locator(".polar-card svg[role=application]")).toHaveCount(6);
  await page.screenshot({
    path: "artifacts/chart-tests/polar-recipes-desktop.png",
    fullPage: true,
  });
  const comparison = page.locator(".polar-card").first();
  await comparison.getByRole("button", { name: "Actual", exact: true }).click();
  await expect(comparison.locator(".recharts-radar")).toHaveCount(1);
  await comparison.getByText("View values", { exact: true }).click();
  await expect(comparison.getByRole("table")).toBeVisible();
  await page.getByRole("combobox", { name: "Data", exact: true }).selectOption("zero");
  await expect(comparison.getByRole("cell", { name: "0", exact: true })).toHaveCount(5);
  await page.getByRole("combobox", { name: "Data", exact: true }).selectOption("empty");
  await expect(page.getByText("No scores yet.", { exact: true })).toHaveCount(6);
  await page.getByRole("combobox", { name: "Data", exact: true }).selectOption("sample");
  await page.getByRole("button", { name: "Update scores" }).click();
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator(".polar-card svg[role=application]")).toHaveCount(6);
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/chart-tests/polar-recipes-mobile.png", fullPage: true });
});
