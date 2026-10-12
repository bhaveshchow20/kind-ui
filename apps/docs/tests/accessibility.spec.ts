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
    const northstar = primary.getByRole("button", { name: /^Northstar:/ });
    await expect(northstar).toBeVisible();
    const pending = page.locator('[data-component="treemap-loading"]');
    await expect(pending.locator('[data-kind-ui="treemap"]')).toHaveAttribute("aria-busy", "true");
    await expect(pending.getByRole("status").filter({ hasText: "Loading chart" })).toBeAttached();
    const audit = () =>
      new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    await northstar.focus();
    await expect(primary.getByRole("tooltip")).toContainText("+2.4%");
    await expect(northstar).toHaveAttribute("aria-describedby", /.+/);
    expect.soft((await audit()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(primary.getByRole("tooltip")).toHaveCount(0);
    await primary
      .locator('[data-kind-ui="treemap-group-header"][data-node-id="platforms"]')
      .focus();
    await page.keyboard.press("Enter");
    await expect(primary.locator('[data-kind-ui="treemap-tile"]')).toHaveCount(2);
    const navigation = primary.getByRole("navigation", { name: "Treemap navigation" });
    await expect(
      navigation.getByRole("button", { name: "Platforms", exact: true }),
    ).toHaveAttribute("aria-current", "location");
    await navigation.getByRole("button", { name: "All categories", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(primary.getByRole("button", { name: /^Harbor:/ })).toBeVisible();
    const alternative = page.locator('.treemap-data-alternative[data-example="treemap"]');
    const disclosure = alternative.getByText("View plotted data", { exact: true });
    await disclosure.focus();
    await page.keyboard.press("Enter");
    const table = alternative.getByRole("table", { name: /Illustrative market universe/ });
    await expect(table).toBeVisible();
    await expect(table.getByRole("row").filter({ hasText: "Inactive allocation" })).toContainText(
      "Unavailable",
    );
    expect.soft((await audit()).violations).toEqual([]);
    await primary.getByRole("combobox", { name: "Color metric", exact: true }).click();
    await expect(page.getByRole("option", { name: "Activity", exact: true })).toBeVisible();
    expect.soft((await audit()).violations).toEqual([]);
    await page.getByRole("option", { name: "Activity", exact: true }).click();
    await northstar.focus();
    await expect(primary.getByRole("tooltip")).toContainText("$42m session turnover");
    await primary.getByRole("tab", { name: "Code", exact: true }).click();
    await expect(primary.locator(".line-code-block pre")).toBeVisible();
    expect.soft((await audit()).violations).toEqual([]);
  });
}
