import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

for (const scheme of ["dark", "light"] as const) {
  test(`a fresh phone follows its ${scheme} appearance setting`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("./");
    await expect(page.locator("html")).toHaveClass(new RegExp(scheme));
    await page.emulateMedia({ colorScheme: scheme === "dark" ? "light" : "dark" });
    await expect(page.locator("html")).toHaveClass(
      new RegExp(scheme === "dark" ? "light" : "dark"),
    );
  });
}

test("phone appearance can return to System after a saved manual choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(page.getByRole("menuitemradio", { name: "Light", exact: true })).toBeChecked();
  await page.getByRole("menuitemradio", { name: "System", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("system");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await expect(page.getByRole("menuitemradio", { name: "System", exact: true })).toBeChecked();
});
