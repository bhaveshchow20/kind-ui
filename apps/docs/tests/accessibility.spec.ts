import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { docRoute } from "../lib/routing.mjs";

for (const scheme of ["light", "dark"] as const) {
  test(`docs preview and keyboard navigation satisfy automated accessibility checks in ${scheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(`.${docRoute("/docs/components/line/")}`);
    if (scheme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
    else await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(
      page.getByRole("heading", { name: "Line Chart", exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.locator(".recharts-line-curve").first()).toBeVisible();
    const audit = () =>
      new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect.soft((await audit()).violations).toEqual([]);
    const search = page.locator(".glass-sidebar-search > button");
    await search.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog").getByRole("combobox")).toBeFocused();
    expect.soft((await audit()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(search).toBeFocused();
  });

  test(`docs selector and code satisfy automated accessibility checks in ${scheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(`.${docRoute("/docs/components/line/")}`);
    if (scheme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
    else await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.locator(".recharts-line-curve").first()).toBeVisible();
    const audit = () =>
      new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const example = page.locator('[data-component="line-smooth"]');
    await example.getByRole("combobox", { name: "Curve", exact: true }).click();
    await expect(page.getByRole("option", { name: "Step after", exact: true })).toBeVisible();
    await expect(page.locator(".skip-link")).toHaveAttribute("inert", "");
    expect.soft((await audit()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.locator(".skip-link")).not.toHaveAttribute("inert", "");
    await expect(example.getByRole("combobox", { name: "Curve", exact: true })).toBeFocused();
    await example.getByRole("tab", { name: "Code", exact: true }).click();
    expect.soft((await audit()).violations).toEqual([]);
  });

  test(`treemap documentation preserves accessible inspection, navigation and data in ${scheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(`.${docRoute("/docs/components/treemap/")}`);
    if (scheme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
    else await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(
      page.getByRole("heading", { name: "Treemap", exact: true, level: 1 }),
    ).toBeVisible();
    const primary = page.locator('[data-component="treemap"]');
    const api = primary.getByRole("button", { name: /^API:/ });
    await expect(api).toBeVisible();
    const pending = page.locator('[data-component="treemap-loading"]');
    await expect(pending.locator('[data-kind-ui="treemap"]')).toHaveAttribute("aria-busy", "true");
    await expect(
      pending.getByRole("status").filter({ hasText: "Loading cloud spend" }),
    ).toBeAttached();
    const audit = () =>
      new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    await page.mouse.move(5, 5);
    expect.soft((await audit()).violations).toEqual([]);
    await api.focus();
    await expect(primary.getByRole("tooltip")).toContainText("$18,400");
    await expect(api).toHaveAttribute("aria-describedby", /.+/);
    await page.keyboard.press("Escape");
    await expect(primary.getByRole("tooltip")).toHaveCount(0);
    await expect(
      primary.locator('[data-kind-ui="treemap-group"], [data-kind-ui="treemap-group-header"]'),
    ).toHaveCount(0);
    await expect(primary.locator('[data-kind-ui="treemap-tile"]')).toHaveCount(10);
    const computeLegend = primary.locator(
      '[data-kind-ui="chart-legend-button"][data-legend-key="compute"]',
    );
    await computeLegend.focus();
    await page.keyboard.press("Enter");
    await expect(computeLegend).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(computeLegend).toHaveAttribute("aria-pressed", "false");
    await page.mouse.move(5, 5);
    await primary.getByRole("button", { name: "Copy prompt", exact: true }).focus();
    const alternative = page.locator('.treemap-data-alternative[data-example="treemap"]');
    await expect(alternative.locator("summary")).toHaveCount(0);
    const table = alternative.getByRole("table", {
      name: /Illustrative September 2026 cloud bill/,
    });
    await expect(table).toBeAttached();
    const apiRow = table.getByRole("row").filter({ hasText: "API" });
    await expect(apiRow).toContainText("18400");
    expect.soft((await audit()).violations).toEqual([]);
    await primary.getByRole("tab", { name: "Code", exact: true }).click();
    await expect(primary.locator(".line-code-block pre")).toBeVisible();
    await page.mouse.move(5, 5);
    expect.soft((await audit()).violations).toEqual([]);
  });
}
