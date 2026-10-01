import { expect, test } from "@playwright/test";

const labels = [
  "Monthly visitors",
  "Monthly visitors, linear",
  "Monthly visitors, step",
  "Monthly visitors, gradient",
  "Monthly visitors",
  "Visitors by device",
  "Share by device",
  "Visitors by device",
];

for (const mode of ["static", "motion", "reduced"] as const) {
  test(`all eight area recipes support ${mode}, keyboard, and narrow layout`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    await page.goto("/areas.html");
    if (mode !== "static") await page.getByLabel("Motion", { exact: true }).check();
    const charts = page.getByRole("application");
    await expect(charts).toHaveCount(8);
    const reveals = page.locator("[data-area-reveal='']");
    await expect(reveals).toHaveCount(mode === "motion" ? 8 : 0);
    if (mode === "motion") {
      await page.clock.runFor(1200);
      await expect(reveals).toHaveCount(0);
    }
    for (const label of new Set(labels)) {
      const chart = page.getByRole("application", { name: label }).first();
      await chart.focus();
      await page.clock.runFor(32);
      await expect(page.getByRole("status").filter({ hasText: "Jan" }).first()).toBeVisible();
      await page.keyboard.press("ArrowRight");
      await page.clock.runFor(32);
      await expect(page.getByRole("status").filter({ hasText: "Feb" }).first()).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await page.clock.runFor(32);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    if (mode === "static")
      await page.screenshot({ path: info.outputPath("areas-mobile.png"), fullPage: true });
    await page.getByLabel("Empty data").check();
    await expect(charts).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("area gaps, zero, stacked percentages, and controlled series stay truthful", async ({
  page,
}, info) => {
  await page.goto("/areas.html");
  await page.screenshot({ path: info.outputPath("areas-monochrome.png"), fullPage: true });
  const smooth = page.getByRole("region", { name: "Smooth", exact: true });
  await smooth.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).not.toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toContainText("May");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toContainText("0 visits");
  await smooth.getByText("View data", { exact: true }).click();
  await expect(smooth.getByRole("row", { name: "Jun 0 visits" })).toBeVisible();

  const percent = page.getByRole("region", { name: "Percent stacked", exact: true });
  await expect(percent.locator("svg")).toContainText("100%");
  await percent.getByRole("application").focus();
  await expect(page.getByRole("status")).toContainText("%");

  const interactive = page.getByRole("region", { name: "Interactive", exact: true });
  const areas = interactive.locator(".recharts-area-area");
  await expect(areas).toHaveCount(2);
  const mobile = interactive.getByRole("button", { name: "Mobile", exact: true });
  await mobile.click();
  await expect(mobile).toHaveAttribute("aria-pressed", "false");
  await expect(areas).toHaveCount(1);
  await interactive.getByRole("application").focus();
  await expect(page.getByRole("status")).not.toContainText("Mobile");
  await interactive.getByText("View data", { exact: true }).click();
  await expect(interactive.getByRole("row", { name: "Feb 305 visits" })).toBeVisible();
});
