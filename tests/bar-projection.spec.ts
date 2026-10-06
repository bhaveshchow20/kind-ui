import { expect, test } from "@playwright/test";

for (const horizontal of [false, true]) {
  test(`projected identity survives grouped/stacked ${horizontal ? "horizontal" : "vertical"} bars`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:4183/?projection${horizontal ? "&horizontal" : ""}`);
    const marks = page.locator(".recharts-bar-rectangle path");
    const projected = page.locator('.recharts-bar-rectangle path[fill*="-projection"]');
    await expect(projected).toHaveCount(2);
    // Missing values create no projected mark; unpatterned observed values keep the gradient.
    await expect(page.locator('pattern[id$="-projection"]').first().locator("rect").first()).toHaveCSS("fill", "rgb(255, 0, 0)");
    const resources = await page.locator("pattern").evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(resources).size).toBe(resources.length);
    await expect(page.getByRole("row", { name: "Projected 6 3 Projected" })).toBeVisible();
    await projected.first().hover();
    await expect(page.locator('[data-kind-ui="projection-status"]').first()).toHaveText("Projected");
    await page.getByRole("button", { name: "Reverse projection rows" }).click();
    await expect(projected).toHaveCount(2);
    await expect(marks.first()).toHaveAttribute("fill", /-projection/);
    await page.getByRole("button", { name: "Stack projection bars" }).click();
    await expect(projected).toHaveCount(2);
    await page.getByRole("button", { name: "Filter projected row" }).click();
    await expect(projected).toHaveCount(0);
    await expect(page.getByRole("row", { name: "Projected 6 3 Projected" })).toHaveCount(0);
    await page.getByRole("button", { name: "Filter projected row" }).click();
    await expect(projected).toHaveCount(2);
    for (const name of ["Custom projection cells", "Explicit projection fill", "Disable projection pattern", "Native projection shape", "Datum projection fill", "Datum projection style", "Active projection shape"]) {
      await page.getByRole("button", { name }).click();
      await expect(projected).toHaveCount(0);
      await page.getByRole("button", { name }).click();
      await expect(projected).toHaveCount(2);
    }
    await page.getByRole("button", { name: "Empty series override" }).click();
    await expect(projected).toHaveCount(2);
    await page.getByRole("button", { name: "Empty series override" }).click();
    // Data remains reversed: slicing [1,2] excludes the projected first row.
    await page.getByRole("button", { name: "Brush projection rows" }).click();
    await expect(projected).toHaveCount(0);
    await page.getByRole("button", { name: "Brush projection rows" }).click();
    await expect(projected).toHaveCount(2);
    await page.getByRole("button", { name: "Independent projection rows" }).click();
    await expect(projected).toHaveCount(2);
    await page.getByRole("button", { name: "Empty projection rows" }).click();
    await expect(marks).toHaveCount(0);
    await page.getByRole("button", { name: "Empty projection rows" }).click();
    await expect(projected).toHaveCount(2);
  });
}
