import { expect, test } from "./browser";
import { expectLastVisibleGuard } from "./last-visible";

test("line recipes preserve missing and zero data, independent state and narrow layouts", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/recipes.html");
  await expect(page.locator(".recipe-stack").getByRole("application")).toHaveCount(8);
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
  await expectLastVisibleGuard(previous, comparison.locator(".recharts-line-curve"), () =>
    page.keyboard.press("Space"),
  );
  await expect(previous).toBeFocused();
  await expect(page.locator(".recipe-stack").getByRole("application")).toHaveCount(8);
  await expect(comparison.getByRole("row", { name: "Thu 0 tasks 16 tasks" })).toBeVisible();
  await comparison.getByRole("button", { name: "This week" }).click();
  await page.getByRole("button", { name: "Color", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await expect(page.locator("main")).toHaveCSS("--chart-1", "#7c3aed");
  await page.screenshot({ path: info.outputPath("recipes-mobile-color.png"), fullPage: true });
  await page.getByLabel("Empty data").check();
  await expect(page.locator(".recipe-stack").getByRole("application")).toHaveCount(0);
  await expect(page.locator(".recipe-stack").getByRole("status")).toHaveCount(8);
  await page.getByLabel("Empty data").uncheck();
  await expect(page.locator(".recipe-stack").getByRole("application")).toHaveCount(8);
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
  const clips = page.locator(".recipe-stack clipPath[id$='-reveal'] rect");
  await expect(clips).toHaveCount(8);
  await expect
    .poll(async () => Number.parseFloat((await clips.first().getAttribute("width")) ?? "NaN"))
    .toBeGreaterThan(0);
  await expect
    .poll(async () => Number.parseFloat((await clips.first().getAttribute("width")) ?? "NaN"))
    .toBe(100);
  await expect(page.locator(".recipe-stack .recharts-line").first()).not.toHaveCSS(
    "clip-path",
    "none",
  );
  await page.getByRole("application", { name: "Smooth daily completions", exact: true }).focus();
  await expect(page.locator(".recipe-stack .recharts-line").first()).toHaveCSS("clip-path", "none");

  for (let index = 0; index < 3; index++) {
    await page.getByLabel("Empty data").check();
    await page.getByLabel("Empty data").uncheck();
    await page.getByRole("button", { name: "This week", exact: true }).click();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "off");
  await expect(page.locator(".recipe-stack").getByRole("application")).toHaveCount(8);
  await expect(page.locator(".recipe-stack .recharts-line-curve")).toHaveCount(8);
  await expect(clips).toHaveCount(0);
  for (const line of await page.locator(".recipe-stack .recharts-line").all())
    await expect(line).toHaveCSS("clip-path", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(clips).toHaveCount(7);

  await page.getByLabel("Motion", { exact: true }).uncheck();
  await expect(clips).toHaveCount(0);
  await expect(page.locator(".recipe-stack .recharts-line").first()).toHaveCSS("clip-path", "none");
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
  await expectLastVisibleGuard(
    root.getByRole("button"),
    root.locator('[data-kind-ui="chart-indicator"]'),
  );
  await expect(root.getByRole("list")).toHaveAttribute("data-clicked", "yes");
  await expect(root).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "External visibility", exact: true }).click();
  await expect(root.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  await expect(root).toHaveCSS("opacity", "0.6");
  await expect(root).not.toHaveAttribute("animate");
  await page.getByRole("button", { name: "External visibility", exact: true }).click();
  await expect(root.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  await expect(root).toHaveCSS("opacity", "1");
  expect(errors).toEqual([]);
});

test("Motion advances one shared clip per chart and completes without engine interpolation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/recipes.html");
  await page.getByLabel("Motion", { exact: true }).check();
  await page.clock.runFor(100);
  const clip = page.locator(".recipe-stack clipPath[id$='-reveal'] rect").first();
  const progress = Number.parseFloat((await clip.getAttribute("width")) ?? "NaN");
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(100);
  await page.clock.runFor(1000);
  await expect(clip).toHaveAttribute("width", "100%");
  await expect(page.locator(".recipe-stack clipPath[id$='-reveal']")).toHaveCount(8);
  const comparison = page.getByRole("region", { name: "Week over week" });
  const paths = await comparison
    .locator(".recharts-line")
    .evaluateAll((lines) => lines.map((line) => getComputedStyle(line).clipPath));
  expect(paths).toHaveLength(2);
  expect(paths[0]).toBe(paths[1]);
  expect(paths[0]).toContain("-reveal");
  const dots = await comparison
    .locator(".recharts-line-dots")
    .evaluateAll((groups) =>
      groups.map((group) => getComputedStyle(group.closest(".recharts-line") ?? group).clipPath),
    );
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

test("gallery variants retain their distinct engine geometry and markers have solid outlines", async ({
  page,
}, info) => {
  await page.goto("/recipes.html");
  for (const title of ["Smooth", "Step", "Dots", "Custom markers", "Labels"]) {
    await expect(
      page.getByRole("region", { name: title, exact: true }).getByRole("application"),
    ).toBeVisible();
  }
  const smooth = page.getByRole("region", { name: "Smooth", exact: true });
  const step = page.getByRole("region", { name: "Step", exact: true });
  expect(await smooth.locator(".recharts-line-curve").getAttribute("d")).toContain("C");
  expect(await step.locator(".recharts-line-curve").getAttribute("d")).not.toContain("C");
  await expect(
    page
      .getByRole("region", { name: "Custom markers", exact: true })
      .locator('[data-recipe-marker="diamond"]'),
  ).toHaveCount(7);
  await expect(
    page.getByRole("region", { name: "Labels", exact: true }).locator(".recharts-label-list text"),
  ).toHaveCount(7);
  const comparison = page.getByRole("region", { name: "Week over week" });
  const hollow = comparison.locator('.recharts-line-dots circle[fill="var(--card)"]');
  await expect(hollow).toHaveCount(7);
  for (const dot of await hollow.all()) await expect(dot).toHaveCSS("stroke-dasharray", "none");
  await comparison.screenshot({ path: info.outputPath("markers-solid-outlines.png") });
});

test("pointer travel retargets active markers and tooltip continuously, then settles and disables immediately", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/recipes.html");
  await page.getByLabel("Motion", { exact: true }).check();
  await page.clock.runFor(1100);
  const section = page.getByRole("region", { name: "Dots", exact: true });
  await section.scrollIntoViewIfNeeded();
  const points = await section.locator(".recharts-line-dot").evaluateAll((dots) =>
    dots.map((dot) => {
      const rect = dot.getBoundingClientRect();
      return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        cx: Number(dot.getAttribute("cx")),
      };
    }),
  );
  const start = points[1];
  const end = points[5];
  const middle = points[3];
  if (!start || !end || !middle) throw new Error("Missing sample coordinates");
  await page.mouse.move(start.x, start.y);
  await page.clock.runFor(1500);
  const marker = section.locator('[data-kind-ui="active-marker"]');
  await expect(marker).toHaveCount(1);
  const first = Number.parseFloat((await marker.getAttribute("cx")) ?? "NaN");
  const movingTooltip = section.locator('[data-kind-ui="tooltip-motion"]');
  const readX = () =>
    movingTooltip.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
  const firstTooltipX = await readX();
  await page.mouse.move(end.x, end.y);
  await page.clock.runFor(80);
  const moving = Number.parseFloat((await marker.getAttribute("cx")) ?? "NaN");
  expect(moving).toBeGreaterThan(first);
  expect(moving).toBeLessThan(end.cx);
  const movingTooltipX = await readX();
  const svgWidth = await section
    .getByRole("application")
    .evaluate((node) => node.getBoundingClientRect().width);
  const tipWidth = await movingTooltip.evaluate((node) => node.getBoundingClientRect().width);
  const endTooltipX = Math.max(0, Math.min(Math.round(end.cx) + 12, svgWidth - tipWidth));
  expect(movingTooltipX).toBeGreaterThan(firstTooltipX);
  expect(movingTooltipX).toBeLessThan(endTooltipX);
  // Change preferences in flight without supplying another coordinate.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "off");
  await page.clock.runFor(32);
  expect(Number.parseFloat((await marker.getAttribute("cx")) ?? "NaN")).toBeCloseTo(end.cx, 1);
  expect(await readX()).toBeCloseTo(endTooltipX, 1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "on");
  await page.mouse.move(start.x, start.y);
  await page.clock.runFor(80);
  await page
    .getByLabel("Motion", { exact: true })
    .evaluate((node) => (node as HTMLInputElement).click());
  await page.clock.runFor(32);
  expect(Number.parseFloat((await marker.getAttribute("cx")) ?? "NaN")).toBeCloseTo(start.cx, 1);
  expect(await readX()).toBeCloseTo(firstTooltipX, 1);
  await page
    .getByLabel("Motion", { exact: true })
    .evaluate((node) => (node as HTMLInputElement).click());
  await page.mouse.move(end.x, end.y);
  await page.clock.runFor(80);
  // Interrupt before settling: Motion must retarget, without a queued stale endpoint.
  await page.mouse.move(middle.x, middle.y);
  await page.clock.runFor(1500);
  await expect
    .poll(async () => Number.parseFloat((await marker.getAttribute("cx")) ?? "NaN"))
    .toBeCloseTo(middle.cx, 1);
  await expect(section.getByRole("status")).toContainText("Thu");
  const middleTooltipX = Math.max(0, Math.min(middle.cx + 12, svgWidth - tipWidth));
  // Mouse coordinates are rounded to device pixels by the browser/engine.
  expect(Math.abs((await readX()) - middleTooltipX)).toBeLessThanOrEqual(1);
  const tooltip = section.locator('[data-kind-ui="tooltip-motion"]');
  const tooltipBox = await tooltip.boundingBox();
  const chartBox = await section.getByRole("application").boundingBox();
  expect(
    tooltipBox &&
      chartBox &&
      tooltipBox.x >= chartBox.x &&
      tooltipBox.x + tooltipBox.width <= chartBox.x + chartBox.width + 1,
  ).toBeTruthy();
  await section.screenshot({ path: info.outputPath("pointer-hover.png") });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(end.x, end.y);
  await page.clock.runFor(32);
  await expect
    .poll(async () => Number.parseFloat((await marker.getAttribute("cx")) ?? "NaN"))
    .toBeCloseTo(end.cx, 1);
  expect(await readX()).toBeCloseTo(endTooltipX, 1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByLabel("Motion", { exact: true }).uncheck();
  await section.scrollIntoViewIfNeeded();
  const staticPoint = await section.locator(".recharts-line-dot").nth(1).boundingBox();
  if (!staticPoint) throw new Error("Missing static sample");
  await page.mouse.move(
    staticPoint.x + staticPoint.width / 2,
    staticPoint.y + staticPoint.height / 2,
  );
  await page.clock.runFor(32);
  await expect
    .poll(async () => Number.parseFloat((await marker.getAttribute("cx")) ?? "NaN"))
    .toBeCloseTo(start.cx, 1);
  await page.mouse.move(0, 0);
  await expect(section.getByRole("status")).not.toBeVisible();
});

test("existing line recipes expose materials alongside palette, motion and visibility", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/recipes.html");
  const controls = page.getByRole("group", { name: "Line material", exact: true });
  const curves = page.locator(".recipe-stack .recharts-line-curve");
  const filters = page.locator(".recipe-stack filter");
  await expect(curves).toHaveCount(9);
  const geometry = await curves.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  const markerWidths = await page
    .locator(".recipe-stack .recharts-line-dot")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("stroke-width")));
  await expect(controls.getByRole("button", { name: "Plain", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(filters).toHaveCount(0);
  for (const material of ["paper", "clay", "glow"] as const) {
    await controls
      .getByRole("button", {
        name: material === "paper" ? "Paper" : material === "clay" ? "Clay" : "Glow",
        exact: true,
      })
      .click();
    await expect(page.locator("main")).toHaveAttribute("data-material", material);
    await expect(
      page.locator(`.recipe-stack [data-kind-ui="line-material"][data-material="${material}"]`),
    ).toHaveCount(9);
    expect(
      await curves.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
    ).toEqual(geometry);
    expect(
      await page
        .locator(".recipe-stack .recharts-line-dot")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("stroke-width"))),
    ).toEqual(markerWidths);
    await expect(curves.first()).toHaveAttribute(
      "stroke-width",
      material === "clay" ? "6" : material === "paper" ? "2.5" : "3",
    );
    await page.screenshot({
      path: info.outputPath(`recipes-${material}-mono-normal.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Color", exact: true }).click();
    await page.screenshot({
      path: info.outputPath(`recipes-${material}-color-normal.png`),
      fullPage: true,
    });
    await page
      .getByRole("region", { name: "Smooth", exact: true })
      .screenshot({ path: info.outputPath(`recipes-${material}-color-normal-detail.png`) });
    expect(await curves.first().evaluate((node) => getComputedStyle(node).stroke)).toBe(
      "rgb(124, 58, 237)",
    );
    await page.setViewportSize({ width: 320, height: 800 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await page.screenshot({
      path: info.outputPath(`recipes-${material}-color-narrow.png`),
      fullPage: true,
    });
    await page
      .getByRole("region", { name: "Smooth", exact: true })
      .screenshot({ path: info.outputPath(`recipes-${material}-color-narrow-detail.png`) });
    await page.getByRole("button", { name: "Monochrome", exact: true }).click();
    await page.screenshot({
      path: info.outputPath(`recipes-${material}-mono-narrow.png`),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1000, height: 900 });
  }
  const comparison = page.getByRole("region", { name: "Week over week" });
  await comparison.getByRole("button", { name: "Last week", exact: true }).click();
  await controls.getByRole("button", { name: "Paper", exact: true }).click();
  await expect(comparison.getByRole("button", { name: "Last week", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(filters).toHaveCount(8);
  await comparison.getByRole("button", { name: "Last week", exact: true }).click();
  await expect(filters).toHaveCount(9);
  await comparison.getByText("View data", { exact: true }).click();
  await expect(comparison.getByRole("row", { name: "Thu 0 tasks 16 tasks" })).toBeVisible();
  await page.getByLabel("Motion", { exact: true }).check();
  await expect(page.locator("main")).toHaveAttribute("data-motion", "off");
  await page.screenshot({ path: info.outputPath("recipes-paper-reduced.png"), fullPage: true });
  // The screenshots/visibility controls have already interacted with charts. Remount for a fresh entrance.
  await page.getByLabel("Empty data", { exact: true }).check();
  await page.getByLabel("Empty data", { exact: true }).uncheck();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("main")).toHaveAttribute("data-motion", "on");
  await expect(page.locator('.recipe-stack clipPath[id$="-reveal"] rect')).toHaveCount(8);
  await controls.getByRole("button", { name: "Clay", exact: true }).click();
  await expect(filters).toHaveCount(9);
  await expect
    .poll(async () =>
      Number.parseFloat(
        (await page
          .locator('.recipe-stack clipPath[id$="-reveal"] rect')
          .first()
          .getAttribute("width")) ?? "NaN",
      ),
    )
    .toBe(100);
  await page.screenshot({ path: info.outputPath("recipes-clay-motion.png"), fullPage: true });
  await page.getByLabel("Motion", { exact: true }).uncheck();
  await expect(page.locator('.recipe-stack clipPath[id$="-reveal"]')).toHaveCount(0);
  await controls.getByRole("button", { name: "Plain", exact: true }).click();
  await expect(filters).toHaveCount(0);
  await page.getByLabel("Empty data", { exact: true }).check();
  await expect(page.locator(".recipe-stack").getByRole("application")).toHaveCount(0);
  await expect(filters).toHaveCount(0);
  await page.getByLabel("Empty data", { exact: true }).uncheck();
  await expect(page.locator(".recipe-stack").getByRole("application")).toHaveCount(8);
  expect(errors).toEqual([]);
});

test("dotted guide toggles independently from the compact tooltip", async ({ page }, info) => {
  await page.goto("/recipes.html");
  const region = page.getByRole("region", { name: "Smooth", exact: true });
  const chart = region.getByRole("application");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(region.getByRole("status")).toContainText("Completed");
  await expect(region.locator(".recharts-tooltip-cursor")).toHaveCount(0);
  await page.getByLabel("Hover guide", { exact: true }).check();
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(region.locator(".recharts-tooltip-cursor")).toHaveAttribute(
    "stroke-dasharray",
    "2 4",
  );
  await expect(region.getByRole("status")).toContainText("Completed");
  const tip = region.locator('[data-kind-ui="tooltip-frame"]');
  expect((await tip.boundingBox())?.width).toBeLessThan(180);
  expect(await region.getByRole("status").evaluate((node) => getComputedStyle(node).fontSize)).toBe(
    "12px",
  );
  await region.screenshot({ path: info.outputPath("tooltip-guide-normal.png") });
  await page.setViewportSize({ width: 320, height: 900 });
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  const bounds = await chart.boundingBox();
  const tooltip = await tip.boundingBox();
  expect(
    bounds &&
      tooltip &&
      tooltip.x >= bounds.x &&
      tooltip.x + tooltip.width <= bounds.x + bounds.width + 1,
  ).toBe(true);
  await region.screenshot({ path: info.outputPath("tooltip-guide-narrow.png") });
  await page.getByLabel("Hover guide", { exact: true }).uncheck();
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(region.locator(".recharts-tooltip-cursor")).toHaveCount(0);
  await expect(region.getByRole("status")).toBeVisible();
});

test("content-sized tooltip bounds use chart units inside a scaled host", async ({ page }) => {
  await page.goto("/recipes.html");
  const region = page.getByRole("region", { name: "Smooth", exact: true });
  await region.locator('[data-kind-ui="chart"]').evaluate((node) => {
    Object.assign((node as HTMLElement).style, {
      transform: "scale(0.5)",
      transformOrigin: "top left",
    });
  });
  const chart = region.getByRole("application");
  await chart.focus();
  for (let index = 0; index < 7; index++) await page.keyboard.press("ArrowRight");
  await expect(region.getByRole("status")).toContainText("48 tasks");
  await expect
    .poll(async () => {
      const bounds = await chart.boundingBox();
      const tooltip = await region.locator('[data-kind-ui="tooltip-frame"]').boundingBox();
      return (
        bounds &&
        tooltip &&
        tooltip.x >= bounds.x &&
        tooltip.x + tooltip.width <= bounds.x + bounds.width + 0.5
      );
    })
    .toBe(true);
});

test("point marker gallery keeps theme, keyboard inspection and data alternative in Line recipes", async ({
  page,
}) => {
  await page.goto("/recipes.html#point-markers");
  const gallery = page.getByRole("region", { name: "Point markers", exact: true });
  await expect(gallery.getByRole("application")).toHaveCount(3);
  await expect(gallery.getByRole("table")).toHaveAccessibleName("Monthly totals");
  await expect(gallery.getByRole("row", { name: "Feb 9", exact: true })).toBeVisible();
  const theme = gallery.getByRole("button", { name: "Toggle theme" });
  await expect(theme).toHaveAttribute("aria-pressed", "false");
  await theme.click();
  await expect(theme).toHaveAttribute("aria-pressed", "true");
  await expect(gallery).toHaveCSS("--kind-ui-chart-marker-surface", "#172033");
  const chart = gallery.getByRole("application", { name: "border markers", exact: true });
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(gallery.getByRole("status")).toContainText("Total");
  await page.getByLabel("Empty data", { exact: true }).check();
  await expect(gallery.getByRole("application")).toHaveCount(3);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
