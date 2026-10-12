import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";

const packed = `http://127.0.0.1:${4197 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const stage = (chart: Locator, id: string) =>
  chart.locator(`[data-kind-ui="funnel-stage"][data-stage-id="${id}"]`);
async function polygonArea(mark: Locator) {
  return mark.evaluate((node) => {
    const pairs = (node.getAttribute("points") ?? "")
      .trim()
      .split(/\s+/)
      .map((pair) => pair.split(",").map(Number));
    return (
      Math.abs(
        pairs.reduce((sum, point, index) => {
          const next = pairs[(index + 1) % pairs.length];
          return sum + (point[0] ?? 0) * (next?.[1] ?? 0) - (next?.[0] ?? 0) * (point[1] ?? 0);
        }, 0),
      ) / 2
    );
  });
}
for (const horizontal of [false, true]) {
  test(`packed rectangles preserve actual value areas and supplied stage order ${horizontal ? "horizontal" : "vertical"}`, async ({
    page,
  }) => {
    await page.goto(`${packed}${horizontal ? "?horizontal" : ""}`);
    const chart = page.getByRole("region", { name: "Stage snapshot" });
    const marks = chart.locator('[data-kind-ui="funnel-mark"]');
    await expect(marks).toHaveCount(3);
    const areas = await Promise.all(
      ["entry", "review", "growth"].map((id) =>
        polygonArea(stage(chart, id).locator('[data-kind-ui="funnel-mark"]')),
      ),
    );
    expect(areas[0]).toBeGreaterThan(0);
    expect((areas[1] ?? 0) / (areas[0] ?? 1)).toBeCloseTo(0.5, 6);
    expect((areas[2] ?? 0) / (areas[0] ?? 1)).toBeCloseTo(0.75, 6);
    await expect(chart.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(5);
    expect(
      await chart
        .locator('[data-kind-ui="funnel-stage"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-stage-id"))),
    ).toEqual(["entry", "review", "growth", "zero", "unknown"]);
    await expect(stage(chart, "zero")).toHaveAttribute("data-value-state", "zero");
    await expect(stage(chart, "unknown")).toHaveAttribute("data-value-state", "unknown");
    await expect(stage(chart, "zero").locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
    await expect(stage(chart, "unknown").locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
    await expect(chart.getByRole("table")).toContainText("Unknown");
    await expect(chart.getByRole("table")).toContainText("50%");
    await expect(chart.getByRole("table")).toContainText("75%");
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    const resized = await polygonArea(
      stage(chart, "review").locator('[data-kind-ui="funnel-mark"]'),
    );
    const resizedBase = await polygonArea(
      stage(chart, "entry").locator('[data-kind-ui="funnel-mark"]'),
    );
    expect(resized / resizedBase).toBeCloseTo(0.5, 6);
    await page.getByRole("button", { name: "Theme", exact: true }).click();
    expect(
      await polygonArea(stage(chart, "review").locator('[data-kind-ui="funnel-mark"]')),
    ).toBeCloseTo(resized, 6);
    await expect(
      page.getByRole("region", { name: "Explicit parts" }).locator('[data-kind-ui="funnel-stage"]'),
    ).toHaveCount(0);
  });
}
test("taper encodes each boundary width without forced monotonic order or missing zero paint", async ({
  page,
}) => {
  await page.goto(`${packed}?taper`);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const mark = (id: string) => stage(chart, id).locator('[data-kind-ui="funnel-mark"]');
  const width = async (id: string, edge: "upper" | "lower") =>
    Number(await mark(id).getAttribute(`data-${edge}-width`));
  const max = await width("entry", "upper");
  expect(await width("entry", "lower")).toBeCloseTo(max * 0.5, 6);
  expect(await width("review", "upper")).toBeCloseTo(max * 0.5, 6);
  expect(await width("review", "lower")).toBeCloseTo(max * 0.75, 6);
  expect(await width("growth", "upper")).toBeCloseTo(max * 0.75, 6);
});
test("keyboard inspection, original record readouts, refs and consumer veto survive data replacement", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const first = stage(chart, "entry");
  await expect(first).toHaveAttribute("data-consumer-ref", "attached");
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(stage(chart, "review")).toBeFocused();
  await page.keyboard.press("End");
  await expect(stage(chart, "unknown")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "Veto clicks", exact: true }).click();
  const writes = await page.getByLabel("Inspection writes").textContent();
  await first.dispatchEvent("click");
  await expect(page.getByLabel("Consumer clicks")).toHaveText("1");
  await expect(page.getByLabel("Inspection writes")).toHaveText(writes ?? "");
  await page.getByRole("button", { name: "Stale inspection", exact: true }).click();
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  const staleWrites = await page.getByLabel("Inspection writes").textContent();
  await page.getByRole("button", { name: "Replace data", exact: true }).click();
  await expect(stage(chart, "entry")).toHaveCount(0);
  await expect(page.getByLabel("Inspection writes")).toHaveText(staleWrites ?? "");
  await expect(chart).toContainText("3 days");
});
test("loading hides settled readouts and stage interaction; reduced motion settles geometry", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(chart.getByRole("table")).not.toBeVisible();
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  await expect(chart.locator('[data-kind-ui="funnel-stage"][tabindex="0"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(chart.getByRole("table")).toBeVisible();
  await expect(stage(chart, "review")).toBeVisible();
  const before = await polygonArea(stage(chart, "review").locator('[data-kind-ui="funnel-mark"]'));
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await polygonArea(stage(chart, "review").locator('[data-kind-ui="funnel-mark"]')),
  ).toBeCloseTo(before, 6);
});
test("touch inspection and narrow viewport retain accessible alternatives", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await stage(chart, "review").tap();
  await expect(chart.getByRole("tooltip")).toContainText("Review");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).include("main").analyze();
  expect(result.violations).toEqual([]);
  await context.close();
});

test("stage activation uses controlled selection and does not remove other numeric geometry", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const mark = stage(chart, "review");
  await mark.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Stage selection")).toHaveText("review");
  await expect(mark).toHaveAttribute("aria-pressed", "true");
  await expect(chart.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(3);
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Stage selection")).toHaveText("none");
  await stage(chart, "zero").click();
  await expect(page.getByLabel("Stage selection")).toHaveText("zero");
});

test("comparison panels use the explicit common scale and do not normalize to their own maximum", async ({
  page,
}) => {
  await page.goto(packed);
  const primary = page.getByRole("region", { name: "Stage snapshot" });
  const comparison = page.getByRole("region", { name: "Comparison" });
  const baseline = Number(
    await stage(primary, "entry")
      .locator('[data-kind-ui="funnel-mark"]')
      .getAttribute("data-upper-width"),
  );
  const smaller = Number(
    await stage(comparison, "small")
      .locator('[data-kind-ui="funnel-mark"]')
      .getAttribute("data-upper-width"),
  );
  expect(smaller / baseline).toBeCloseTo(0.25, 6);
  await expect(comparison.getByRole("table")).toContainText("25%");
});

test("single, all-zero and empty supplied stages retain truthful numeric alternatives", async ({
  page,
}) => {
  await page.goto(packed);
  const single = page.getByRole("region", { name: "Single stage" });
  const mark = single.locator('[data-kind-ui="funnel-mark"]');
  await expect(mark).toHaveCount(1);
  expect(await mark.getAttribute("data-upper-width")).toEqual(
    await mark.getAttribute("data-lower-width"),
  );
  await expect(single.getByRole("table")).toContainText("7.5");
  await expect(single.getByRole("table")).toContainText("100%");
  const zero = page.getByRole("region", { name: "All zero" });
  await expect(zero.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(2);
  await expect(zero.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
  await expect(zero.getByRole("table")).toContainText("First zero");
  const empty = page.getByRole("region", { name: "Empty stages" });
  await expect(empty.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(0);
  await expect(empty.getByRole("table")).toHaveCount(1);
});

test("React callback-ref cleanup runs when native stage geometry is removed", async ({ page }) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await expect(stage(chart, "entry")).toHaveAttribute("data-consumer-ref", "attached");
  await page.getByRole("button", { name: "Replace data", exact: true }).click();
  await expect(stage(chart, "entry")).toHaveCount(0);
  await page.getByRole("button", { name: "Read ref cleanup", exact: true }).click();
  expect(Number(await page.getByLabel("Ref cleanup count").textContent())).toBeGreaterThan(0);
});

test("strict LazyMotion consumers retain stage rendering and keyboard inspection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${packed}?lazy`);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await expect(chart.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(3);
  await stage(chart, "entry").focus();
  await expect(chart.getByRole("tooltip")).toContainText("Entry");
  expect(errors).toEqual([]);
});
test("unrepresentable positive screen geometry fails visibly instead of painting measured zero", async ({
  page,
}) => {
  await page.goto(`${packed}?extreme`);
  await expect(page.getByRole("alert")).toContainText(/rescal|represent/i);
  await expect(page.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
});
