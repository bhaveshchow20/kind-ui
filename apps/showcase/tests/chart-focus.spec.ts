import { expect, test } from "@playwright/test";

const families = [
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
];

test("chart pointer focus stays quiet; keyboard focus and modal lifecycle remain native", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  for (const family of families) {
    await page.getByRole("tab", { name: family, exact: true }).click();
    for (const modal of [false, true]) {
      if (modal) await page.locator(".tile-open").first().click();
      const host = modal
        ? page.locator(".playground-preview .chart-card").first()
        : page.locator(".demo-grid .chart-card").first();
      const target = host
        .locator(
          '.recharts-surface[tabindex], [role="grid"] [tabindex="0"], g[tabindex="0"], button',
        )
        .first();
      if (await target.count()) {
        await target.click({ force: true });
        await expect(target).toHaveCSS("outline-style", "none");
        if (!modal && (await page.getByRole("dialog").count())) {
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
        }
        await page.keyboard.press("Tab");
        await target.focus();
        await expect(target).toHaveCSS("outline-style", "solid");
      }
      if (modal) {
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(page.locator(".tile-open").first()).toBeFocused();
      }
    }
  }
});
