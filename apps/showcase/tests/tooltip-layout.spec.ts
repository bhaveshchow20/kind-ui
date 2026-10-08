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
        await target.scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
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
                const overflow = [];
                if (bounds.width <= 0 || bounds.left < 0 || bounds.right > window.innerWidth)
                  overflow.push({
                    kind: "tooltip",
                    left: bounds.left,
                    right: bounds.right,
                    viewport: window.innerWidth,
                  });
                for (const number of root.querySelectorAll('[data-kind-ui="tooltip-number"]')) {
                  const box = number.getBoundingClientRect();
                  const visual = number.querySelector('[data-kind-ui="tooltip-number-visual"]');
                  if (box.left < bounds.left - 0.5 || box.right > bounds.right + 0.5 || !visual)
                    overflow.push({ kind: "number", left: box.left, right: box.right });
                  for (const part of visual?.children ?? []) {
                    const rect = part.getBoundingClientRect();
                    if (rect.left < box.left - 0.5 || rect.right > box.right + 0.5)
                      overflow.push({
                        kind: "digit",
                        left: rect.left - box.left,
                        right: box.right - rect.right,
                      });
                  }
                }
                return overflow;
              }),
            { message: `${family} visible digits fit their clipping boxes` },
          )
          .toEqual([]);
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
