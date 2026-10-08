import { expect, test } from "@playwright/test";
import { expectHiddenPaint } from "./interaction-paint";
import { expectLastVisibleGuard } from "./last-visible";

function at<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error(`Missing item ${index}`);
  return value;
}
const packed = `http://127.0.0.1:${4192 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
async function geometry(page: import("@playwright/test").Page) {
  return page.locator('[data-kind-ui="histogram-bin"]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      lower: Number(node.getAttribute("data-lower")),
      upper: Number(node.getAttribute("data-upper")),
      count: Number(node.getAttribute("data-count")),
      x: Number(node.getAttribute("x")),
      width: Number(node.getAttribute("width")),
      height: Number(node.getAttribute("height")),
    })),
  );
}
test("packed histogram uses numeric edges, widths, density areas and zero height", async ({
  page,
}) => {
  await page.goto(packed);
  await expect(page.locator('[data-kind-ui="histogram-bin"]')).toHaveCount(4);
  const bins = await geometry(page);
  expect(bins.map((bin) => bin.count)).toEqual([2, 2, 6, 2]);
  expect(at(bins, 0).width / at(bins, 1).width).toBeCloseTo(2, 3);
  expect(at(bins, 2).width / at(bins, 1).width).toBeCloseTo(3, 3);
  expect(at(bins, 0).height / at(bins, 1).height).toBeCloseTo(0.5, 3);
  expect(at(bins, 2).height / at(bins, 1).height).toBeCloseTo(1, 3);
  await expect(page.getByRole("table")).toContainText("[5, 6)");
  expect(at(bins, 1).x).toBeCloseTo(at(bins, 0).x + at(bins, 0).width, 2);
  expect(at(bins, 3).x - (at(bins, 2).x + at(bins, 2).width)).toBeCloseTo(at(bins, 1).width * 2, 2);
  const area = bins.reduce((sum, bin) => sum + bin.width * bin.height, 0);
  for (const bin of bins) expect((bin.width * bin.height) / area).toBeCloseTo(bin.count / 12, 3);
  await expect(page.locator('svg[data-host-ref="yes"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Measure", exact: true }).click();
  const counts = await geometry(page);
  expect(at(counts, 0).height / at(counts, 1).height).toBeCloseTo(1, 3);
  expect(at(counts, 2).height / at(counts, 1).height).toBeCloseTo(3, 3);
  await page.getByRole("button", { name: "Resize" }).click();
  const resized = await geometry(page);
  expect(at(resized, 2).width / at(resized, 1).width).toBeCloseTo(3, 3);
  expect(at(resized, 2).width).toBeLessThan(at(counts, 2).width);
  await page.getByRole("button", { name: "Update" }).click();
  expect((await geometry(page)).map((bin) => bin.count)).toEqual([4, 4, 12, 4]);
});
test("native shapes, Cells, events, visibility and keyboard/table fallback remain available", async ({
  page,
}) => {
  await page.goto(packed);
  await page.locator('[data-kind-ui="histogram-bin"][data-lower="0"]').click();
  await expect(page.getByRole("status", { name: "Clicked" })).toHaveText("1");
  await expect(page.locator('[data-kind-ui="histogram-bin"][data-lower="0"]')).toHaveAttribute(
    "fill",
    "#be7150",
  );
  await expect(page.locator('[data-kind-ui="histogram-bin"][data-lower="0"]')).toHaveAttribute(
    "fill-opacity",
    "0.3",
  );
  await expect(page.locator('[data-kind-ui="histogram-bin"][data-lower="-2"]')).toHaveAttribute(
    "fill-opacity",
    "0.6",
  );
  await expect(page.locator('[data-kind-ui="histogram-bin"][data-lower="0"]')).toHaveAttribute(
    "stroke-dasharray",
    "2 2",
  );
  const chart = page.getByRole("application", { name: "Histogram proof" });
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("ms");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("Density");
  await page.getByRole("button", { name: "Custom shape" }).click();
  await expect(page.locator('[data-host-shape="yes"]')).toHaveCount(4);
  const widths = await page
    .locator('[data-host-shape="yes"]')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("width"))));
  expect(at(widths, 2) / at(widths, 1)).toBeCloseTo(3, 3);
  await expectLastVisibleGuard(
    page.getByRole("button", { name: "Density", exact: true }),
    page.locator('[data-host-shape="yes"]'),
  );
  await page.getByRole("button", { name: "External visibility", exact: true }).click();
  await expect(page.locator('[data-host-shape="yes"]')).toHaveCount(4);
  await expectHiddenPaint(page.locator('[data-host-shape="yes"]'));
  await expect(page.getByRole("table")).toContainText("0");
});
test("Motion entrance is interrupted by data/resize/focus; reduced motion finishes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(packed);
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Resize" }).click();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.reload();
  await page.getByRole("application", { name: "Histogram proof" }).focus();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  expect(at(await geometry(page), 2).height).toBeGreaterThan(0);
});
test("desktop and phone recipes have real responsive geometry and complete tables", async ({
  page,
}, testInfo) => {
  for (const [label, width, height] of [
    ["desktop", 1280, 960],
    ["phone", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/histograms.html");
    await expect(page.getByRole("heading", { name: "Every interval matters." })).toBeVisible();
    await expect(page.locator('[data-kind-ui="histogram-bin"]')).toHaveCount(7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.getByText("Data table · 60 samples", { exact: true }).click();
    await expect(page.locator("table").nth(1)).toContainText("50, 100]");
    await page.screenshot({ path: testInfo.outputPath(`histogram-${label}.png`), fullPage: true });
    await page.getByRole("button", { name: "Use two bins" }).click();
    await expect(page.locator('[data-kind-ui="histogram-bin"]')).toHaveCount(5);
    await expect(
      page.getByText("21 accepted · 1 missing · 1 nonfinite · 1 out of range"),
    ).toBeVisible();
  }
});

test("empty, all-zero and single-bin inputs keep native zero semantics", async ({ page }) => {
  for (const mode of ["empty", "zero", "one"]) {
    await page.goto(`${packed}/?data=${mode}`);
    await expect(page.getByRole("application", { name: "Histogram proof" })).toBeVisible();
    await expect(page.locator('[data-kind-ui="histogram-bin"]')).toHaveCount(
      mode === "one" ? 1 : 0,
    );
    if (mode === "zero") {
      await expect(page.getByRole("table")).toContainText("0");
      await page.getByRole("application", { name: "Histogram proof" }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("0 per ms");
    }
    if (mode === "one") expect(at(await geometry(page), 0).width).toBeGreaterThan(300);
  }
});

test("public shape values prove absolute density normalization and zero-total behavior", async ({
  page,
}) => {
  for (const mode of ["positive", "zero", "one"]) {
    await page.goto(mode === "positive" ? packed : `${packed}/?data=${mode}`);
    await page.getByRole("button", { name: "Custom shape" }).click();
    const values = await page.locator("[data-host-numeric]").evaluateAll((nodes) =>
      nodes.map((node) => ({
        value: Number(node.getAttribute("data-value")),
        width: Number(node.getAttribute("data-upper")) - Number(node.getAttribute("data-lower")),
        count: Number(node.getAttribute("data-count")),
      })),
    );
    expect(values).toHaveLength(mode === "one" ? 1 : 5);
    const total = values.reduce((sum, bin) => sum + bin.count, 0);
    // Actual numeric values from the public shape callback: a missing normalization
    // factor cannot cancel as it would in normalized pixel-area comparisons.
    for (const bin of values)
      expect(bin.value).toBeCloseTo(total ? bin.count / total / bin.width : 0, 12);
    expect(values.reduce((area, bin) => area + bin.value * bin.width, 0)).toBeCloseTo(
      total ? 1 : 0,
      12,
    );
  }
});
