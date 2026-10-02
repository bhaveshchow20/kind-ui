import { expect, test } from "./browser";

const variants = [
  "Vertical",
  "Horizontal",
  "Grouped",
  "Stacked",
  "Labels",
  "Custom labels",
  "Category colors",
  "Highlighted",
  "Signed",
  "Interactive",
];
for (const mode of ["static", "motion", "reduced"] as const) {
  test(`all ten bar variants support ${mode}, keyboard exploration and narrow layout`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    await page.goto("/bars.html");
    if (mode !== "static") await page.getByLabel("Motion", { exact: true }).check();
    const clips = page.locator("[data-kind-ui='bar-reveal']");
    await expect(clips).toHaveCount(mode === "motion" ? 12 : 0);
    if (mode === "motion") {
      await page.clock.runFor(150);
      for (const clip of await clips.all())
        expect(Number.parseFloat((await clip.getAttribute("height")) ?? "NaN")).toBeGreaterThan(0);
      const signed = page.getByRole("region", { name: "Signed", exact: true });
      const zero = Number(await signed.locator(".recharts-reference-line-line").getAttribute("y1"));
      const clipBounds = await signed.locator("[data-kind-ui='bar-reveal']").evaluate((node) => ({
        y: new DOMMatrix(getComputedStyle(node).transform).m42,
        height: Number.parseFloat(node.getAttribute("height") ?? "NaN"),
      }));
      expect(clipBounds.y).toBeLessThan(zero);
      expect(clipBounds.y + clipBounds.height).toBeGreaterThan(zero);
      await page.clock.runFor(1200);
      await expect(clips).toHaveCount(0);
    }
    for (const name of variants) {
      const region = page.getByRole("region", { name, exact: true });
      await region.getByRole("application").focus();
      await page.clock.runFor(32);
      await expect(region.getByRole("status")).toBeVisible();
      await expect(region.getByRole("status")).toContainText("tasks");
      await page.keyboard.press(
        name === "Horizontal" || name === "Custom labels" || name === "Category colors"
          ? "ArrowLeft"
          : "ArrowRight",
      );
      await page.clock.runFor(32);
      await expect(region.getByRole("status")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(region.getByRole("status")).not.toBeVisible();
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await page.clock.runFor(32);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    for (const name of variants) {
      const region = page.getByRole("region", { name, exact: true });
      const svg = region.getByRole("application");
      const box = await svg.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
      await svg.focus();
      await page.keyboard.press(
        name === "Horizontal" || name === "Custom labels" || name === "Category colors"
          ? "ArrowLeft"
          : "ArrowRight",
      );
      await page.clock.runFor(32);
      const tip = region.getByRole("status");
      if (name === "Vertical" || name === "Signed") {
        await expect(tip).not.toBeVisible();
        await page.keyboard.press("ArrowRight");
        await page.clock.runFor(32);
      }
      await expect(tip).toBeVisible();
      const tipBox = await tip.boundingBox();
      expect(tipBox?.x).toBeGreaterThanOrEqual(0);
      expect((tipBox?.x ?? 0) + (tipBox?.width ?? 0)).toBeLessThanOrEqual(320);
      await page.keyboard.press("Escape");
    }
    if (mode === "static") {
      await page.getByRole("button", { name: "Color", exact: true }).click();
      await page.screenshot({ path: info.outputPath("all-bars-mobile-color.png"), fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test("labels, category colors and controlled highlight remain truthful", async ({ page }, info) => {
  await page.goto("/bars.html");
  const labels = page.getByRole("region", { name: "Labels", exact: true });
  await expect(labels.locator(".recharts-label-list text")).toHaveText(["18", "26", "22", "34"]);
  await expect(labels.locator("[data-bar-zero-label]")).toHaveText("0");
  const zeroLabelX = Number(await labels.locator("[data-bar-zero-label]").getAttribute("x"));
  const zeroTickX = Number(
    await labels.getByRole("application").getByText("Thu", { exact: true }).getAttribute("x"),
  );
  expect(zeroLabelX).toBeCloseTo(zeroTickX, 5);

  const custom = page.getByRole("region", { name: "Custom labels", exact: true });
  await expect(custom.locator("[data-bar-category-label]")).toHaveText([
    "Chat",
    "Search",
    "Workflow",
    "Email",
  ]);
  await expect(custom.locator(".recharts-label-list").last().locator("text")).toHaveText([
    "42",
    "31",
    "24",
    "2",
  ]);
  await page.getByRole("button", { name: "Color", exact: true }).click();
  const colored = page.getByRole("region", { name: "Category colors", exact: true });
  const fills = await colored
    .locator(".recharts-bar-rectangle path")
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill));
  expect(new Set(fills).size).toBe(4);
  await colored.getByRole("application").focus();
  await page.keyboard.press("ArrowLeft");
  const indicator = colored.locator(
    '[data-kind-ui="chart-tooltip"] [data-kind-ui="chart-indicator"]',
  );
  await expect(indicator).toHaveCSS("background-color", fills[1] ?? "");
  const highlighted = page.getByRole("region", { name: "Highlighted", exact: true });
  await expect(highlighted.locator('[data-highlighted="true"]')).toHaveCount(1);
  await highlighted.getByRole("combobox").selectOption("Fri");
  await expect(highlighted.locator('[data-highlighted="true"]')).toHaveCount(1);
  const selected = await highlighted.locator('[data-highlighted="true"]').boundingBox();
  const last = await highlighted.locator(".recharts-bar-rectangle path").last().boundingBox();
  expect(selected?.x).toBe(last?.x);
  await page
    .locator("main")
    .evaluate((node) => (node as HTMLElement).style.setProperty("--chart-1", "#004f9e"));
  await expect(labels.locator(".recharts-bar-rectangle path").first()).toHaveCSS(
    "fill",
    "rgb(0, 79, 158)",
  );
  await page.setViewportSize({ width: 320, height: 800 });
  for (const node of await custom
    .locator("[data-bar-category-label], .recharts-label-list text")
    .all()) {
    const box = await node.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  }
  await expect(custom.locator("[data-bar-category-label]").last()).toHaveCSS(
    "fill",
    "rgb(24, 24, 24)",
  );
  await custom.screenshot({ path: info.outputPath("custom-labels-mobile.png") });
});

test("signed bars cover positive, negative, missing and zero without changing the baseline", async ({
  page,
}, info) => {
  await page.goto("/bars.html");
  const region = page.getByRole("region", { name: "Signed", exact: true });
  const baseline = () =>
    region.locator(".recharts-reference-line-line").getAttribute("y1").then(Number);
  const geometry = () =>
    region.locator(".recharts-bar-rectangle path").evaluateAll((nodes) =>
      nodes.map((node) => {
        const { y, height } = (node as SVGGraphicsElement).getBBox();
        return { y, height };
      }),
    );
  const zero = await baseline();
  const bars = await geometry();
  expect(bars).toHaveLength(4);
  expect(bars[0]?.y).toBeLessThan(zero);
  expect(bars[1]?.y).toBeCloseTo(zero, 1);
  expect(bars[2]?.y).toBeCloseTo(zero, 1);
  await region.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(region.getByRole("status")).toContainText("-12 tasks");
  await page.keyboard.press("ArrowRight");
  await expect(region.getByRole("status")).not.toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(region.getByRole("status")).toContainText("0 tasks");
  await region.getByLabel("Values").selectOption("negative");
  for (const bar of await geometry()) {
    expect(bar.y).toBeCloseTo(await baseline(), 1);
    expect(bar.height).toBeGreaterThan(0);
  }
  await region.getByLabel("Values").selectOption("zero");
  expect((await geometry()).filter((bar) => bar.height > 0)).toHaveLength(0);
  await region.getByLabel("Values").selectOption("mixed");
  await expect(region.locator(".recharts-bar-rectangle path")).toHaveCount(4);
  await region.screenshot({ path: info.outputPath("signed-bars.png") });
});

test("dense series selection updates bars, totals and tooltips without restarting motion", async ({
  page,
}, info) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/bars.html");
  await page.getByLabel("Motion", { exact: true }).check();
  const region = page.getByRole("region", { name: "Interactive", exact: true });
  const clip = region.locator("[data-kind-ui='bar-reveal']");
  await page.clock.runFor(200);
  await region.getByRole("button", { name: /^Assisted/ }).focus();
  await page.keyboard.press("Space");
  await expect(region.getByRole("button", { name: /^Assisted/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.clock.runFor(1200);
  await expect(clip).toHaveCount(0);
  await expect(region.locator(".recharts-bar-rectangle path")).toHaveCount(90);
  await region.getByRole("application").focus();
  await page.clock.runFor(32);
  await expect(region.getByRole("status")).toContainText("Apr 1");
  await expect(region.getByRole("status")).toContainText("15 tasks");
  await region.getByRole("button", { name: /^Automated/ }).click();
  await expect(clip).toHaveCount(0);
  await region.getByRole("application").focus();
  await page.clock.runFor(32);
  await page.keyboard.press("ArrowRight");
  await page.clock.runFor(32);
  await expect(region.getByRole("status")).toContainText("37 tasks");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await region.getByRole("button", { name: /^Assisted/ }).click();
  await region.getByRole("application").focus();
  await page.clock.runFor(32);
  await page.keyboard.press("ArrowRight");
  await page.clock.runFor(32);
  await expect(region.getByRole("status")).toContainText("61 tasks");
  await page.keyboard.press("Escape");
  await region.getByRole("heading", { name: "Interactive", exact: true }).click();
  await region.screenshot({ path: info.outputPath("compact-series-buttons.png") });
});
