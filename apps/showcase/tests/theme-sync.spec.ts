import { expect, test } from "@playwright/test";

for (const preference of ["light", "dark", "system"]) {
  test(`uses the saved docs ${preference} preference`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript((theme) => {
      localStorage.setItem("theme", theme);
      localStorage.setItem("kind-ui-theme", theme === "light" ? "dark" : "light");
    }, preference);
    await page.goto("./");
    await expect(
      page.getByRole("radio", {
        name: preference[0].toUpperCase() + preference.slice(1),
        exact: true,
      }),
    ).toBeChecked();
    await expect(page.locator("html")).toHaveClass(preference === "light" ? /light/ : /dark/);
  });
}

test("appearance changes sync between open pages and System follows the OS", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  const other = await context.newPage();
  await other.emulateMedia({ colorScheme: "light" });
  await other.goto("./");
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(other.getByRole("radio", { name: "Dark", exact: true })).toBeChecked();
  await expect(other.locator("html")).toHaveClass(/dark/);
  expect(await other.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  await other.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Light", exact: true })).toBeChecked();
  await page.getByRole("radio", { name: "System", exact: true }).click();
  await expect(other.getByRole("radio", { name: "System", exact: true })).toBeChecked();
  await other.emulateMedia({ colorScheme: "dark" });
  await expect(other.locator("html")).toHaveClass(/dark/);
  expect(await other.evaluate(() => localStorage.getItem("theme"))).toBe("system");
  await other.reload();
  await expect(other.getByRole("radio", { name: "System", exact: true })).toBeChecked();
  await expect(other.locator("html")).toHaveClass(/dark/);
});

test("preserves an existing homepage preference when docs have no saved preference", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("kind-ui-theme", "dark"));
  await page.goto("./");
  await expect(page.getByRole("radio", { name: "Dark", exact: true })).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
});
