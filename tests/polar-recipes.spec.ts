import { expect, test } from "./browser";

test("polar recipes use public components, accessible tables and controlled legends", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/polar.html");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Radar & radial charts");
  await expect(page.locator(".polar-card")).toHaveCount(8);
  await expect(page.locator(".polar-card svg[role=application]")).toHaveCount(8);
  await expect(page.locator('[data-kind-ui="radial-label"][data-fit="yes"]').first()).toBeVisible();
  await page.getByRole("checkbox", { name: "Chart text", exact: true }).uncheck();
  await expect(page.locator('[data-kind-ui="radial-label"]')).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Chart text", exact: true }).check();
  await expect(page.locator('[data-kind-ui="radial-label"][data-fit="yes"]').first()).toBeVisible();
  await page.screenshot({
    path: "artifacts/chart-tests/polar-recipes-desktop.png",
    fullPage: true,
  });
  const comparison = page.locator(".polar-card").first();
  await comparison.getByRole("button", { name: "Actual", exact: true }).click();
  await expect(comparison.locator(".recharts-radar")).toHaveCount(1);
  await comparison.getByText("View values", { exact: true }).click();
  await expect(comparison.getByRole("table")).toBeVisible();
  await page.getByRole("combobox", { name: "Data", exact: true }).selectOption("zero");
  await expect(comparison.getByRole("cell", { name: "0", exact: true })).toHaveCount(5);
  await page.getByRole("combobox", { name: "Data", exact: true }).selectOption("empty");
  await expect(page.getByText("No scores yet.", { exact: true })).toHaveCount(6);
  await page.getByRole("combobox", { name: "Data", exact: true }).selectOption("sample");
  await page.getByRole("button", { name: "Update scores" }).click();
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator(".polar-card svg[role=application]")).toHaveCount(8);
  expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/chart-tests/polar-recipes-mobile.png", fullPage: true });
});

test("gauge value stays large in center whitespace through visibility, data updates and phone layout", async ({
  page,
}) => {
  await page.goto("/polar.html");
  const gauge = page
    .locator(".polar-card")
    .filter({ has: page.getByRole("heading", { name: "Gauge", exact: true }) });
  const value = gauge.locator("[data-gauge-value]");
  async function inWhitespace() {
    await expect(value).toBeVisible();
    expect(
      await value.evaluate((node) => {
        const text = node as SVGTextElement;
        const box = text.getBBox();
        const cx = Number(text.dataset.cx),
          cy = Number(text.dataset.cy);
        const radius = Number(text.dataset.innerRadius);
        return (
          Number.parseFloat(getComputedStyle(text).fontSize) >= 36 &&
          box.y + box.height <= cy &&
          [box.x, box.x + box.width].every((x) =>
            [box.y, box.y + box.height].every((y) => Math.hypot(x - cx, y - cy) < radius),
          )
        );
      }),
    ).toBe(true);
    await expect(gauge.locator('[data-kind-ui="radial-label"]')).toHaveCount(0);
  }
  await expect(value).toHaveText("85");
  await inWhitespace();
  await gauge.screenshot({ path: "artifacts/chart-tests/gauge-whitespace-desktop.png" });
  const paths = await gauge
    .locator(".recharts-radial-bar-sector")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  await page.getByRole("checkbox", { name: "Chart text", exact: true }).uncheck();
  await expect(value).toHaveCount(0);
  expect(
    await gauge
      .locator(".recharts-radial-bar-sector")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
  ).toEqual(paths);
  await gauge.getByText("View values", { exact: true }).click();
  await expect(gauge.getByRole("table")).toContainText("85");
  await gauge.locator('svg[role="application"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(gauge.locator('[data-kind-ui="chart-tooltip"]')).toContainText("85 points");
  await page.getByRole("checkbox", { name: "Chart text", exact: true }).check();
  await page.getByRole("button", { name: "Update scores" }).click();
  await expect(value).toHaveText("15");
  await inWhitespace();
  await page.getByRole("combobox", { name: "Data", exact: true }).selectOption("zero");
  await expect(value).toHaveText("0");
  await inWhitespace();
  await page.getByRole("combobox", { name: "Data", exact: true }).selectOption("empty");
  await expect(value).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(value).toHaveText("85");
  await inWhitespace();
  await gauge.screenshot({ path: "artifacts/chart-tests/gauge-whitespace-mobile.png" });
  await page.getByRole("checkbox", { name: "Chart text", exact: true }).uncheck();
  await expect(value).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Chart text", exact: true }).check();
  await inWhitespace();
  await page.getByRole("checkbox", { name: "Tooltips", exact: true }).uncheck();
  await inWhitespace();
  await page.getByRole("button", { name: "Update scores" }).click();
  await expect(value).toHaveText("15");
  await inWhitespace();
});
