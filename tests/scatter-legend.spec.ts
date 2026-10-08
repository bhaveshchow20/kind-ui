import { expect, test } from "@playwright/test";

const port = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) + 21;
const url = `http://127.0.0.1:${port}/legend.html`;
const indicator = '[data-kind-ui="chart-indicator"]';
const series = (key: string) => `#primary [data-kind-ui="chart-legend"] [data-series="${key}"]`;

test("packed shared config renders all native symbols and default circle in monochrome", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url);
  const chart = page.getByRole("application", { name: "First scatter" });
  await expect(chart.locator('[data-kind-ui="scatter-fade"]')).toHaveCount(8);
  const keys = ["search", "social", "cross", "square", "star", "triangle", "wye"];
  const symbols = ["circle", "diamond", "cross", "square", "star", "triangle", "wye"];
  const paths = [];
  for (const [i, key] of keys.entries()) {
    const shape = symbols[i];
    if (!shape) throw new Error(`Missing native symbol for ${key}`);
    const marker = page.locator(`${series(key)} ${indicator}`);
    await expect(marker).toHaveAttribute("data-legend-shape", shape);
    await expect(marker).toHaveAttribute("aria-hidden", "true");
    await expect(marker).toHaveAttribute("focusable", "false");
    await expect(marker).toHaveCSS("fill", "rgb(51, 51, 51)");
    await expect(marker).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const d = await marker.locator("path").getAttribute("d");
    expect(d).toBe(
      await chart
        .locator('[data-kind-ui="scatter-fade"]')
        .nth(i)
        .locator(".recharts-scatter-symbol path")
        .getAttribute("d"),
    );
    paths.push(d);
    const bounds = await marker.locator("path").evaluate((node) => {
      const { x, y, width, height } = (node as SVGGraphicsElement).getBBox();
      return { x, y, width, height };
    });
    expect(bounds.x).toBeGreaterThanOrEqual(-8);
    expect(bounds.y).toBeGreaterThanOrEqual(-8);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(8);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(8);
  }
  expect(new Set(paths).size).toBe(7);
  await expect(page.locator(`${series("ordinary")} ${indicator}`)).toHaveCSS("width", "8px");
  await expect(page.locator(`${series("ordinary")} svg`)).toHaveCount(0);
  await expect(page.locator(`${series("icon")} [data-consumer-icon]`)).toHaveCount(1);
  await expect(page.locator(`${series("icon")} [data-legend-shape]`)).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Primary legend" })).toHaveAttribute(
    "data-consumer-ref",
    "ul",
  );
  await expect(page.locator("#readonly")).toContainText("Read-only Search (hidden)");
  await expect(page.locator("#readonly button")).toHaveCount(0);
  await expect(page.locator("#readonly [data-legend-shape]")).toHaveAttribute(
    "data-legend-shape",
    "circle",
  );
  await page.screenshot({
    path: info.outputPath("scatter-legend-symbols-monochrome.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("controlled keyboard toggles retain shape, focus and label while hidden", async ({ page }) => {
  await page.goto(url);
  const button = page
    .locator(series("search"))
    .getByRole("button", { name: "Search", exact: true });
  await button.focus();
  await page.keyboard.press("Space");
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(button.locator(indicator)).toHaveAttribute("data-legend-shape", "circle");
  await expect(button.locator(indicator)).toHaveCSS(
    "fill",
    await button.evaluate((node) => getComputedStyle(node).color),
  );
  await expect(button.locator(indicator)).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(
    page
      .getByRole("application", { name: "First scatter" })
      .locator(".recharts-scatter-symbol path"),
  ).toHaveCount(8);
  await page.keyboard.press("Enter");
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("application", { name: "First scatter" })
      .locator(".recharts-scatter-symbol path"),
  ).toHaveCount(8);
});

