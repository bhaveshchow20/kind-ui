import { expect, test } from "@playwright/test";

test("loading preserves engines, dimensions and consumer controls through interruptions", async ({
  page,
}) => {
  await page.goto("/loading.html");
  const boundary = page.getByTestId("bar-loading");
  const content = boundary.locator('[data-kind-ui="chart-loading-content"]');
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
  await expect(content).toHaveCSS("visibility", "hidden");
  await expect(page.getByTestId("line-loading").getByRole("button")).toHaveCount(0);
  await expect(chart).toHaveAttribute("data-preserved", "yes");
});

test("pulse and reveal obey live reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const boundary = page.getByTestId("bar-loading");
  const dot = boundary.locator('[data-kind-ui="chart-loading-placeholder"] > span').first();
  const content = boundary.locator('[data-kind-ui="chart-loading-content"]');
  await expect(dot).toHaveCSS("animation-name", "kind-ui-chart-loading-pulse");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(dot).toHaveCSS("animation-name", "none");
  await expect(content).toHaveCSS("transition-duration", "0s");
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(content).toHaveCSS("opacity", "1");
  await expect(content).toHaveCSS("visibility", "visible");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Replay loading" }).click();
  await page.getByRole("button", { name: "Load data" }).click();
  await page.getByRole("button", { name: "Replay loading" }).click();
  await expect(content).toHaveAttribute("inert", "");
  await expect(content).toHaveCSS("visibility", "hidden");
});
