import { expect, test } from "./browser";
import { expectDimmedPaint } from "./interaction-paint";

const variants = [
  ["Smooth", "Monthly visitors"],
  ["Linear", "Monthly visitors, linear"],
  ["Step", "Monthly visitors, step"],
  ["Gradient", "Monthly visitors, gradient"],
  ["Threshold", "Monthly visitors with threshold"],
  ["Stacked", "Visitors by device"],
  ["Percent stacked", "Share by device"],
  ["Interactive", "Visitors by device, interactive"],
] as const;

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
    if (mode === "static") {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.clock.runFor(32);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
      await page.screenshot({ path: info.outputPath("areas-mobile.png"), fullPage: true });
      await page.setViewportSize({ width: 1000, height: 900 });
      await page.clock.runFor(32);
    }
    if (mode === "motion") {
      await page.clock.runFor(1200);
      await expect(reveals).toHaveCount(0);
    }
    for (const [index, [name]] of variants.entries()) {
      const chart = page.getByRole("region", { name, exact: true }).getByRole("application");
      await chart.focus();
      await page.clock.runFor(32);
      const tooltip = page.getByRole("status").filter({ hasText: "Jan" }).last();
      await expect(tooltip).toBeVisible();
      if (index === 6) {
        await expect(tooltip).toContainText("70%");
        await expect(tooltip).toContainText("30%");
      }
      await page.keyboard.press("ArrowRight");
      await page.clock.runFor(32);
      await expect(page.getByRole("status").filter({ hasText: "Feb" }).first()).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await page.clock.runFor(32);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    for (const [name] of variants) {
      const chart = page.getByRole("region", { name, exact: true }).getByRole("application");
      await chart.scrollIntoViewIfNeeded();
      await chart.focus();
      await page.keyboard.press("ArrowRight");
      const tooltip = page.getByRole("status").last();
      await expect(tooltip).toBeVisible();
      // Content width is measured asynchronously after resize; assert settled bounds.
      await expect
        .poll(async () => {
          const chartBox = await chart.boundingBox();
          const tooltipBox = await tooltip.boundingBox();
          return Boolean(
            chartBox &&
              tooltipBox &&
              tooltipBox.x >= chartBox.x &&
              tooltipBox.y >= chartBox.y &&
              tooltipBox.x + tooltipBox.width <= chartBox.x + chartBox.width + 1 &&
              tooltipBox.y + tooltipBox.height <= chartBox.y + chartBox.height + 1,
          );
        })
        .toBe(true);
      await page.keyboard.press("Escape");
    }
    await page.getByLabel("Empty data").check();
    await expect(charts).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("area defaults stay complete and missing gaps, zero, percentages, and controlled series stay truthful", async ({
  page,
}, info) => {
  await page.goto("/areas.html");
  await page.screenshot({ path: info.outputPath("areas-monochrome.png"), fullPage: true });
  const smooth = page.getByRole("region", { name: "Smooth", exact: true });
  await smooth.getByText("View data", { exact: true }).click();
  await expect(smooth.getByRole("row", { name: "Apr 198 visits" })).toBeVisible();
  await smooth.getByText("View data", { exact: true }).click();
  await page.getByLabel("Missing April data").check();
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
  const percentLegend = percent.getByRole("list", { name: "Chart legend" });
  await expect(percentLegend).toContainText("Desktop");
  await expect(percentLegend).toContainText("Mobile");
  await expect(percent.locator("svg")).toContainText("100%");
  await percent.getByRole("application").focus();
  const percentTooltip = percent.getByRole("status");
  await expect(percentTooltip).toContainText("70%");
  await expect(percentTooltip).toContainText("30%");
  await expect(percentTooltip).toContainText("Desktop");
  await expect(percentTooltip).toContainText("Mobile");
  await page.getByLabel("All-zero stack").check();
  await percent.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  const zeroTooltip = percent.getByRole("status");
  await expect(zeroTooltip).toContainText("No share");
  await expect(zeroTooltip).not.toContainText("%");
  await percent.getByText("View data", { exact: true }).click();
  await expect(percent.getByRole("row", { name: "Jan 0 visits 0 visits" })).toBeVisible();
  await page.getByLabel("All-zero stack").uncheck();

  const threshold = page.getByRole("region", { name: "Threshold", exact: true });
  const goalLine = threshold.locator(".recharts-reference-line-line");
  const goalY = Number(await goalLine.getAttribute("y1"));
  expect(goalY).toBeGreaterThan(20);
  await expect(threshold.locator("svg")).toContainText("336");

  const interactive = page.getByRole("region", { name: "Interactive", exact: true });
  await expect(interactive.getByRole("list", { name: "Chart legend" })).toBeVisible();
  const stacked = page.getByRole("region", { name: "Stacked", exact: true });
  const stackedLegend = stacked.getByRole("list", { name: "Chart legend" });
  await expect(stackedLegend).toContainText("Desktop");
  await expect(stackedLegend).toContainText("Mobile");
  const areas = interactive.locator(".recharts-area-area");
  await expect(areas).toHaveCount(2);
  const mobile = interactive.getByRole("button", { name: "Mobile", exact: true });
  await mobile.click();
  await expect(mobile).toHaveAttribute("aria-pressed", "true");
  await expect(areas).toHaveCount(2);
  await expectDimmedPaint(
    interactive.locator(
      '[data-kind-ui="series-interaction"][data-series="desktop"] .recharts-area-area',
    ),
  );
  await interactive.getByRole("application").focus();
  await expect(page.getByRole("status")).toContainText("Mobile");
  await interactive.getByText("View data", { exact: true }).click();
  await expect(interactive.getByRole("row", { name: "Feb 305 visits" })).toBeVisible();
  await page.getByLabel("Empty data").check();
  await expect(interactive.getByRole("cell", { name: "No data yet." })).toBeVisible();
});
