import { expect, test } from "@playwright/test";

for (const width of [375, 1280]) {
  for (const expanded of [false, true]) {
    test(`heatmap tooltip stays inside its ${expanded ? "expanded" : "gallery"} card at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("./");
      await page.getByRole("tab", { name: "Heatmap", exact: true }).click();
      for (let example = 0; example < 2; example++) {
        if (expanded) await page.locator(".tile-open").nth(example).click();
        const card = expanded
          ? page.locator(".playground-preview .chart-card")
          : page.locator(".demo-grid .chart-card").nth(example);
        const tooltip = card.getByRole("tooltip");
        const cells = card.locator('[data-kind-ui="heatmap-grid"] td');
        for (const cell of [cells.first(), cells.last()]) {
          await cell.hover();
          await expect(tooltip).toBeVisible();
          await expect
            .poll(
              async () => {
                const cardBounds = await card.boundingBox();
                const bounds = await tooltip.boundingBox();
                if (!cardBounds || !bounds) return false;
                return (
                  bounds.x >= cardBounds.x + 4 &&
                  bounds.y >= cardBounds.y + 4 &&
                  bounds.x + bounds.width <= cardBounds.x + cardBounds.width - 4 &&
                  bounds.y + bounds.height <= cardBounds.y + cardBounds.height - 4
                );
              },
              { message: "hover tooltip fits inside all four card edges" },
            )
            .toBe(true);
          await cell.focus();
          await expect(tooltip).toBeVisible();
          if (!expanded) {
            await cell.press("Escape");
            await expect(tooltip).toBeHidden();
          }
        }
        if (expanded) await page.getByRole("button", { name: "Close", exact: true }).click();
      }
    });
  }
}
