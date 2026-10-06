import { expect, test } from "./browser";

for (const family of ["Bar", "Horizontal Bar", "Area", "Combo"]) {
  test(`Percent ${family} scopes value ticks and keeps raw accessible values`, async ({ page }) => {
    await page.goto("/contracts.html");
    const chart = page.getByRole("region", { name: `Percent ${family}`, exact: true });
    await expect(
      chart.locator(".recharts-cartesian-axis-tick-value").filter({ hasText: "100%" }),
    ).toHaveCount(1);
    const categoryAxis = chart.locator(
      family === "Horizontal Bar" ? ".recharts-yAxis-tick-labels" : ".recharts-xAxis-tick-labels",
    );
    await expect(categoryAxis).toContainText("Mon");
    await expect(categoryAxis).not.toContainText("%");
    await chart.getByRole("application").focus();
    const tooltip = chart.locator('[data-kind-ui="chart-tooltip"]');
    await expect(tooltip).toContainText("25% (1)");
    await expect(tooltip).toContainText("75% (3)");
    if (family === "Combo") {
      await expect(tooltip).toContainText("Latency8");
      const latencyLabels = chart.locator(".recharts-yAxis-tick-labels").last();
      // Native expand applies [0, 1] to every numeric axis, even an unstacked line.
      await expect(latencyLabels.locator(".recharts-cartesian-axis-tick-value")).toHaveText([
        "0",
        "0.25",
        "0.5",
        "0.75",
        "1",
      ]);
      await expect(latencyLabels).not.toContainText("%");
    }
    await expect(chart.getByRole("table")).toContainText("No data");
    await expect(chart.getByRole("row").filter({ hasText: "Tue" })).toContainText("00");
  });
}
