import { expect, test } from "@playwright/test";

for (const width of [320, 375, 390, 414]) {
  test(`chart cards grow around their contents at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    await page.getByRole("tab", { name: "Line", exact: true }).click();
    const trials = page
      .locator(".demo-grid .chart-card")
      .filter({ hasText: "Trials & subscriptions" });
    const originalHeight = (await trials.boundingBox())!.height;
    // Exercise wrapped legends and larger text, including mobile text scaling.
    await page.addStyleTag({
      content: '.chart-root [data-kind-ui="chart-legend-button"] { font-size: 28px; }',
    });
    await expect
      .poll(async () => (await trials.boundingBox())!.height)
      .toBeGreaterThan(originalHeight);
    for (const family of [
      "Bar",
      "Line",
      "Area",
      "Combo",
      "Pie",
      "Radar",
      "Activity",
      "Scatter",
      "Heatmap",
      "Waterfall",
      "Sankey",
      "Histogram",
      "Box Plot",
    ]) {
      await page.getByRole("tab", { name: family, exact: true }).click();
      await expect
        .poll(
          () =>
            page.locator(".demo-grid .chart-card").evaluateAll((cards) =>
              cards
                .filter((card) => {
                  const bounds = card.getBoundingClientRect();
                  return [
                    ...card.querySelectorAll('svg.recharts-surface, [data-kind-ui="chart-legend"]'),
                  ].some((child) => {
                    const rect = child.getBoundingClientRect();
                    return (
                      rect.bottom > bounds.bottom - 8 ||
                      rect.left < bounds.left ||
                      rect.right > bounds.right
                    );
                  });
                })
                .map((card) => card.querySelector("h3")?.textContent),
            ),
          { message: `${family} plots and legends must fit their outer cards` },
        )
        .toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    await page.getByRole("tab", { name: "Line", exact: true }).click();
    await page.getByRole("button", { name: "Expand Trials & subscriptions", exact: true }).click();
    const card = page.locator(".playground-preview .chart-card");
    const main = page.locator(".playground-main");
    const sidebar = page.locator(".playground-sidebar");
    const cardBounds = (await card.boundingBox())!;
    const mainBounds = (await main.boundingBox())!;
    expect(cardBounds.y + cardBounds.height).toBeLessThanOrEqual(mainBounds.y + mainBounds.height);
    expect((await sidebar.boundingBox())!.y).toBeGreaterThanOrEqual(
      cardBounds.y + cardBounds.height,
    );
    const legendBounds = (await card.locator('[data-kind-ui="chart-legend"]').boundingBox())!;
    expect(legendBounds.y + legendBounds.height).toBeLessThanOrEqual(
      cardBounds.y + cardBounds.height,
    );
    await page.getByRole("tab", { name: "Code", exact: true }).click();
    expect((await page.locator(".playground-source").boundingBox())!.height).toBeLessThanOrEqual(
      360,
    );
  });
}
