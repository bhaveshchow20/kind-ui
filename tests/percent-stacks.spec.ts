import { expect, test } from "./browser";

for (const family of ["Bar", "Horizontal Bar", "Area", "Combo"]) {
  test(`Percent ${family} scopes value ticks and keeps raw accessible values`, async ({ page }) => {
    await page.goto("/contracts.html");
    const chart = page.getByRole("region", { name: `Percent ${family}`, exact: true });
    await expect(
      chart.locator(".recharts-cartesian-axis-tick-value").filter({ hasText: "100%" }),
    ).toHaveCount(1);
    const categoryAxis = chart.locator(
      family === "Horizontal Bar" ? ".recharts-yAxis" : ".recharts-xAxis",
    );
    await expect(categoryAxis).toContainText("Mon");
    await expect(categoryAxis).not.toContainText("%");
    await chart.getByRole("application").focus();
    await page.keyboard.press("ArrowRight");
    const tooltip = chart.locator('[data-kind-ui="chart-tooltip"]');
    await expect(tooltip).toContainText("25% (1)");
    await expect(tooltip).toContainText("75% (3)");
    if (family === "Combo") {
      await expect(tooltip).toContainText("Latency8");
      await expect(chart.locator(".recharts-yAxis").last()).not.toContainText("%");
    }
    await expect(chart.getByRole("table")).toContainText("No data");
    await expect(chart.getByRole("row").filter({ hasText: "Tue" })).toContainText("00");
  });
}
