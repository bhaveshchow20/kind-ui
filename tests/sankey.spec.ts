import { expect, test } from "@playwright/test";

const packed = `http://127.0.0.1:${4189 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;

test("Sankey native widths, labels, pointer and keyboard inspection retain zero", async ({
  page,
}) => {
  await page.goto("/sankeys.html");
  const recipe = page.locator("main > section").first();
  const paths = recipe.locator("path[data-flow-id]");
  await expect(paths).toHaveCount(3);
  const widths = await paths.evaluateAll((marks) =>
    marks.map((mark) => Number(mark.getAttribute("stroke-width"))),
  );
  expect((widths[1] ?? 0) / (widths[2] ?? 1)).toBeCloseTo(3, 5);
  await expect(recipe.locator("svg text").filter({ hasText: "Processing" })).toBeVisible();
  await recipe.getByRole("button", { name: "reserve", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(recipe.locator('p[role="status"]')).toHaveText("reserve: 0 MWh");
  await expect(recipe.getByRole("button", { name: "reserve", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await recipe.locator(".diagram-scroll").scrollIntoViewIfNeeded();
  const point = await recipe.locator('path[data-flow-id="useful"]').evaluate((element) => {
    const path = element as SVGPathElement;
    const midpoint = path.getPointAtLength(path.getTotalLength() / 2);
    const screen = new DOMPoint(midpoint.x, midpoint.y).matrixTransform(
      path.getScreenCTM() ?? undefined,
    );
    return { x: screen.x, y: screen.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(recipe.locator('p[role="status"]')).toHaveText("useful: 75 MWh");
  await recipe.getByRole("button", { name: "Change dataset" }).click();
  await expect(recipe.locator("tbody")).toContainText("150 MWh");
  await expect(recipe.locator('p[role="status"]')).toContainText("Select a link");
});

test("Sankey mobile scroll, zero and empty alternatives", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/sankeys.html");
  const scroll = page.locator(".diagram-scroll").first();
  expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await scroll.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Toggle empty" }).click();
  await expect(page.getByRole("status").last()).toHaveText("No positive flows");
  await expect(page.getByRole("caption").last()).toHaveText("Empty dataset: no observed flows");
  await page.screenshot({ path: testInfo.outputPath("sankey-phone.png"), fullPage: true });
});

test("Sankey desktop materials keep equal widths", async ({ page }, testInfo) => {
  await page.goto("/sankeys.html");
  const first = await page
    .locator("main > section")
    .nth(0)
    .locator("path[data-flow-id]")
    .evaluateAll((marks) => marks.map((m) => m.getAttribute("stroke-width")));
  expect(first).toHaveLength(3);
  const second = await page
    .locator("main > section")
    .nth(1)
    .locator("path[data-flow-id]")
    .evaluateAll((marks) => marks.map((m) => m.getAttribute("stroke-width")));
  expect(second).toEqual(first);
  await page.screenshot({ path: testInfo.outputPath("sankey-desktop.png"), fullPage: true });
});

test("Sankey installed tarball renders native marks and keyboard zero", async ({ page }) => {
  await page.goto(packed);
  await expect(page.getByRole("table")).toContainText("zero");
  await expect(page.locator(".recharts-sankey-links")).toHaveCount(1);
  await page.getByRole("button", { name: "zero", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "zero", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

for (const interruption of ["pointer", "focus", "resize", "data", "reduced"] as const) {
  test(`Sankey reveal stops on ${interruption} without changing widths`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(packed, { waitUntil: "commit" });
    const chart = page.locator('[data-kind-ui="sankey"]').first();
    await expect(
      chart.locator(".recharts-sankey-links path:not([data-kind-ui=sankey-link-entrance])"),
    ).toHaveCount(1);
    const streams = chart.locator('[data-kind-ui="sankey-link-entrance"]');
    await expect(streams.first()).toBeAttached();
    const initialDash = await streams.first().getAttribute("stroke-dasharray");
    await expect.poll(() => streams.first().getAttribute("stroke-dasharray")).not.toBe(initialDash);
    await expect(chart).toHaveCSS("opacity", "1");
    const before = await chart
      .locator(".recharts-sankey-links path:not([data-kind-ui=sankey-link-entrance])")
      .evaluateAll((marks) => marks.map((m) => m.getAttribute("stroke-width")));
    if (interruption === "pointer") await chart.dispatchEvent("pointerdown");
    if (interruption === "focus") await chart.locator("svg").first().focus();
    if (interruption === "resize") await page.setViewportSize({ width: 1100, height: 900 });
    if (interruption === "data") await page.getByRole("button", { name: "Change data" }).click();
    if (interruption === "reduced") await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() => chart.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 300 })
      .toBe(1);
    await expect(streams).toHaveCount(0);
    const after = await chart
      .locator(".recharts-sankey-links path:not([data-kind-ui=sankey-link-entrance])")
      .evaluateAll((marks) => marks.map((m) => m.getAttribute("stroke-width")));
    expect(after).toEqual(before);
  });
}

test("Sankey reduced motion and unmount remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sankeys.html");
  await expect(page.locator('[data-kind-ui="sankey"]').first()).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(packed, { waitUntil: "commit" });
  await expect(page.locator('[data-kind-ui="sankey"]').first()).toBeAttached();
  await page.getByRole("button", { name: "Toggle chart" }).click();
  await expect(page.locator('[data-kind-ui="sankey"]')).toHaveCount(0);
  await expect(page.getByRole("table")).toBeVisible();
});

for (const extreme of ["tiny", "huge", "aggregate", "padding"]) {
  test(`Sankey rejects native numeric ${extreme} limits without fabricating flows`, async ({
    page,
  }) => {
    await page.goto(`${packed}/?extreme=${extreme}`);
    await expect(page.getByRole("alert")).toContainText("native renderer numeric limits");
    await expect(page.locator(".recharts-sankey-links")).toHaveCount(0);
  });
}
test("Sankey too-small frame keeps the full data alternative", async ({ page }) => {
  await page.goto(packed);
  await page.getByRole("button", { name: "Narrow frame" }).click();
  await expect(page.getByRole("status")).toContainText("Insufficient space");
  await expect(page.getByRole("table")).toContainText("zero");
});

test("our SankeyLink flows while consumer paint refs and handlers remain owned; raw custom renderer stays native", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${packed}/?ownership`);
  const custom = page.getByLabel("custom-link");
  await expect(custom).toHaveAttribute("stroke", "pink");
  await expect(
    custom
      .locator("xpath=ancestor::*[@data-kind-ui='sankey']")
      .locator('[data-kind-ui="sankey-link-entrance"]'),
  ).toHaveCount(0);
  const chart = page.locator('[data-kind-ui="sankey"]').last();
  const paths = page.locator('[data-consumer-ref="attached"]');
  await expect(paths.first()).toHaveCSS("opacity", "0.7");
  await expect(paths.first()).toHaveAttribute("stroke-width", /[0-9]/);
  const streams = chart.locator('[data-kind-ui="sankey-link-entrance"]');
  await expect(streams.first()).toBeAttached();
  const d = await paths.first().getAttribute("d");
  expect(await streams.first().getAttribute("d")).toBe(d);
  await page.screenshot({ path: info.outputPath("sankey-stream-entrance.png") });
  await paths.first().dispatchEvent("click");
  await expect(page.getByRole("region", { name: "Mark ownership" })).toContainText("1 /");
});

test("packed Sankey labels track node identity and current values", async ({ page }) => {
  await page.goto(packed);
  const label = page.locator('[data-kind-ui="sankey-node-label"][data-node-id="a"]');
  await expect(label.locator("text")).toHaveText("Input: 10");
  await page.getByRole("button", { name: "Change data" }).click();
  await expect(label.locator("text")).toHaveText("Input: 20");
  await expect(label.locator("title")).toHaveText("Input: 20");
  await expect(page.getByRole("table")).toContainText("20");
});
