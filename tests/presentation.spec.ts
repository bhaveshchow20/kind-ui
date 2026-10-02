import { expect, test } from "@playwright/test";

const port = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) + 14;
const url = `http://127.0.0.1:${port}/presentation.html`;
const tipSelector = '[data-kind-ui="chart-tooltip"]';
async function firstRow(page: import("@playwright/test").Page) {
  await page.locator(".recharts-surface").focus();
  // Native keyboard events are RAF-throttled; settle each move before the next.
  for (const key of ["ArrowRight", "ArrowLeft", "ArrowLeft"]) {
    await page.keyboard.press(key);
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
}
async function explore(page: import("@playwright/test").Page) {
  await firstRow(page);
  await expect(page.locator(tipSelector)).toBeVisible();
}
for (const family of ["line", "area", "bar"]) {
  test(`packed ${family}: icon precedence, label/indicator choices and native formatting`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(url);
    await page.getByLabel("Chart family").selectOption(family);
    await explore(page);
    const tip = page.locator(tipSelector);
    await expect(tip.locator('[data-series="count"] [data-kind-ui="chart-icon"]')).toHaveCount(1);
    await expect(tip.locator('[data-series="count"] [data-kind-ui="chart-indicator"]')).toHaveCount(
      0,
    );
    await expect(tip).toContainText("0 tasks");
    await expect(tip).toHaveAttribute("role", "status");
    await page.getByLabel("Hide label", { exact: true }).check();
    await explore(page);
    await expect(tip.locator('[data-kind-ui="chart-tooltip-label"]')).toHaveCount(0);
    await expect(tip).toContainText("Completed");
    await page.getByLabel("Series icons").uncheck();
    for (const indicator of ["dot", "line", "dashed"]) {
      await page.getByLabel("Indicator", { exact: true }).selectOption(indicator);
      await explore(page);
      const marker = tip.locator('[data-series="count"] [data-kind-ui="chart-indicator"]');
      await expect(marker).toHaveAttribute("data-indicator", indicator);
      const style = await marker.evaluate((node) => ({
        width: getComputedStyle(node).width,
        height: getComputedStyle(node).height,
        border: getComputedStyle(node).borderLeftStyle,
      }));
      expect(style).toMatchObject(
        indicator === "dot"
          ? { width: "8px", height: "8px" }
          : indicator === "line"
            ? { width: "3px", height: "12px" }
            : { border: "dashed", height: "12px" },
      );
    }
    await page.getByLabel("Hide indicator", { exact: true }).check();
    await explore(page);
    await expect(
      tip.locator('[data-kind-ui="chart-indicator"], [data-kind-ui="chart-icon"]'),
    ).toHaveCount(0);
    await page.getByLabel("Formatting", { exact: true }).selectOption("native");
    await explore(page);
    await expect(tip).toContainText("Native count");
    await expect(tip).toContainText("0 native");
    await page.getByLabel("Formatting", { exact: true }).selectOption("suppress");
    await explore(page);
    await expect(tip.locator('[data-series="count"]')).toHaveCount(0);
    await expect(tip).toContainText("Review only");
    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test("packed composed legend: controlled keyboard toggles and icon fallback retain ownership", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByLabel("Compose legend").check();
  const completed = page.locator('[data-series="count"] [data-kind-ui="chart-legend-button"]');
  await expect(completed.locator('[data-kind-ui="chart-icon"]')).toHaveCount(1);
  await page.getByLabel("Legend swatches").check();
  await expect(completed.locator('[data-kind-ui="chart-icon"]')).toHaveCount(0);
  await expect(completed.locator('[data-kind-ui="chart-indicator"]')).toHaveCount(1);
  await completed.focus();
  await page.keyboard.press("Space");
  await expect(completed).toBeFocused();
  await expect(completed).toHaveAttribute("aria-pressed", "false");
  await explore(page);
  await expect(page.locator(`${tipSelector} [data-series="count"]`)).toHaveCount(0);
  await page.getByRole("button", { name: "Review Shown", exact: true }).click();
  await expect(page.getByText("Select a series to show values.")).toBeVisible();
  await expect(page.locator(tipSelector)).toBeHidden();
  await completed.focus();
  await page.keyboard.press("Enter");
  await expect(completed).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(
      '[data-kind-ui="chart-legend-button"] button, [data-kind-ui="chart-legend-button"] input, [data-kind-ui="chart-legend-button"] a',
    ),
  ).toHaveCount(0);
  await expect(page.getByRole("table")).toContainText("0 tasks");
});

test("packed custom content and responsive bounds survive options, hiding and mounted resize", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByLabel("Custom native content").check();
  await page.getByLabel("Hide label", { exact: true }).check();
  await page.getByLabel("Hide indicator", { exact: true }).check();
  const surface = page.locator(".recharts-surface");
  await firstRow(page);
  const custom = page.locator('[data-owner="native-content"]');
  await expect(custom).toBeVisible();
  await expect(custom).toContainText("count: 0");
  await expect(page.locator(tipSelector)).toHaveCount(0);
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await firstRow(page);
  await expect(custom).not.toContainText("count:");
  await page.getByLabel("Custom native content").uncheck();
  await page.getByLabel("Hide indicator", { exact: true }).uncheck();
  await page.getByLabel("Indicator", { exact: true }).selectOption("dashed");
  await explore(page);
  for (const width of [320, 760, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(async () => {
        const frame = await page.locator('[data-kind-ui="tooltip-frame"]').boundingBox();
        const chart = await surface.boundingBox();
        return (
          (await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) &&
          !!frame &&
          !!chart &&
          frame.x >= chart.x - 1 &&
          frame.y >= chart.y - 1 &&
          frame.x + frame.width <= chart.x + chart.width + 1 &&
          frame.y + frame.height <= chart.y + chart.height + 1
        );
      })
      .toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.getByLabel("Dark theme").check();
  await explore(page);
  await expect(page.locator(tipSelector)).toHaveCSS("background-color", "rgb(38, 51, 50)");
  await page.screenshot({ path: "artifacts/chart-tests/presentation-phone.png", fullPage: true });
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.getByLabel("Dark theme").uncheck();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await explore(page);
  await page.screenshot({ path: "artifacts/chart-tests/presentation-desktop.png", fullPage: true });
});

test("packed category itemKey differs from native dataKey: icons, zero, visibility and custom payload", async ({
  page,
}) => {
  await page.goto(`${url}?category=1`);
  await explore(page);
  const tip = page.locator(tipSelector);
  await expect(tip.locator('[data-series="delivery"] [data-kind-ui="chart-icon"]')).toHaveCount(1);
  await expect(tip).toContainText("Delivery");
  await expect(tip).toContainText("0 category units");
  await page.getByRole("button", { name: "Delivery", exact: true }).click();
  await firstRow(page);
  await expect(tip).toBeHidden();
  await page.getByLabel("Custom category content").check();
  await firstRow(page);
  const custom = page.locator('[data-owner="category-content"]');
  await expect(custom).not.toContainText("delivery:");
  await page.keyboard.press("ArrowRight");
  await expect(custom).toBeVisible();
  await expect(custom).toContainText("support: 10");
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await page.locator(".recharts-surface").focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await expect(custom).not.toContainText("support:");
  await expect(page.getByRole("table")).toContainText("Delivery");
});

for (const family of ["line", "area", "bar"]) {
  test(`packed ${family}: default motion follows the live reduced-motion preference`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(url);
    await page.getByLabel("Chart family").selectOption(family);
    await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "on");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "off");
    await explore(page);
    await expect(page.locator(tipSelector)).toContainText("0 tasks");
  });
}
