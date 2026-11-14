import { expect, test } from "@playwright/test";

test("area playground controls update its preview and copied code", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("tab", { name: "Area", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Area", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator(".demo-grid .chart-card")).toHaveCount(2);
  await expect(page.locator(".tile-preview")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /Featured|All charts/ })).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Expand Recurring revenue", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("tab", { name: "Preview", exact: true })).toBeFocused();
  await expect(dialog.getByRole("switch", { name: "Motion", exact: true })).toHaveCount(0);
  await expect(dialog.getByText("Palette", { exact: true })).toHaveCount(0);
  await dialog.getByRole("radio", { name: "Stepped", exact: true }).check();
  await dialog.getByRole("slider", { name: "Fill", exact: true }).press("End");
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  const code = dialog.getByRole("region", { name: "Chart example code" });
  await expect(code).toContainText('type="stepAfter"');
  await expect(code).toContainText("fillOpacity={0.8}");
  await expect(code).toContainText("const animate = true");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("gallery charts expose hover tooltips without expansion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const card = page.locator(".demo-grid .chart-card").first();
  const plot = card.locator(".recharts-surface").first();
  await plot.hover({ position: { x: 180, y: 120 } });
  await expect(card.locator('[data-kind-ui="chart-tooltip"]')).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("all families have two or three working examples and relevant controls", async ({ page }) => {
  await page.goto("./");
  for (const name of [
    "Area",
    "Bar",
    "Line",
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
    await page.getByRole("tab", { name, exact: true }).click();
    const cards = page.locator(".demo-grid .chart-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    expect(await cards.count()).toBeLessThanOrEqual(3);
    await page.locator(".tile-open").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator(".demo-controls > *")).toHaveCount(4);
    await expect(
      dialog.locator("svg.recharts-surface, [data-kind-ui=heatmap-grid]").first(),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  }
});

test("bar arrangement and activity data changes appear in the code", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("tab", { name: "Bar", exact: true }).click();
  await page.getByRole("button", { name: "Expand New & returning customers", exact: true }).click();
  await page.getByRole("radio", { name: "Stacked", exact: true }).check();
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("region", { name: "Chart example code" })).toContainText(
    'stackId="customers"',
  );
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Activity", exact: true }).click();
  await page.getByRole("button", { name: "Expand Daily activity", exact: true }).click();
  await page.getByRole("slider").first().press("End");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("region", { name: "Chart example code" })).toContainText(
    "value: 650",
  );
});

for (const width of [320, 375, 768, 1280]) {
  test(`playground and code are contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    await page.getByRole("tab", { name: "Area", exact: true }).click();
    await page.getByRole("button", { name: "Expand Recurring revenue", exact: true }).click();
    for (const view of ["Preview", "Code"]) {
      await page.getByRole("tab", { name: view, exact: true }).click();
      const bounds = await page.getByRole("dialog").boundingBox();
      expect(bounds?.x).toBeGreaterThanOrEqual(0);
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
  });
}

test("pie previews stay seamless, and grid and legend controls update the chart", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("tab", { name: "Pie", exact: true }).click();
  await page.locator(".tile-open").first().click();
  await page.getByRole("switch", { name: "Legend", exact: true }).uncheck();
  await expect(page.locator('.playground-preview [data-kind-ui="chart-legend"]')).toHaveCount(0);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("region", { name: "Chart example code" })).not.toContainText(
    "paddingAngle",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Area", exact: true }).click();
  await page.locator(".tile-open").first().click();
  await page.getByRole("switch", { name: "Grid lines", exact: true }).uncheck();
  await expect(
    page.locator(".playground-preview .recharts-cartesian-grid-horizontal line"),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("region", { name: "Chart example code" })).toContainText(
    "horizontal={false}",
  );
});
