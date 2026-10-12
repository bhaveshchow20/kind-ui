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
    if (scheme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
    else await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const familyPanel = page.getByRole("tabpanel", { name: "Bar", exact: true });
    await expect(familyPanel).toBeVisible();
    await expect(familyPanel).toHaveClass(/demo-grid/);
    await expect(page.getByRole("tab", { name: "Bar", exact: true })).toHaveAttribute(
      "aria-controls",
      (await familyPanel.getAttribute("id")) ?? "",
    );
    // Viewport-triggered card entrances must settle before a full-page contrast audit.
    const cards = await page.locator(".chart-card").all();
    for (const card of cards) {
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveCSS("opacity", "1");
    }
    await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
    for (const card of cards) await expect(card).toHaveCSS("opacity", "1");
    const audit = () =>
      new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect.soft((await audit()).violations).toEqual([]);
    await page.getByRole("button", { name: "Search documentation", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("textbox", { name: "Search components" })).toBeFocused();
    expect.soft((await audit()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Search documentation", exact: true }),
    ).toBeFocused();
    await page.getByRole("tab", { name: "Line", exact: true }).click();
    await expect(page.getByRole("tabpanel", { name: "Line", exact: true })).toBeVisible();
    const trigger = page.locator(".tile-open").first();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    expect.soft((await audit()).violations).toEqual([]);
    await page.getByRole("tab", { name: "Code", exact: true }).click();
    await expect(page.getByRole("region", { name: "Chart example code" })).toBeVisible();
    expect.soft((await audit()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
}
