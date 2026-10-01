import { expect, test } from "@playwright/test";

test("line recipes preserve missing and zero data, independent state and narrow layouts", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/recipes.html");
  await expect(page.getByRole("application")).toHaveCount(3);
  await page.screenshot({ path: info.outputPath("recipes-monochrome.png"), fullPage: true });
  const comparison = page.getByRole("region", { name: "Week over week" });
  await comparison.getByText("View data", { exact: true }).click();
  await expect(comparison.getByRole("row", { name: "Wed No data 22 tasks" })).toBeVisible();
  await expect(comparison.getByRole("row", { name: "Thu 0 tasks 16 tasks" })).toBeVisible();
  const chart = comparison.getByRole("application");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(comparison.getByRole("status")).toContainText("No data");
  await page.keyboard.press("ArrowRight");
  await expect(comparison.getByRole("status")).toContainText("0 tasks");
  await page.keyboard.press("Escape");
  await expect(comparison.getByRole("status")).not.toBeVisible();
  await comparison.getByRole("button", { name: "This week" }).click();
  const previous = comparison.getByRole("button", { name: "Last week" });
  await previous.focus();
  await page.keyboard.press("Space");
  await expect(previous).toBeFocused();
  await expect(comparison.getByRole("status")).toHaveText("Select a series to show it.");
  await expect(page.getByRole("application")).toHaveCount(2);
  await expect(comparison.getByRole("row", { name: "Thu 0 tasks 16 tasks" })).toBeVisible();
  await previous.click();
  await page.getByRole("button", { name: "Color", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await expect(page.locator("main")).toHaveCSS("--chart-1", "#7c3aed");
  await page.screenshot({ path: info.outputPath("recipes-mobile-color.png"), fullPage: true });
  await page.getByLabel("Empty data").check();
  await expect(page.getByRole("application")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(3);
  await page.getByLabel("Empty data").uncheck();
  await expect(page.getByRole("application")).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("optional motion respects changing preferences and survives interrupted interactions", async ({
  page,
}) => {
  await page.goto("/recipes.html");
  await page.getByLabel("Motion", { exact: true }).check();
  await expect(page.locator("main")).toHaveAttribute("data-motion", "off");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "on");
  const clips = page.locator("clipPath[id$='-reveal'] rect");
  await expect(clips).toHaveCount(3);
  await expect
    .poll(async () => Number.parseFloat((await clips.first().getAttribute("width")) ?? "NaN"))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number.parseFloat((await clips.first().getAttribute("width")) ?? "NaN"))
    .toBe(100);
  await expect(page.locator(".recharts-line").first()).not.toHaveCSS("clip-path", "none");
  await page.getByRole("application", { name: "Completed tasks", exact: true }).focus();
  await expect(page.locator(".recharts-line").first()).toHaveCSS("clip-path", "none");

  for (let index = 0; index < 3; index++) {
    await page.getByLabel("Empty data").check();
    await page.getByLabel("Empty data").uncheck();
    await page.getByRole("button", { name: "This week", exact: true }).click();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "off");
  await expect(page.getByRole("application")).toHaveCount(3);
  await expect(page.locator(".recharts-line-curve")).toHaveCount(3);
  await expect(clips).toHaveCount(0);
  for (const line of await page.locator(".recharts-line").all())
    await expect(line).toHaveCSS("clip-path", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(clips).toHaveCount(2);

  await page.getByLabel("Motion", { exact: true }).uncheck();
  await expect(clips).toHaveCount(0);
  await expect(page.locator(".recharts-line").first()).toHaveCSS("clip-path", "none");
  await expect(page.locator("main")).toHaveAttribute("data-motion", "off");
});

test("packed components accept Motion props while retaining refs and native handlers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4174");
  const root = page.getByRole("region", { name: "Motion contract" });
  await expect(root).toHaveAttribute("data-ref-tag", "DIV");
  await expect(root.getByRole("list")).toHaveAttribute("data-ref-tag", "UL");
  await root.focus();
  await expect(root).toHaveAttribute("data-focused", "yes");
  await root.getByRole("button").click();
  await expect(root.getByRole("list")).toHaveAttribute("data-clicked", "yes");
  await expect(root.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  await expect(root).toHaveCSS("opacity", "0.6");
  await expect(root).not.toHaveAttribute("animate");
  await root.getByRole("button").click();
  await expect(root).toHaveCSS("opacity", "1");
  expect(errors).toEqual([]);
});

test("record recipe motion and keyboard exploration", async ({ browser }, info) => {
  const context = await browser.newContext({
    viewport: { width: 720, height: 900 },
    reducedMotion: "no-preference",
    recordVideo: { dir: info.outputPath("recording"), size: { width: 720, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/recipes.html");
  await page.waitForTimeout(700); // Lead-in for the review recording.
  await page.getByLabel("Motion", { exact: true }).check();
  await page.waitForTimeout(800); // Capture the complete 500ms entrance.
  await page.getByLabel("Empty data").check();
  await page.getByLabel("Empty data").uncheck();
  await expect(page.locator(".recharts-line-curve")).toHaveCount(4);
  await page.waitForTimeout(800); // Leave the second entrance visible in the recording.
  await page.getByRole("button", { name: "Color", exact: true }).click();
  const comparison = page.getByRole("region", { name: "Week over week" });
  await comparison.scrollIntoViewIfNeeded();
  await comparison.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(comparison.getByRole("status")).toBeVisible();
  await page.screenshot({ path: info.outputPath("recipes-keyboard.png"), fullPage: true });
  await page.waitForTimeout(1000); // Hold the final keyboard tooltip for review.
  await context.close();
});

test("Motion advances one shared clip per chart and completes without engine interpolation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/recipes.html");
  await page.getByLabel("Motion", { exact: true }).check();
  await page.clock.runFor(100);
  const clip = page.locator("clipPath[id$='-reveal'] rect").first();
  const progress = Number.parseFloat((await clip.getAttribute("width")) ?? "NaN");
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(100);
  await page.clock.runFor(500);
  await expect(clip).toHaveAttribute("width", "100%");
  await expect(page.locator("clipPath[id$='-reveal']")).toHaveCount(3);
  const comparison = page.getByRole("region", { name: "Week over week" });
  const paths = await comparison
    .locator(".recharts-line")
    .evaluateAll((lines) => lines.map((line) => getComputedStyle(line).clipPath));
  expect(paths).toHaveLength(2);
  expect(paths[0]).toBe(paths[1]);
  expect(paths[0]).toContain("-reveal");
  const dots = await comparison
    .locator(".recharts-line-dots")
    .evaluateAll((groups) => groups.map((group) => getComputedStyle(group).clipPath));
  expect(dots).toHaveLength(2);
  expect(dots).toEqual(paths);
  await expect(comparison.locator("clipPath[id$='-reveal']")).toHaveAttribute(
    "clipPathUnits",
    "userSpaceOnUse",
  );
  const bounds = await comparison
    .locator(".recharts-line")
    .evaluateAll((lines) => lines.map((line) => (line as SVGGraphicsElement).getBBox().x));
  expect(bounds[0]).not.toBe(bounds[1]); // Leading missing value: both still share chart coordinates.
  await comparison.getByRole("application").focus();
  await page.getByLabel("Motion", { exact: true }).focus();
  await expect(comparison.locator(".recharts-line").first()).toHaveCSS("clip-path", "none");
});
