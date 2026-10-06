import { expect, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
test.use({ baseURL: `http://127.0.0.1:${4200 + offset}` });

test("loading preserves engines, dimensions and consumer controls through interruptions", async ({
  page,
}) => {
  await page.goto("/loading.html");
  const boundary = page.locator("article").nth(1).locator('[data-kind-ui="line-frame"]');
  const content = boundary;
  const chart = boundary.locator(".recharts-wrapper");
  await expect(chart).toHaveCount(1);
  await expect(content).toHaveAttribute("inert", "");
  await expect(content).toHaveAttribute("aria-busy", "true");
  const box = await chart.boundingBox();
  expect(box?.height).toBe(280);
  await chart.evaluate((element) => {
    element.setAttribute("data-preserved", "yes");
  });
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(content).toHaveAttribute("aria-busy", "false");
  await expect(content).not.toHaveAttribute("inert");
  await expect(chart).toHaveAttribute("data-preserved", "yes");
  await chart.click({ position: { x: 150, y: 100 } });
  await expect(page.locator("output")).toHaveText("1");
  await page.getByRole("checkbox", { name: "Wide layout" }).uncheck();
  await expect.poll(async () => (await chart.boundingBox())?.width).toBeLessThan(box?.width ?? 0);
  expect((await chart.boundingBox())?.height).toBe(280);
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Replay loading" }).click();
    await expect(content).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("button", { name: "Replay loading" })).toBeFocused();
    await page.getByRole("button", { name: "Load data" }).click();
  }
  await page.getByRole("checkbox", { name: "Empty result" }).check();
  await expect(content).toHaveAttribute("aria-busy", "false");
  await expect(page.getByText("No sales found.")).toHaveCount(2);
  await page.getByRole("button", { name: "Replay loading" }).click();
  await expect(chart.locator("svg").first()).toHaveCSS("visibility", "hidden");
  await expect(
    page.locator("article").first().locator('[data-kind-ui="line-frame"]').getByRole("application"),
  ).toHaveCount(0);
  await expect(chart).toHaveAttribute("data-preserved", "yes");
});

test("pulse and reveal obey live reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const boundary = page.locator("article").nth(1).locator('[data-kind-ui="line-frame"]');
  const chart = boundary.locator(".recharts-wrapper");
  const pulse = () =>
    chart.evaluate((element) => getComputedStyle(element, "::after").animationName);
  const content = boundary;
  await expect.poll(pulse).toBe("kind-ui-chart-loading-pulse");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(pulse).toBe("none");
  await expect(chart.locator(":scope > *").first()).toHaveCSS("transition-duration", "0s");
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(chart.locator("svg").first()).toHaveCSS("opacity", "1");
  await expect(chart.locator("svg").first()).toHaveCSS("visibility", "visible");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Replay loading" }).click();
  await page.getByRole("button", { name: "Load data" }).click();
  await page.getByRole("button", { name: "Replay loading" }).click();
  await expect(content).toHaveAttribute("inert", "");
  await expect(chart.locator("svg").first()).toHaveCSS("visibility", "hidden");
});

test("an already-focused chart becomes inert while consumer legend selection persists", async ({
  page,
}) => {
  await page.goto("/loading.html");
  await page.getByRole("button", { name: "Load data" }).click();
  const article = page.locator("article").first();
  const boundary = article.locator('[data-kind-ui="line-frame"]');
  const legend = article.locator('[data-kind-ui="chart-legend-button"]');
  const surface = boundary.locator('svg[role="application"]');
  await legend.click();
  await expect(legend).toHaveAttribute("aria-pressed", "false");
  await surface.focus();
  await expect(surface).toBeFocused();
  await page
    .getByRole("button", { name: "Replay loading" })
    .evaluate((element: HTMLButtonElement) => element.click());
  await expect(boundary).toHaveAttribute("inert", "");
  await surface.evaluate((element: SVGElement) => element.focus());
  await expect(surface).not.toBeFocused();
  await expect(legend).toHaveAttribute("aria-pressed", "false");
  await legend.click();
  await expect(legend).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(legend).toHaveAttribute("aria-pressed", "true");
});

test("relative dimensions and optional loading updates preserve native layout and engine identity", async ({
  page,
}) => {
  await page.goto("/loading.html");
  await page.getByRole("checkbox", { name: "Enable loading prop" }).uncheck();
  await page.getByRole("checkbox", { name: "Partial percentage size" }).check();
  const chart = page.locator("article").nth(1).locator(".recharts-wrapper");
  const native = await chart.boundingBox();
  expect(native?.height).toBe(140);
  await chart.evaluate((element) => element.setAttribute("data-preserved", "yes"));
  await page.getByRole("checkbox", { name: "Enable loading prop" }).check();
  expect(await chart.boundingBox()).toEqual(native);
  await expect(chart).toHaveAttribute("data-preserved", "yes");
  await page.getByRole("button", { name: "Load data" }).click();
  expect(await chart.boundingBox()).toEqual(native);
  await page.getByRole("checkbox", { name: "Enable loading prop" }).uncheck();
  await expect(chart).toHaveAttribute("data-preserved", "yes");
  expect(await chart.boundingBox()).toEqual(native);
});