test("config updates, reorder, chart unmount and key removal keep scopes deterministic", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Update shape", exact: true }).click();
  await expect(page.locator(`${series("social")} [data-legend-shape]`)).toHaveAttribute(
    "data-legend-shape",
    "star",
  );
  const star = await page.locator(`${series("social")} path`).getAttribute("d");
  expect(star).toBe(
    await page
      .getByRole("application", { name: "First scatter" })
      .locator('[data-kind-ui="scatter-fade"]')
      .nth(1)
      .locator(".recharts-scatter-symbol path")
      .getAttribute("d"),
  );
  await page.getByRole("button", { name: "Reorder", exact: true }).click();
  await expect(
    page.locator('#primary [data-kind-ui="chart-legend"] [data-series]').first(),
  ).toHaveAttribute("data-series", "wye");
  expect(await page.locator(`${series("social")} path`).getAttribute("d")).toBe(star);
  await page.getByRole("button", { name: "Mount charts", exact: true }).click();
  await expect(page.getByRole("application")).toHaveCount(0);
  await expect(page.locator(`${series("social")} [data-legend-shape]`)).toHaveAttribute(
    "data-legend-shape",
    "star",
  );
  await page.getByRole("button", { name: "Mount charts", exact: true }).click();
  await expect(page.getByRole("application")).toHaveCount(2);
  await page.getByRole("button", { name: "Remove social", exact: true }).click();
  await expect(page.locator(series("social"))).toHaveCount(0);
  await page.getByRole("button", { name: "Remove social", exact: true }).click();
  await expect(page.locator(`${series("social")} [data-legend-shape]`)).toHaveAttribute(
    "data-legend-shape",
    "star",
  );
  await expect(page.locator("#independent [data-legend-shape]")).toHaveAttribute(
    "data-legend-shape",
    "triangle",
  );
});

test("hideIcon restores square swatches and composed content keeps custom point ownership", async ({
  page,
}) => {
  await page.goto(url);
  const points = page.locator("[data-custom-point]");
  await expect(points).toHaveCount(2);
  const d = await points.first().getAttribute("d");
  await page.getByRole("button", { name: "Square fallback", exact: true }).click();
  await expect(
    page.locator("#primary [data-legend-shape], #primary [data-consumer-icon]"),
  ).toHaveCount(0);
  await expect(page.locator(`#primary ${indicator}`)).toHaveCount(10);
  await expect(page.locator(`${series("social")} ${indicator}`)).toHaveCSS("width", "8px");
  await page.getByRole("button", { name: "Compose markers", exact: true }).click();
  await expect(page.locator(`${series("custom")} [data-custom-legend]`)).toHaveCount(1);
  await expect(page.locator(`${series("custom")} ${indicator}`)).toHaveCount(0);
  await expect(
    page.locator(series("custom")).getByRole("button", { name: "Custom", exact: true }),
  ).toBeVisible();
  expect(await points.first().getAttribute("d")).toBe(d);
  await page.getByRole("button", { name: "Square fallback", exact: true }).click();
  await expect(page.locator(`${series("icon")} [data-consumer-icon]`)).toHaveCount(1);
  await expect(page.locator(`${series("search")} [data-legend-shape]`)).toHaveAttribute(
    "data-legend-shape",
    "circle",
  );
});

test("maintained circle/diamond recipe shares native paths with its monochrome legend", async ({
  page,
}, info) => {
  await page.goto("/scatters.html");
  const card = page.locator('[aria-labelledby="relationship-title"]');
  const chart = page.getByRole("application", { name: "Latency and acceptance by task" });
  await expect(chart.locator(".recharts-scatter-symbol path:not(defs path)")).toHaveCount(11);
  await page.addStyleTag({
    content:
      '[aria-labelledby="relationship-title"] [data-kind-ui="chart"] {--color-weekday:#333!important;--color-weekend:#333!important;}',
  });
  for (const [key, pointIndex] of [
    ["weekday", 0],
    ["weekend", 6],
  ] as const) {
    const marker = card.locator(`[data-series="${key}"] ${indicator}`);
    expect(await marker.locator("path").getAttribute("d")).toBe(
      await chart
        .locator(".recharts-scatter-symbol path:not(defs path)")
        .nth(pointIndex)
        .getAttribute("d"),
    );
    await expect(marker).toHaveCSS("fill", "rgb(51, 51, 51)");
  }
  await card.screenshot({ path: info.outputPath("monochrome-after.png") });
});
