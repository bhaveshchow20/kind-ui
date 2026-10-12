import { expect, type Locator, type Page, test } from "@playwright/test";

async function openExample(page: Page, title: string) {
  await page.getByRole("tab", { name: "Treemap", exact: true }).click();
  await expect(page.locator(".demo-grid .chart-card")).toHaveCount(2);
  await page.getByRole("button", { name: `Expand ${title}`, exact: true }).click();
  return page.locator(".playground-preview .chart-card");
}

async function assertContained(card: Locator) {
  await expect(card.locator('[data-kind-ui="treemap-tile"]').first()).toBeVisible();
  expect(await card.locator('[data-kind-ui="treemap-tile"]').count()).toBeGreaterThan(0);
  expect(await card.locator('[data-kind-ui="treemap-label"]').count()).toBeGreaterThan(0);
  const overflows = await card.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return [
      ...element.querySelectorAll(
        '[data-kind-ui="treemap"], [data-kind-ui="treemap-color-legend"], [data-kind-ui="treemap-tooltip"]',
      ),
    ].filter((part) => {
      const rect = part.getBoundingClientRect();
      return (
        rect.left < bounds.left - 1 ||
        rect.right > bounds.right + 1 ||
        rect.bottom > bounds.bottom + 1
      );
    }).length;
  });
  expect(overflows).toBe(0);
  const unclipped = await card
    .locator('[data-kind-ui="treemap-label"]')
    .evaluateAll((labels) =>
      labels.every((label) => getComputedStyle(label).overflow === "hidden"),
    );
  expect(unclipped).toBe(true);
}

for (const scheme of ["light", "dark"] as const) {
  for (const width of [320, 375, 1280]) {
    test(`treemap gallery keeps both examples readable at ${width}px in ${scheme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: scheme });
      await page.goto("./");
      await expect(page.locator("html")).toHaveClass(new RegExp(scheme));
      await page.getByRole("tab", { name: "Treemap", exact: true }).click();
      const cards = page.locator(".demo-grid .chart-card");
      await expect(cards).toHaveCount(2);
      await expect(cards.nth(0)).toContainText("Sector concentration");
      await expect(cards.nth(1)).toContainText("Gross position exposure");
      for (const card of [cards.nth(0), cards.nth(1)]) {
        await assertContained(card);
        const tile = card.locator('[data-kind-ui="treemap-tile"]').first();
        await tile.focus();
        await expect(card.getByRole("tooltip")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(card.getByRole("tooltip")).toHaveCount(0);
        await tile.press("Home");
        await tile.press("End");
        await expect(
          card.locator(
            '[data-kind-ui="treemap-tile"]:focus, [data-kind-ui="treemap-group-header"]:focus',
          ),
        ).toHaveCount(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
}

test("sector navigation and data selection retain the independent signed metric", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const card = await openExample(page, "Sector concentration");
  await card.locator('[data-kind-ui="treemap-group-header"][data-node-id="technology"]').click();
  await expect(card.locator('[data-kind-ui="treemap-tile"]')).toHaveCount(3);
  await expect(
    card
      .getByRole("navigation", { name: "Treemap navigation" })
      .getByRole("button", { name: "Technology", exact: true }),
  ).toHaveAttribute("aria-current", "location");
  await card.getByRole("button", { name: "View data", exact: true }).click();
  const table = card.locator('[data-kind-ui="treemap-data-table"]');
  await expect(table).toBeVisible();
  const missing = table.locator('tbody tr[data-node-id="current"]');
  await expect(missing).toContainText("Unknown");
  // Outside-view nodes retain root/parent shares while the view-share cell is empty.
  await expect(missing.locator("td").nth(4)).toHaveText("—");
  const orbit = table.locator('tr[data-node-id="orbit"]').getByRole("button");
  await orbit.click();
  await expect(card.locator('[data-kind-ui="treemap-tile"][data-node-id="orbit"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Selection and keyboard inspection are separate; Safari pointer clicks do not retain focus.
  await orbit.focus();
  await expect(card.getByRole("tooltip")).toContainText("−1.2%");
  await card
    .getByRole("navigation", { name: "Treemap navigation" })
    .getByRole("button", { name: "All sectors", exact: true })
    .click();
  await expect(card.locator('[data-kind-ui="treemap-tile"]')).toHaveCount(9);
  await card.getByRole("button", { name: "Hide data", exact: true }).click();
  await expect(table).toHaveCount(0);
});

test("position tooltip preserves signed short metadata without changing gross area", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const card = await openExample(page, "Gross position exposure");
  await expect(card).toContainText("$60k net");
  await expect(card).toContainText("Share of gross positions, not NAV");
  const short = card.locator('[data-kind-ui="treemap-tile"][data-node-id="orbit-short"]');
  await short.click();
  await expect(short).toHaveAttribute("aria-pressed", "true");
  const tooltip = card.getByRole("tooltip");
  await expect(tooltip).toContainText("$70k");
  await expect(tooltip).toContainText("Signed position: −$70,000");
  await expect(tooltip).toContainText("+$1,120");
  await expect(tooltip).toContainText("21.9% of supplied gross positions");
  await card.getByRole("button", { name: "View data", exact: true }).click();
  await expect(card.locator('tr[data-node-id="summit-short"]')).toContainText("Unknown");
});

test("treemap controls and clipboard code retain release boundaries and caller data", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem("treemap-code", text);
        },
      },
    });
  });
  await page.goto("./");
  const card = await openExample(page, "Gross position exposure");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("switch", { name: "Labels", exact: true }).uncheck();
  await expect(card.locator('[data-kind-ui="treemap-label"]')).toHaveCount(0);
  await dialog.getByRole("switch", { name: "Legend", exact: true }).uncheck();
  await expect(card.locator('[data-kind-ui="treemap-color-legend"]')).toHaveCount(0);
  await dialog.getByRole("slider", { name: "Tile spacing", exact: true }).press("End");
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  const code = dialog.getByRole("region", { name: "Chart example code" });
  await expect(code).toContainText("TreemapChart<Row>");
  await expect(code).toContainText("0.5.0 does not include it");
  await expect(code).toContainText("signedPosition");
  await expect(code).toContainText("Missing supplied area for");
  await expect(code).not.toContainText("<TreemapChart.Labels");
  await expect(code).not.toContainText("<TreemapChart.ColorLegend");
  await expect(code).not.toContainText("npx shadcn");
  await dialog.getByRole("button", { name: "Copy code", exact: true }).click();
  const copied = await page.evaluate(() => sessionStorage.getItem("treemap-code"));
  expect(copied).toContain("signedPosition");
  expect(copied).toContain("0.5.0 does not include it");
  await expect(dialog.getByRole("link", { name: "Go to Documentation" })).toHaveAttribute(
    "href",
    "https://kindui.dev/charts/docs/components/treemap/",
  );
});
