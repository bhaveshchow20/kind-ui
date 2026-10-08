import { expect, test } from "@playwright/test";

for (const width of [320, 768, 1280]) {
  test(`gallery tooltip numbers fit across chart families at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("./");
    await page.evaluate(() => document.fonts.ready);
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
      "Histogram",
      "Box Plot",
    ]) {
      await page.getByRole("tab", { name: family, exact: true }).click();
      for (const card of await page.locator(".demo-grid .chart-card").all()) {
        const target =
          family === "Heatmap"
            ? card.locator('[data-kind-ui="heatmap-grid"] td').first()
            : card.getByRole("application").first();
        await target.focus();
        if (family !== "Heatmap") await page.keyboard.press("ArrowRight");
        const tooltip = card.locator(
          '[data-kind-ui="chart-tooltip"], [data-kind-ui="heatmap-tooltip"]',
        );
        await expect(tooltip).toBeVisible();
        await expect
          .poll(
            () =>
              tooltip.evaluate((root) => {
                const bounds = root.getBoundingClientRect();
                return [...root.querySelectorAll('[data-kind-ui="tooltip-number"]')].every(
                  (number) => {
                    const box = number.getBoundingClientRect();
                    const visual = number.querySelector('[data-kind-ui="tooltip-number-visual"]');
                    return (
                      box.left >= bounds.left - 0.5 &&
                      box.right <= bounds.right + 0.5 &&
                      !!visual &&
                      [...visual.children].every((part) => {
                        const rect = part.getBoundingClientRect();
                        return rect.left >= box.left - 0.5 && rect.right <= box.right + 0.5;
                      })
                    );
                  },
                );
              }),
            { message: `${family} visible digits fit their clipping boxes` },
          )
          .toBe(true);
        const box = await tooltip.boundingBox();
        if (!box) throw new Error("Missing visible tooltip bounds");
        expect(box.x, `${family} tooltip left edge`).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width, `${family} tooltip right edge`).toBeLessThanOrEqual(width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  });
}

test("expanded campaign tooltip stays complete after resizing to a phone", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference", colorScheme: "light" });
  await page.goto("./");
  await page.getByRole("button", { name: "Expand Campaign leads", exact: true }).click();
  const card = page.locator(".playground-preview .chart-card");
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const bars = card.locator(".recharts-bar-rectangle");
    await bars.nth(2).hover();
    const number = card.locator('[data-kind-ui="tooltip-number"]');
    await expect(number.locator('[data-kind-ui="tooltip-number-final"]')).toHaveText("61");
    await expect
      .poll(() =>
        number.evaluate((node) => {
          const bounds = node.getBoundingClientRect();
          return [...node.querySelectorAll('[data-kind-ui="tooltip-digit"]')].every((digit) => {
            const box = digit.getBoundingClientRect();
            return box.left >= bounds.left - 0.5 && box.right <= bounds.right + 0.5;
          });
        }),
      )
      .toBe(true);
    await page.screenshot({ path: test.info().outputPath(`campaign-tooltip-${width}.png`) });
  }
});
