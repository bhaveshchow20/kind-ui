import { expect, type Locator, test } from "@playwright/test";

async function paintOpacity(mark: Locator) {
  return mark.evaluate((node) => {
    let opacity = 1;
    for (
      let element: Element | null = node;
      element && element.localName !== "svg";
      element = element.parentElement
    )
      opacity *= Number(getComputedStyle(element).opacity);
    return opacity;
  });
}

test("Pie hide preserves original angles, sector identity and pointer rows during entrance", async ({
  page,
}) => {
  await page.goto("/?only=pie");
  const chart = page.locator("#pie-hide");
  const sectors = chart.locator('[data-kind-ui="pie-sector"]');
  await expect(sectors).toHaveCount(3);
  const initial = await sectors.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  for (let iteration = 0; iteration < 3; iteration++) {
    await chart.getByRole("button", { name: "Hide first pie category" }).click();
    await expect(sectors).toHaveCount(3);
    await expect(
      chart.locator('[data-kind-ui="pie-category-paint"][data-category="first"]').first(),
    ).toHaveAttribute("aria-hidden", "true");
    await expect.poll(() => paintOpacity(sectors.first())).toBe(0);
    expect(
      await sectors.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
    ).toEqual(initial);
    await chart.getByRole("button", { name: "Toggle second" }).hover();
    await expect(chart.locator("output")).toHaveText("second:30");
    await chart.getByRole("button", { name: "Restore pie categories" }).click();
    await expect.poll(() => paintOpacity(sectors.first())).toBe(1);
    expect(
      await sectors.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
    ).toEqual(initial);
  }
});

test("Pinned second category retains native index 1 with first category hidden", async ({
  page,
}) => {
  await page.goto("/?only=pie");
  const chart = page.locator("#pie-pin-hidden");
  const payload = chart.locator("output");
  await expect(payload).toHaveText("second:30");
  await expect(payload).toHaveAttribute("data-native-index", "1");
  await expect(chart.locator('[data-kind-ui="pie-sector"]')).toHaveCount(3);
  await expect
    .poll(() => paintOpacity(chart.locator('[data-kind-ui="pie-sector"]').first()))
    .toBe(0);
});

test("Bound Pie default Tooltip resolves original category metadata without itemKey", async ({
  page,
}) => {
  await page.goto("/?only=pie");
  const item = page.locator('#pie-pin-default [data-kind-ui="chart-tooltip-item"]');
  await expect(item).toHaveAttribute("data-series", "second");
  await expect(item).toContainText("Second");
  await expect(item).toContainText("30");
});

test("Pie hide/restore reverses the current fade without replacing geometry or restoring hidden hits", async ({
  page,
}) => {
  await page.goto("/?only=pie");
  const chart = page.locator("#pie-hide");
  const first = chart.locator('[data-kind-ui="pie-sector"]').first();
  await expect(first).toBeVisible();
  const path = await first.getAttribute("d");
  const identity = await first.getAttribute("data-recharts-item-id");
  const originalIndex = await first.getAttribute("data-recharts-item-index");
  await chart.getByRole("button", { name: "Hide first pie category" }).click();
  const gate = chart.locator('[data-kind-ui="pie-category-paint"][data-category="first"]').first();
  await expect(gate).toHaveAttribute("pointer-events", "none");
  await expect(gate).toHaveAttribute("aria-hidden", "true");
  await page.waitForTimeout(150);
  const falling = await paintOpacity(first);
  expect(falling).toBeGreaterThan(0);
  expect(falling).toBeLessThan(1);
  await chart.getByRole("button", { name: "Restore pie categories" }).click();
  const reversed = await paintOpacity(first);
  expect(Math.abs(reversed - falling)).toBeLessThan(0.2);
  await page.waitForTimeout(200);
  expect(await paintOpacity(first)).toBeGreaterThan(reversed);
  await expect.poll(() => paintOpacity(first)).toBe(1);
  await expect(first).toHaveAttribute("data-recharts-item-id", identity ?? "");
  await expect(first).toHaveAttribute("data-recharts-item-index", originalIndex ?? "");
  await expect(first).toHaveAttribute("d", path ?? "");
});

test("Pie visibility changes immediately with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?only=pie");
  const chart = page.locator("#pie-hide");
  const first = chart.locator('[data-kind-ui="pie-sector"]').first();
  await chart.getByRole("button", { name: "Hide first pie category" }).click();
  expect(await paintOpacity(first)).toBe(0);
  await chart.getByRole("button", { name: "Restore pie categories" }).click();
  expect(await paintOpacity(first)).toBe(1);
});

test("Whole Pie hide fades sectors and ordinary labels while retaining angular slots", async ({
  page,
}) => {
  await page.goto("/?only=pie");
  const chart = page.locator("#pie-hide");
  const first = chart.locator('[data-kind-ui="pie-sector"]').first();
  const label = chart.locator(".recharts-pie-label-text").first();
  await expect(label).toBeVisible();
  const geometry = await chart
    .locator('[data-kind-ui="pie-sector"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  await chart.getByRole("button", { name: "Hide all pie sectors" }).click();
  await page.waitForTimeout(150);
  expect(await paintOpacity(first)).toBeGreaterThan(0);
  expect(await paintOpacity(first)).toBeLessThan(1);
  expect(await paintOpacity(label)).toBeGreaterThan(0);
  expect(await paintOpacity(label)).toBeLessThan(1);
  await expect(
    chart.locator('[data-kind-ui="pie-category-paint"][data-category="first"]').first(),
  ).toHaveAttribute("aria-hidden", "true");
  await chart.getByRole("button", { name: "Restore all pie sectors" }).click();
  await expect.poll(() => paintOpacity(first)).toBe(1);
  await expect.poll(() => paintOpacity(label)).toBe(1);
  expect(
    await chart
      .locator('[data-kind-ui="pie-sector"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
  ).toEqual(geometry);
});
