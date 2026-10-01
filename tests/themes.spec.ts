import { expect, test } from "@playwright/test";

test("material examples apply library surfaces and retain independent chart state", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/themes.html");
  const glass = page.getByRole("region", { name: "A clearer perspective." });
  const clay = page.getByRole("region", { name: "A softer point of view." });
  await expect(glass.locator(".material-card")).toHaveCSS("backdrop-filter", "blur(24px)");
  await expect(clay.locator(".material-card")).toHaveCSS("background-color", "rgb(242, 245, 251)");
  await expect(clay.locator(".material-card")).toHaveCSS("box-shadow", /inset/);
  await expect(glass.locator(".recharts-cartesian-axis-tick-value").first()).toHaveCSS(
    "fill",
    "rgb(210, 219, 234)",
  );
  const glassToggle = glass.getByRole("button", { name: "This week" });
  await glassToggle.focus();
  await page.keyboard.press("Space");
  await expect(glassToggle).toHaveAttribute("aria-pressed", "false");
  await expect(glassToggle).toBeFocused();
  await expect(clay.getByRole("button", { name: "This week" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await glass.getByRole("button", { name: "Last week" }).click();
  await expect(glass.getByRole("status")).toHaveText("Select a series to show it.");
  await expect(clay.getByRole("application")).toBeVisible();
  await glass.getByText("View data", { exact: true }).click();
  await expect(glass.getByRole("table")).toBeVisible();
  await expect(glass.getByRole("row", { name: "Thu 0 tasks 20 tasks" })).toBeVisible();
  await expect(glass.getByRole("row", { name: "Wed No data 24 tasks" })).toBeVisible();
  await expect(glass.getByRole("columnheader", { name: "This week Hidden" })).toBeVisible();
  await glass.getByLabel("Empty data").check();
  await expect(glass.getByRole("status")).toHaveText("No data yet.");
  await glass.getByLabel("Empty data").uncheck();
  await expect(glassToggle).toHaveAttribute("aria-pressed", "false");
  await glassToggle.click();
  await expect(glass.getByRole("application")).toBeVisible();
  expect(errors).toEqual([]);
});

test("both materials retain keyboard tooltips, missing values, and zero", async ({ page }) => {
  await page.goto("/themes.html");
  for (const name of ["A clearer perspective.", "A softer point of view."]) {
    const section = page.getByRole("region", { name });
    const chart = section.getByRole("application");
    await chart.focus();
    await page.keyboard.press("ArrowLeft");
    const tooltip = section.getByRole("status");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Mon");
    await expect(tooltip).toContainText("18 tasks");
    await expect(tooltip).toHaveCSS("border-radius", "16px");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(tooltip).toContainText("Wed");
    await expect(tooltip).toContainText("No data");
    await page.keyboard.press("ArrowRight");
    await expect(tooltip).toContainText("Thu");
    await expect(tooltip).toContainText("0 tasks");
    await page.keyboard.press("Escape");
    await expect(tooltip).not.toBeVisible();
  }
});

test("material charts fit desktop and mobile without horizontal overflow", async ({
  page,
}, info) => {
  for (const width of [1360, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/themes.html");
    await expect(page.getByRole("application")).toHaveCount(2);
    for (const chart of await page.getByRole("application").all()) {
      const bounds = await chart.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.width).toBeGreaterThan(200);
      expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({ path: info.outputPath(`materials-${width}.png`), fullPage: true });
  }
});
