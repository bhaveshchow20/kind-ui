import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4191 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
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
  await expect(page.locator(marks).first()).toHaveAttribute("stroke-width", "4");
  await expect(page.locator(marks).first()).toHaveAttribute("stroke-dasharray", "4 2");
  await expect(page.locator(marks).first()).toHaveAttribute("clip-path", "none");
  await expect(page.locator(marks).first()).toHaveAttribute("mask", "none");
  await expect(page.locator(marks).first()).toHaveAttribute("visibility", "visible");
  expect(
    await page
      .locator(part("box"))
      .first()
      .evaluate((node) => getComputedStyle(node).fillOpacity),
  ).toBe("0");
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
    // ResizeObserver and the native axis registry settle asynchronously. Compare
    // against separately rendered native ReferenceLines, never the Kind mark's scale.
    await expect(async () => {
      const result = await measure(horizontal);
      const oracle = await page
        .locator("[data-native-value]")
        .evaluateAll(
          (nodes, horizontal) =>
            Object.fromEntries(
              nodes.map((node) => [
                node.getAttribute("data-native-value"),
                Number(node.getAttribute(horizontal ? "x1" : "y1")),
              ]),
            ),
          horizontal,
        );
      const first = result[0];
      if (!first) throw new Error("Missing mark");
      expect(first.low).toBeCloseTo(oracle[-12], 5);
      expect(first.high).toBeCloseTo(oracle[7], 5);
      expect(first.median).toBeCloseTo(oracle[-3], 5);
      expect(first.q1).toBeCloseTo(Math.min(oracle[-8], oracle[2]), 5);
      expect(first.size).toBeCloseTo(Math.abs(oracle[2] - oracle[-8]), 5);
      expect(first.outliers[0]).toBeCloseTo(oracle[-20], 5);
      expect(first.outliers[1]).toBeCloseTo(oracle[16], 5);
      expect(result[1]?.size).toBe(0);
      expect(result[1]?.median).toBeCloseTo(oracle[0], 5);
      const positive = result[2];
      if (!positive) throw new Error("Missing positive mark");
      expect(positive.low).toBeCloseTo(oracle[3], 5);
      expect(positive.high).toBeCloseTo(oracle[17], 5);
      expect(positive.median).toBeCloseTo(oracle[8], 5);
      expect(positive.q1).toBeCloseTo(Math.min(oracle[5], oracle[13]), 5);
      expect(positive.size).toBeCloseTo(Math.abs(oracle[13] - oracle[5]), 5);
      expect(positive.outliers).toEqual([oracle[24], oracle[24]]);
      // Native auto domain covers the full extent, including all outliers.
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
    }).toPass({ timeout: 5000 });
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
  const positive = reordered[0],
    negative = reordered[2];
  if (!positive || !negative) throw new Error("Missing reordered groups");
  const slope = (positive.high - positive.low) / 14;
  expect(positive.median).toBeCloseTo(positive.low + (8 - 3) * slope, 5);
  expect(negative.median).toBeCloseTo(positive.low + (-3 - 3) * slope, 5);
  expect(positive.center).toBeLessThan(negative.center);
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await expect(page.locator('[data-custom="yes"]')).toHaveCount(3);
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(0);
  await expect(page.getByRole("table")).toContainText("-20, 16");
  await page.getByRole("button", { name: "Distribution", exact: true }).click();
  await page.getByRole("button", { name: "Reorder", exact: true }).click();
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  await check(true);
  await page.screenshot({ path: info.outputPath("box-packed-phone.png") });
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await page.getByRole("button", { name: "Domain", exact: true }).click();
  await page.getByRole("button", { name: "All equal", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(2);
  const equal = await measure(true);
  for (const mark of equal) {
    expect(mark.size).toBe(0);
    expect(mark.low).toBe(mark.high);
    expect(Number.isFinite(mark.median)).toBe(true);
  }
  await page.getByRole("button", { name: "All missing", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(4);
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
