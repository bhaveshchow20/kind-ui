import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4204 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const skeleton = '[data-kind-ui="chart-loading-skeleton"]';

test("loading contains only seeded candle bodies and wicks, refreshed between pulses", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  const surface = page.locator(skeleton);
  await expect(surface).toBeVisible();
  const marks = surface.locator('[data-kind-ui="candlestick-loading-mark"]');
  await expect(surface.locator("g rect")).toHaveCount(12);
  await expect(marks).toHaveCount(12);
  await expect(marks.locator("rect")).toHaveCount(12);
  await expect(marks.locator("line")).toHaveCount(12);
  const geometry = () => marks.evaluateAll((nodes) => nodes.map((node) => node.innerHTML));
  const before = await geometry();
  await surface.evaluate((node) => {
    node.dispatchEvent(
      new AnimationEvent("animationiteration", {
        animationName: "kind-ui-loading-pulse",
        bubbles: true,
      }),
    );
  });
  await expect.poll(geometry).not.toEqual(before);
  await expect(page.locator('[data-kind-ui="chart-loading-status"]')).toHaveText(/Loading/);
});

test("normal loading reveals from left to right through the established horizontal sweep", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto(url);
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  const window = page.locator(`${skeleton} [data-kind-ui="loading-leading-window"]`);
  await expect(window).toHaveCount(1);
  const start = Number(await window.getAttribute("x"));
  await page.clock.runFor(800);
  const advanced = Number(await window.getAttribute("x"));
  expect(advanced).toBeGreaterThan(start + 200);
  await expect(window).toHaveAttribute("width", "320");
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(page.locator(skeleton)).toHaveCount(0);
  await page.clock.runFor(2500);
  await expect(page.locator('[data-kind-ui="candlestick-mark"]').first()).toBeVisible();
});

test("reduced motion shows a stable complete candle illustration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  const surface = page.locator(skeleton);
  await expect(surface.locator('[data-kind-ui="candlestick-loading-mark"]')).toHaveCount(12);
  await expect(surface.locator('[data-kind-ui="loading-leading-window"]')).toHaveCount(0);
  const before = await surface
    .locator('[data-kind-ui="candlestick-loading-mark"]')
    .evaluateAll((nodes) => nodes.map((node) => node.innerHTML));
  await page.waitForTimeout(200);
  expect(await surface.evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  expect(
    await surface
      .locator('[data-kind-ui="candlestick-loading-mark"]')
      .evaluateAll((nodes) => nodes.map((node) => node.innerHTML)),
  ).toEqual(before);
});
