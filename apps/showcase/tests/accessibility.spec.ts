import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Four full-page audits include the page, search dialog and both preview tabs.
test.setTimeout(60_000);

for (const scheme of ["light", "dark"] as const) {
  test(`homepage and keyboard dialogs satisfy automated accessibility checks in ${scheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("./");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const audit = () =>
      new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect((await audit()).violations).toEqual([]);
    await page.getByRole("button", { name: "Search documentation", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("textbox", { name: "Search components" })).toBeFocused();
    expect((await audit()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Search documentation", exact: true }),
    ).toBeFocused();
    await page.getByRole("tab", { name: "Line", exact: true }).click();
    const trigger = page.locator(".tile-open").first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    expect((await audit()).violations).toEqual([]);
    await page.getByRole("tab", { name: "Code", exact: true }).click();
    await expect(page.getByRole("region", { name: "Chart example code" })).toBeVisible();
    expect((await audit()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
}
