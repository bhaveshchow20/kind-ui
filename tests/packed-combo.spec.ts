import { expect, test } from "./browser";

const url = "http://127.0.0.1:4186/combo.html";
test("packed Combo matches native mixed geometry, axes and signed stacks including zero/missing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const managed = page.getByRole("region", { name: "Managed", exact: true });
  const native = page.getByRole("region", { name: "Native", exact: true });
  const paths = (region: typeof managed) =>
    region
      .locator(".recharts-area-area, .recharts-line-curve, .recharts-bar-rectangle path")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  await expect(managed.locator(".recharts-line-curve")).toHaveCount(1);
  await expect.poll(() => paths(managed)).toEqual(await paths(native));
  for (const button of ["Update data", "Resize", "Change axis", "Change gap", "Change stack"]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect.poll(() => paths(managed)).toEqual(await paths(native));
  }
  expect(errors).toEqual([]);
});

test("shared tooltip, keyboard selection, ref, handlers and controlled legend", async ({
  page,
}) => {
  await page.goto(url);
  const managed = page.getByRole("region", { name: "Managed", exact: true });
  const chart = managed.getByRole("application");
  await page.getByRole("button", { name: "Focus via ref" }).click();
  await expect(chart).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(managed.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveCount(4);
  await page.keyboard.press("ArrowRight");
  await expect(managed.locator('[data-kind-ui="chart-tooltip"]')).toContainText("C");
  await expect(managed.locator('[data-kind-ui="chart-tooltip-value"]')).toHaveText([
    "0",
    "0",
    "0",
    "0",
  ]);
  await page.keyboard.press("ArrowRight");
  await expect(managed.locator('[data-kind-ui="chart-tooltip"]')).toHaveCount(0);
  await managed.getByRole("button", { name: "Area", exact: true }).click();
  await expect(managed.locator(".recharts-area-area")).toHaveCount(0);
  await expect(managed.getByRole("button", { name: "Area", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await chart.hover({ position: { x: 120, y: 80 } });
  await expect.poll(() => page.getByLabel("Events").textContent()).not.toBe("0");
  await expect(page.getByLabel("Ref")).toHaveText("svg");
  await expect(managed.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveCount(3);
});

for (const trigger of [
  "Update data",
  "Resize",
  "Change axis",
  "Change gap",
  "Change stack",
  "legend",
  "keyboard",
]) {
  test(`mixed Motion finishes safely on ${trigger}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(url);
    const managed = page.getByRole("region", { name: "Managed", exact: true });
    await expect(managed.locator('[data-combo-reveal="line"]')).toHaveCount(1);
    await expect(managed.locator('[data-combo-reveal="area"]')).toHaveCount(1);
    await expect(managed.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(2);
    if (trigger === "legend")
      await managed.getByRole("button", { name: "Bar", exact: true }).click();
    else if (trigger === "keyboard") {
      await managed.getByRole("application").focus();
      await page.keyboard.press("ArrowRight");
    } else await page.getByRole("button", { name: trigger, exact: true }).click();
    await expect(managed.locator('[data-combo-reveal], [data-kind-ui="bar-reveal"]')).toHaveCount(
      0,
    );
    await expect(managed.locator(".recharts-line-curve")).toHaveCount(1);
    expect(
      await managed
        .locator("path[d]")
        .evaluateAll((nodes) =>
          nodes.every((node) => !/NaN|Infinity/.test(node.getAttribute("d") ?? "")),
        ),
    ).toBe(true);
  });
}

test("family entrance opt-out and live reduced-motion disable all animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}?bar-off`);
  await expect(page.locator('[data-combo-reveal="line"]')).toHaveCount(1);
  await expect(page.locator('[data-combo-reveal="area"]')).toHaveCount(1);
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-combo-reveal], [data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByLabel("Animate", { exact: true }).uncheck();
  await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "off");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByLabel("Animate", { exact: true }).check();
  await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "off");
  await expect(page.locator('[data-combo-reveal], [data-kind-ui="bar-reveal"]')).toHaveCount(0);
});

test("independent family completion leaves longer entrances running", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto(`${url}?timings`);
  await expect(page.locator('[data-combo-reveal="line"]')).toHaveCount(1);
  await expect(page.locator('[data-combo-reveal="area"]')).toHaveCount(1);
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(2);
  await page.clock.runFor(500);
  await expect(page.locator('[data-combo-reveal="line"]')).toHaveCount(0);
  await expect(page.locator('[data-combo-reveal="area"]')).toHaveCount(1);
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(2);
  await page.clock.runFor(1000);
  await expect(page.locator('[data-combo-reveal="area"]')).toHaveCount(0);
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(2);
  await page.clock.runFor(1200);
  await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
});

test("hover and color updates preserve native DOM and never replay entrances", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  const managed = page.getByRole("region", { name: "Managed", exact: true });
  const chart = managed.getByRole("application");
  await chart.evaluate((node) => {
    node.setAttribute("data-stable-node", "yes");
  });
  await chart.hover({ position: { x: 120, y: 80 } });
  await expect(chart).toHaveAttribute("data-stable-node", "yes");
  await page.getByRole("button", { name: "Change color" }).click();
  await expect(chart).toHaveAttribute("data-stable-node", "yes");
  await expect(managed.locator('[data-combo-reveal], [data-kind-ui="bar-reveal"]')).toHaveCount(0);
  await expect(managed.locator('[data-kind-ui="chart"]')).toHaveAttribute(
    "style",
    /--color-area: #e11d48/,
  );
});

test("direction overrides are isolated to Combo line and area clips and release on resize", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}?directional`);
  const managed = page.getByRole("region", { name: "Managed", exact: true });
  await expect(managed.locator('[data-combo-reveal="line"]').locator("..")).toHaveAttribute(
    "data-reveal-direction",
    "right-to-left",
  );
  const areaClip = managed.locator('[data-combo-reveal="area"]').locator("..");
  await expect(areaClip).toHaveAttribute("data-reveal-direction", "edges-in");
  await expect(areaClip.locator("rect")).toHaveCount(2);
  await expect(managed.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(2);
  const paths = (region: typeof managed) =>
    region
      .locator(".recharts-line-curve, .recharts-area-area")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  const native = page.getByRole("region", { name: "Native", exact: true });
  await expect.poll(() => paths(managed)).toEqual(await paths(native));
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  await expect(managed.locator("clipPath[data-reveal-direction]")).toHaveCount(0);
  await expect.poll(() => paths(managed)).toEqual(await paths(native));
});
