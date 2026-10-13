import { expect, test } from "@playwright/test";

test("Funnel checkout gallery and expanded example retain stage values and denominator", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem("funnel-copy", text);
        },
      },
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("tab", { name: "Funnel", exact: true }).click();
  const card = page.locator(".demo-grid .chart-card").first();
  await expect(card.getByRole("heading", { name: "Checkout journey" })).toBeVisible();
  await expect(card.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(4);
  await card.locator('[data-stage-id="payment"][data-kind-ui="funnel-stage"]').focus();
  await expect(card.getByRole("tooltip")).toContainText("1,200");
  await expect(card.getByRole("tooltip")).toContainText("50%");
  await expect(card.getByRole("table", { name: "Checkout sessions" })).toContainText("2,400");
  await expect(card.locator(".chart-context")).toContainText("sessions");
  await card.screenshot({ path: testInfo.outputPath("funnel-card.png") });
  await page.locator(".tile-open").first().click();
  const expanded = page.locator(".playground-preview .chart-card");
  await expect(expanded.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(4);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Checkout journey");
  await expect(dialog.getByRole("switch")).toHaveCount(2);
  await dialog.getByRole("switch", { name: "Labels", exact: true }).uncheck();
  await dialog.getByRole("switch", { name: "Legend", exact: true }).uncheck();
  await expect(expanded.locator('[data-kind-ui="funnel-labels"]')).toHaveCount(0);
  await expect(expanded.locator('[data-kind-ui="chart-legend"]')).toHaveCount(0);
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  await dialog.getByRole("button", { name: "Copy code", exact: true }).click();
  const copied = await page.evaluate(() => sessionStorage.getItem("funnel-copy"));
  expect(copied).toContain('denominator="first"');
  expect(copied).toContain('ratioLabel="Share of basket sessions"');
  expect(copied).toContain('geometry="trapezoid"');
  expect(copied).toContain('"value": 2400');
  expect(copied).toContain('"value": 960');
  expect(copied).not.toContain("FunnelChart.Labels");
  expect(copied).not.toContain("FunnelChart.Legend");
  expect(copied).toContain("<table>");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
