import { expect, test } from "@playwright/test";

const url = "http://127.0.0.1:4185";
const marks = '[data-kind-ui="box-plot-mark"]';
const part = (name: string) => `[data-box-part="${name}"]`;

test("packed box plots: exact native geometry, domains, composition, null and controlled visibility", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const chart = page.getByRole("application", { name: "Box distribution" });
  await expect(chart).toHaveAttribute("data-host-ref", "yes");
  await expect(page.locator(marks)).toHaveCount(3);
  await expect(page.locator(`${marks}[data-mark-ref="yes"]`)).toHaveCount(3);
  const measure = async (horizontal = false) =>
    page.locator(marks).evaluateAll(
      (nodes, horizontal) =>
        nodes.map((node) => {
          const number = (name: string, attr: string) =>
            Number(node.querySelector(`[data-box-part="${name}"]`)?.getAttribute(attr));
          return {
            low: number("lower-cap", horizontal ? "x1" : "y1"),
            high: number("upper-cap", horizontal ? "x1" : "y1"),
            median: number("median", horizontal ? "x1" : "y1"),
            q1: number("box", horizontal ? "x" : "y"),
            size: number("box", horizontal ? "width" : "height"),
            center: number("median", horizontal ? "y1" : "x1"),
            outliers: Array.from(node.querySelectorAll("circle"), (circle) =>
              Number(circle.getAttribute(horizontal ? "cx" : "cy")),
            ),
          };
        }),
      horizontal,
    );
  const check = async (horizontal = false) => {
    const result = await measure(horizontal);
    const first = result[0];
    if (!first) throw new Error("Missing mark");
    const slope = (first.high - first.low) / 19; // whiskers -12 to 7
    const coordinate = (value: number) => first.low + (value + 12) * slope;
    expect(first.median).toBeCloseTo(coordinate(-3), 5);
    expect(first.q1).toBeCloseTo(Math.min(coordinate(-8), coordinate(2)), 5);
    expect(first.size).toBeCloseTo(Math.abs(10 * slope), 5);
    expect(first.outliers[0]).toBeCloseTo(coordinate(-20), 5);
    expect(first.outliers[1]).toBeCloseTo(coordinate(16), 5);
    expect(result[1]?.size).toBe(0);
    // Native auto domain covers the entire -20..24 extent, including all outliers.
    const plot = await page.locator(".recharts-cartesian-grid").boundingBox();
    const svg = await chart.boundingBox();
    expect(plot && svg).toBeTruthy();
    if (plot && svg) {
      const start = horizontal ? plot.x - svg.x : plot.y - svg.y;
      const end = start + (horizontal ? plot.width : plot.height);
      for (const mark of result)
        for (const value of [mark.low, mark.high, ...mark.outliers]) {
          expect(value).toBeGreaterThanOrEqual(start - 1);
          expect(value).toBeLessThanOrEqual(end + 1);
        }
    }
  };
  await check();
  await expect(page.locator(part("collapsed-box"))).toHaveCount(1);
  await expect(page.locator(part("outlier"))).toHaveCount(4);
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("Zero");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("0 units");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("24, 24 units");
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).not.toBeVisible();
  await page
    .locator(part("box"))
    .first()
    .click({ position: { x: 4, y: 4 } });
  await expect(page.getByLabel("Events")).not.toHaveText("0");
  await page.getByRole("button", { name: "Orientation", exact: true }).click();
  await check(true);
  await page.getByRole("button", { name: "Reverse", exact: true }).click();
  await check(true);
  await page.getByRole("button", { name: "Domain", exact: true }).click();
  await check(true);
  await page.getByRole("button", { name: "Reorder", exact: true }).click();
  const reordered = await measure(true);
  expect(reordered[0]?.outliers).toHaveLength(2);
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await expect(page.locator('[data-custom="yes"]')).toHaveCount(3);
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(0);
  await expect(page.getByRole("table")).toContainText("-20, 16");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  await check(true);
  await page.screenshot({ path: info.outputPath("box-packed-phone.png") });
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Box Motion respects reduced preference and ends on interaction and data/layout changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${url}/?animate`);
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(1);
  await page.getByRole("application", { name: "Box distribution" }).focus();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Reorder", exact: true }).click();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Orientation", exact: true }).click();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
});

test("responsive box plot recipes have complete summaries and real desktop/phone screenshots", async ({
  page,
}, info) => {
  await page.goto("/box-plots.html");
  await expect(page.getByRole("heading", { name: "Spread tells the story." })).toBeVisible();
  await expect(page.locator(marks)).toHaveCount(8);
  await expect(page.getByRole("table")).toHaveCount(3);
  await expect(page.getByRole("table").last()).toContainText("Missing");
  await page.screenshot({ path: info.outputPath("box-recipes-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(marks)).toHaveCount(8);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.screenshot({ path: info.outputPath("box-recipes-phone.png"), fullPage: true });
});
