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
        '[data-kind-ui="treemap"], [data-kind-ui="chart-legend"], [data-kind-ui="treemap-tooltip"]',
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
      await expect(cards.nth(0)).toContainText("Monthly cloud spend");
      await expect(cards.nth(1)).toContainText("Portfolio allocation");
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
      // Wait for the retargeted keyboard tooltip layout to settle.
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    });
  }
}

test("cloud spend shares, hierarchy and category selection preserve useful values", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const card = await openExample(page, "Monthly cloud spend");
  await expect(card).toContainText("$76.3k");
  const api = card.locator('[data-kind-ui="treemap-tile"][data-node-id="api"]');
  const before = await api.boundingBox();
  const dataLegend = card.locator('button[data-legend-key="data"]');
  for (let repeat = 0; repeat < 3; repeat++) {
    await dataLegend.click();
    await expect(api).toHaveAttribute("data-inactive", "true");
    expect(await api.boundingBox()).toEqual(before);
    await dataLegend.click();
  }
  await api.focus();
  await expect(card.getByRole("tooltip")).toHaveAttribute("aria-label", "Compute / API");
  await expect(card.getByRole("tooltip")).toContainText("$18.4k");
  await expect(card.getByRole("tooltip")).toContainText("24.1%");
  await expect(
    card.locator('[data-kind-ui="treemap-group-header"], [data-kind-ui="treemap-group"]'),
  ).toHaveCount(0);
  await expect(card.getByRole("tooltip")).toHaveAttribute("aria-label", "Compute / API");
  await expect(card.locator('[data-kind-ui="treemap-tile"]')).toHaveCount(10);
  await expect(card.getByRole("button", { name: "View data" })).toHaveCount(0);
  await expect(card.getByRole("table").locator("tbody tr")).toHaveCount(10);
});

test("portfolio tooltip shows holding value and sector share without changing allocation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const card = await openExample(page, "Portfolio allocation");
  await expect(card).toContainText("$197k");
  const aapl = card.locator('[data-kind-ui="treemap-tile"][data-node-id="aapl"]');
  await aapl.click();
  await expect(aapl).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator('button[data-legend-key="technology"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(card.getByRole("tooltip")).toHaveAttribute("aria-label", "Technology / AAPL");
  await expect(card.getByRole("tooltip")).toContainText("$42k");
  await expect(card.getByRole("tooltip")).toContainText("21.3%");
  await expect(card.getByRole("table").locator("tbody tr")).toHaveCount(9);
});

test("treemap controls and clipboard code retain caller data and source parity", async ({
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
  const card = await openExample(page, "Portfolio allocation");
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("switch", { name: "Labels", exact: true }).uncheck();
  await expect(card.locator('[data-kind-ui="treemap-label"]')).toHaveCount(0);
  await dialog.getByRole("switch", { name: "Legend", exact: true }).uncheck();
  await expect(card.locator('[data-kind-ui="chart-legend"]')).toHaveCount(0);
  await dialog.getByRole("slider", { name: "Tile spacing", exact: true }).press("End");
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  const code = dialog.getByRole("region", { name: "Chart example code" });
  await expect(code).toContainText("readonly TreemapDatum[]");
  await expect(code).not.toContainText("0.5.0 does not include it");
  await expect(code).toContainText("aapl");
  await expect(code).not.toContainText("<TreemapChart.Labels");
  await expect(code).not.toContainText("<TreemapChart.Legend");
  await expect(code).not.toContainText("npx shadcn");
  await dialog.getByRole("button", { name: "Copy code", exact: true }).click();
  const copied = await page.evaluate(() => sessionStorage.getItem("treemap-code"));
  expect(copied).toContain("aapl");
  expect(copied).not.toMatch(/candidate|validated archive|does not include it/);
  await expect(dialog.getByRole("link", { name: "Go to Documentation" })).toHaveAttribute(
    "href",
    "https://kindui.dev/charts/docs/components/treemap/",
  );
});
