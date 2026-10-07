import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`activity rings retain their configured colors in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.goto("./");
    await page.getByRole("tab", { name: "Activity", exact: true }).click();
    const expected = ["rgb(41, 203, 224)", "rgb(164, 233, 54)", "rgb(250, 49, 92)"];
    const colors = (selector: string) =>
      page
        .locator(`${selector} .recharts-radial-bar-sector`)
        .evaluateAll((paths) => paths.map((path) => getComputedStyle(path).fill));
    await expect.poll(() => colors(".demo-grid .activity-card")).toEqual(expected);
    await page.getByRole("button", { name: "Expand Daily activity", exact: true }).click();
    await expect.poll(() => colors(".playground-preview .activity-card")).toEqual(expected);
    await page.getByRole("slider").first().press("End");
    await expect.poll(() => colors(".playground-preview .activity-card")).toEqual(expected);
  });
}
