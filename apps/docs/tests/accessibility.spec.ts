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
}
