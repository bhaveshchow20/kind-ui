import { expect, test } from "@playwright/test";
import { expectDimmedPaint } from "./interaction-paint";

test("installed line composition retains native keyboard tooltip, host theme and loading recovery", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const composition = page.getByRole("region", { name: "Installed composition" });
  const svg = composition.getByRole("application", { name: "Monthly visitors" });
  await expect(svg).toBeVisible();
  await expect(composition.locator(".recharts-line-curve")).toHaveCount(1);
  const instructions = composition.locator('[data-kind-ui="chart-instructions"]');
  await expect(instructions).toHaveCSS("position", "absolute");
  await expect(instructions).toHaveCSS("width", "1px");
  await svg.focus();
  await page.keyboard.press("ArrowRight");
  const tooltip = composition.locator('[data-kind-ui="chart-tooltip"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Visitors");
  await expect(tooltip).toHaveCSS("padding-left", "8px");
  const visitors = composition.getByRole("button", { name: "Visitors", exact: true });
  await visitors.click();
  await expect(visitors).toHaveAttribute("aria-pressed", "true");
  await expect(composition.locator('[data-kind-ui="chart-interaction-status"]')).toHaveText(
    "Highlighted Visitors.",
  );
  await expect(composition.locator(".recharts-line-curve")).toHaveCount(1);
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  const frame = composition.locator('[data-kind-ui="chart"]').first();
  await expect(frame).toHaveCSS("color", "rgb(254, 220, 186)");
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(composition.locator('[data-kind-ui="chart-loading-skeleton"]')).toBeVisible();
  await expect(composition.locator('[data-kind-ui="chart-loading-status"]')).toHaveText(
    "Loading chart",
  );
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(composition.locator('[data-kind-ui="chart-loading-skeleton"]')).toHaveCount(0);
  await expect(svg).toBeVisible();
  await expect(composition.locator(".recharts-line-curve")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("installed combo legend and activity rings retain explicit values on a narrow viewport", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/");
  const composition = page.getByRole("region", { name: "Installed composition" });
  await page.getByRole("combobox", { name: "Chart", exact: true }).selectOption("combo-chart");
  await expect(
    composition.getByRole("application", {
      name: "Monthly production, capacity and target in units",
    }),
  ).toBeVisible();
  const capacity = composition.getByRole("button", { name: "Capacity · units", exact: true });
  await capacity.focus();
  await page.keyboard.press("Escape");
  await expect(capacity).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(capacity).toHaveAttribute("aria-pressed", "true");
  await expectDimmedPaint(composition.locator(".recharts-bar-rectangle path"));
  await page.keyboard.press("Enter");
  await expect(capacity).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("combobox", { name: "Chart", exact: true }).selectOption("activity-rings");
  await expect(composition.getByRole("application", { name: "Daily activity" })).toBeVisible();
  await expect(composition.locator(".recharts-radial-bar-sector")).toHaveCount(3);
  await expect(composition.locator('[data-kind-ui="chart-instructions"]')).toContainText(
    "Move350 kcalExercise30 minStand9 hours",
  );
  const exercise = composition.locator(".recharts-radial-bar-sector").nth(1);
  const paintedPoint = await exercise.evaluate((node) => {
    if (!(node instanceof SVGPathElement)) throw new Error("Expected a native ring path");
    const bounds = node.getBBox();
    const matrix = node.getScreenCTM();
    if (!matrix) throw new Error("Missing ring coordinate transform");
    for (let row = 1; row < 20; row++) {
      for (let column = 1; column < 20; column++) {
        const point = new DOMPoint(
          bounds.x + (bounds.width * column) / 20,
          bounds.y + (bounds.height * row) / 20,
        );
        if (node.isPointInFill(point)) {
          const screen = point.matrixTransform(matrix);
          return { x: screen.x, y: screen.y };
        }
      }
    }
    throw new Error("Missing painted activity ring area");
  });
  await page.mouse.move(paintedPoint.x, paintedPoint.y);
  await expect(
    composition.locator('[data-kind-ui="chart-tooltip-item"][data-series="exercise"]'),
  ).toContainText("30 min");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(errors).toEqual([]);
});
