import { expect, test } from "@playwright/test";

test("bar recipes expose missing and zero data with keyboard tooltips and narrow layouts", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/bars.html");
  await expect(page.getByRole("application")).toHaveCount(10);
  await page.screenshot({ path: info.outputPath("bars-monochrome.png"), fullPage: true });
  const vertical = page.getByRole("region", { name: "Vertical", exact: true });
  await vertical.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(vertical.getByRole("status")).toContainText("No data");
  await page.keyboard.press("ArrowRight");
  await expect(vertical.getByRole("status")).toContainText("0 tasks");
  await page.keyboard.press("Escape");
  await expect(vertical.getByRole("status")).not.toBeVisible();
  const horizontal = page.getByRole("region", { name: "Horizontal", exact: true });
  await horizontal.getByRole("application").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(horizontal.getByRole("status")).toContainText("31 tasks");
  const grouped = page.getByRole("region", { name: "Grouped", exact: true });
  await grouped.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(grouped.getByRole("status")).toContainText("No data");
  await expect(grouped.getByRole("status")).toContainText("22 tasks");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(grouped.getByRole("status")).toContainText("34 tasks");
  await grouped.getByRole("status").screenshot({ path: info.outputPath("compact-tooltip.png") });
  await page.keyboard.press("Escape");
  await grouped.getByText("View data", { exact: true }).click();
  await expect(grouped.getByRole("row", { name: "Wed No data 22 tasks" })).toBeVisible();
  await expect(grouped.getByRole("row", { name: "Thu 0 tasks 16 tasks" })).toBeVisible();
  await page.getByRole("button", { name: "Color", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.screenshot({ path: info.outputPath("bars-mobile-color.png"), fullPage: true });
  await page.getByLabel("Empty data").check();
  await expect(page.getByRole("application")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(10);
  await page.getByLabel("Empty data").uncheck();
  await expect(page.getByRole("application")).toHaveCount(10);
  expect(errors).toEqual([]);
});

test("bar geometry keeps grouping separate, complete stacks additive and zero uninflated", async ({
  page,
}) => {
  await page.goto("/bars.html");
  const paths = (name: string) =>
    page.getByRole("region", { name, exact: true }).locator(".recharts-bar-rectangle path");
  const bounds = async (name: string) =>
    paths(name).evaluateAll((nodes) =>
      nodes.map((node) => {
        const { x, y, width, height } = (node as SVGGraphicsElement).getBBox();
        return { x, y, width, height };
      }),
    );
  const vertical = await bounds("Vertical");
  expect(vertical.filter((p) => p.height > 0)).toHaveLength(3);
  const horizontal = await bounds("Horizontal");
  expect(horizontal).toHaveLength(4);
  if (!horizontal[0] || !horizontal[1]) throw new Error("Expected channel bars");
  expect(horizontal[0].width).toBeGreaterThan(horizontal[1].width);
  const grouped = await bounds("Grouped");
  expect(grouped[0]?.x).not.toBe(grouped[3]?.x);
  const stacked = page
    .getByRole("region", { name: "Stacked", exact: true })
    .locator(".recharts-bar");
  const first = await stacked.nth(0).locator("path.recharts-rectangle").first().boundingBox();
  const second = await stacked.nth(1).locator("path.recharts-rectangle").first().boundingBox();
  if (!first || !second) throw new Error("Expected two stacked segments");
  expect(first.x).toBeCloseTo(second.x, 1);
  expect(first.y).toBeCloseTo(second.y + second.height, 1);
});

test("Motion reveals bars from the value baseline and interrupts safely", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/bars.html");
  await page.getByLabel("Motion", { exact: true }).check();
  const clips = page.locator("[data-bar-reveal='']");
  await expect(clips).toHaveCount(10);
  const vertical = clips.nth(0),
    horizontal = clips.nth(1);
  await page.clock.runFor(120);
  const earlyHeight = Number.parseFloat((await vertical.getAttribute("height")) ?? "NaN");
  const earlyWidth = Number.parseFloat((await horizontal.getAttribute("width")) ?? "NaN");
  expect(earlyHeight).toBeGreaterThan(0);
  expect(earlyWidth).toBeGreaterThan(0);
  await page.clock.runFor(300);
  expect(Number.parseFloat((await vertical.getAttribute("height")) ?? "NaN")).toBeGreaterThan(
    earlyHeight,
  );
  expect(Number.parseFloat((await horizontal.getAttribute("width")) ?? "NaN")).toBeGreaterThan(
    earlyWidth,
  );
  await page.clock.runFor(1000);
  await expect(clips).toHaveCount(0);
  await page.getByRole("button", { name: "Color", exact: true }).click();
  // Completed reveals must not lag behind immediate Recharts resize geometry.
  await page.setViewportSize({ width: 320, height: 800 });
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.clock.runFor(32);
  await expect(clips).toHaveCount(0);
  for (const bar of await page.locator(".recharts-bar").all())
    await expect(bar).toHaveCSS("clip-path", "none");
  await page.getByLabel("Empty data").check();
  await page.getByLabel("Empty data").uncheck();
  await page.clock.runFor(120);
  await page.getByRole("application", { name: "Daily completions", exact: true }).focus();
  await expect(
    page.getByRole("region", { name: "Vertical", exact: true }).locator(".recharts-bar"),
  ).toHaveCSS("clip-path", "none");
  await page.getByLabel("Empty data").check();
  await page.getByLabel("Empty data").uncheck();
  await page.clock.runFor(120);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(clips).toHaveCount(0);
  for (const bar of await page.locator(".recharts-bar").all())
    await expect(bar).toHaveCSS("clip-path", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(clips).toHaveCount(10);
  await page.getByLabel("Motion", { exact: true }).uncheck();
  await expect(clips).toHaveCount(0);
});

test("bar tooltip retargets and settles mid-flight when reduced motion or explicit off changes", async ({
  page,
}, info) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/bars.html");
  await page.getByLabel("Motion", { exact: true }).check();
  await page.clock.runFor(1100);
  const chart = page.getByRole("region", { name: "Vertical", exact: true });
  const bars = chart.locator(".recharts-bar-rectangle path");
  const start = await bars.first().boundingBox(),
    end = await bars.last().boundingBox();
  if (!start || !end) throw new Error("Expected nonzero bars");
  const tip = chart.locator("[data-recipe-tooltip-motion]");
  const readX = () => tip.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).m41);
  await page.mouse.move(start.x + start.width / 2, start.y + 10);
  await page.clock.runFor(1500);
  const firstX = await readX();
  await page.mouse.move(end.x + end.width / 2, end.y + 10);
  await page.clock.runFor(80);
  expect(await readX()).toBeGreaterThan(firstX);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "off");
  await page.clock.runFor(32);
  const finalX = await readX();
  expect(finalX).toBeGreaterThan(firstX);
  await page.clock.runFor(1000);
  expect(await readX()).toBe(finalX);
  await expect(chart.getByRole("status")).toContainText("34 tasks");
  await page.screenshot({ path: info.outputPath("bars-hover.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "on");
  await page.mouse.move(start.x + start.width / 2, start.y + 10);
  await page.clock.runFor(80);
  expect(await readX()).toBeGreaterThan(firstX);
  await page
    .getByLabel("Motion", { exact: true })
    .evaluate((node) => (node as HTMLInputElement).click());
  await page.clock.runFor(32);
  expect(await readX()).toBeCloseTo(firstX, 1);
});
