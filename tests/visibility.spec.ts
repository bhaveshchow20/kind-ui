import { expect, type Locator, test } from "./browser";

async function alpha(path: Locator) {
  return path.evaluate((node) => {
    let opacity = 1;
    for (
      let current: Element | null = node;
      current && current instanceof SVGElement;
      current = current.parentElement
    )
      opacity *= Number(getComputedStyle(current).opacity);
    return opacity;
  });
}

test("packed restored series have a visibility transition in both toggle orders", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4176/motion.html");
  await page.clock.runFor(1200);
  for (const [name, selector] of [
    ["Other", ".recharts-line-curve:not(.host-shape)"],
    ["Value", ".host-shape"],
  ] as const) {
    const button = page.getByRole("button", { name, exact: true });
    await button.evaluate((node) => (node as HTMLButtonElement).click());
    await page.clock.runFor(400);
    await expect(page.locator(selector)).toHaveCount(0);
    await button.evaluate((node) => (node as HTMLButtonElement).click());
    await page.clock.runFor(40);
    expect(await alpha(page.locator(selector))).toBeGreaterThan(0);
    expect(await alpha(page.locator(selector))).toBeLessThan(1);
    await page.clock.runFor(400);
    expect(await alpha(page.locator(selector))).toBe(1);
  }
});

test("comparison chart stays mounted through rejected last-hide", async ({ page }) => {
  await page.goto("/recipes.html");
  const comparison = page.getByRole("region", { name: "Week over week" });
  const svg = await comparison.getByRole("application").elementHandle();
  if (!svg) throw new Error("Missing chart SVG");
  await comparison.getByRole("button", { name: "This week", exact: true }).click();
  await comparison.getByRole("button", { name: "Last week", exact: true }).click();
  expect(await svg.evaluate((node) => node.isConnected)).toBe(true);
  await expect(comparison.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
    "At least one item must remain visible.",
  );
});

for (const mode of ["animated", "off", "reduced"] as const) {
  test(`packed visibility reversals and last-hide guard stay stable in ${mode} mode`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
    await page.clock.install();
    await page.goto("http://127.0.0.1:4176/motion.html");
    if (mode === "off") await page.getByLabel("Animate", { exact: true }).uncheck();
    await page.clock.runFor(1200);
    const chart = page.getByRole("application");
    const svg = await chart.elementHandle();
    if (!svg) throw new Error("Missing chart SVG");
    const value = page.getByRole("button", { name: "Value", exact: true });
    const other = page.getByRole("button", { name: "Other", exact: true });
    const curve = page.locator(".host-shape");
    const click = async (button: Locator) =>
      button.evaluate((node) => (node as HTMLButtonElement).click());
    // Hide, reverse, then hide again before the first exit can complete.
    await click(value);
    await page.clock.runFor(40);
    if (mode === "animated") {
      expect(await alpha(curve)).toBeGreaterThan(0);
      expect(await alpha(curve)).toBeLessThan(1);
    } else await expect(curve).toHaveCount(0);
    await click(value);
    await page.clock.runFor(40);
    await click(value);
    await click(other);
    await page.clock.runFor(400);
    await expect(page.locator(".recharts-line-curve")).toHaveCount(1);
    await expect(other).toHaveAttribute("aria-pressed", "true");
    expect(await svg.evaluate((node) => node.isConnected)).toBe(true);
    for (const button of [value, other]) {
      if (button === other) {
        await click(other);
        await page.clock.runFor(400);
      }
      await click(button);
      await page.clock.runFor(40);
      const restored =
        button === value ? curve : page.locator(".recharts-line-curve:not(.host-shape)");
      expect(await alpha(restored)).toBeGreaterThan(0);
      if (mode === "animated") expect(await alpha(restored)).toBeLessThan(1);
      else expect(await alpha(restored)).toBe(1);
      await page.clock.runFor(400);
    }
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await page.clock.runFor(400);
    await expect(page.getByRole("status")).toContainText("Value");
    await click(value);
    await page.clock.runFor(40);
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText("Other");
    await expect(page.getByRole("status")).not.toContainText("Value");
    await expect(value).toHaveAttribute("aria-pressed", "false");
    await expect(value).toHaveCSS("text-decoration-line", "none");
    await page.screenshot({ path: info.outputPath(`visibility-${mode}-normal.png`) });
    await page.setViewportSize({ width: 320, height: 900 });
    await page.clock.runFor(400);
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await page.screenshot({ path: info.outputPath(`visibility-${mode}-narrow.png`) });
  });
}

test("exit completion snaps remaining marks after auto-domain rescaling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4176/motion.html?native-visibility");
  await page.clock.runFor(1200);
  const point = page.locator("[data-host-mark]").first();
  const box = await point.boundingBox();
  if (!box) throw new Error("Missing visible point");
  const before = Number(await point.getAttribute("cy"));
  await page
    .getByRole("button", { name: "Other", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page.clock.runFor(40);
  // A pointer input during exit restores hover motion after the initial visibility invalidation.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.clock.runFor(160);
  const target = Number(await point.getAttribute("cy"));
  expect(Math.abs(target - before)).toBeGreaterThan(20);
  const marker = page.locator('[data-kind-ui="active-marker"]').first();
  expect(Number(await marker.getAttribute("cy"))).toBeCloseTo(target, 1);
  await expect(page.getByRole("status")).not.toContainText("Other");
});
