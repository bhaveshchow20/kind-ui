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
      await expect(latencyLabels.locator(".recharts-cartesian-axis-tick-value")).toHaveText([
        "0",
        "3",
        "6",
        "10",
      ]);
      // Check native geometry against the raw axis bounds, not just text formatting.
      const geometry = await chart.evaluate((region) => {
        const axis = [...region.querySelectorAll(".recharts-cartesian-axis-line")].at(-1);
        if (!axis) throw new Error("Missing raw axis line");
        const bounds = axis.getBoundingClientRect();
        const zero = bounds.bottom;
        const ten = bounds.top;
        const centerY = (node: Element) => {
          const b = node.getBoundingClientRect();
          return b.y + b.height / 2;
        };
        const dots = [...region.querySelectorAll(".recharts-line-dot")].map(centerY);
        const bars = [...region.querySelectorAll(".recharts-bar-rectangle path")].map((node) => {
          const b = node.getBoundingClientRect();
          return { x: b.x, top: b.top, bottom: b.bottom, height: b.height };
        });
        return { zero, ten, dots, bars };
      });
      expect(geometry.zero).toBeGreaterThan(geometry.ten);
      expect(geometry.dots).toHaveLength(3);
      for (const [index, raw] of [8, 4, 6].entries()) {
        const expected = geometry.zero + ((geometry.ten - geometry.zero) * raw) / 10;
        const dot = geometry.dots[index];
        if (dot === undefined) throw new Error("Missing latency dot");
        expect(Math.abs(dot - expected)).toBeLessThan(2);
      }
      const firstColumn = geometry.bars.filter(
        (bar) => Math.abs(bar.x - (geometry.bars[0]?.x ?? NaN)) < 1,
      );
      expect(firstColumn).toHaveLength(2);
      const heights = firstColumn.map((bar) => bar.height).sort((a, b) => a - b);
      expect(heights[0]).toBeCloseTo((geometry.zero - geometry.ten) * 0.25, 0);
      expect(heights[1]).toBeCloseTo((geometry.zero - geometry.ten) * 0.75, 0);
      await expect(latencyLabels).not.toContainText("%");
    }
    await expect(chart.getByRole("table")).toContainText("No data");
    await expect(chart.getByRole("row").filter({ hasText: "Tue" })).toContainText("00");
  });
}
