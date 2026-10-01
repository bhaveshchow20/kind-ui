import { expect, type Locator, test } from "@playwright/test";

async function bounded(tip: Locator, chart: Locator) {
  await expect
    .poll(async () => {
      const a = await tip.boundingBox();
      const b = await chart.boundingBox();
      return Boolean(
        a &&
          b &&
          a.x >= b.x - 1 &&
          a.y >= b.y - 1 &&
          a.x + a.width <= b.x + b.width + 1 &&
          a.y + a.height <= b.y + b.height + 1,
      );
    })
    .toBe(true);
}

for (const mode of ["static", "motion"] as const) {
  test(`packed area ${mode}: native refs, gaps, zero, composition, handlers and bounded modality`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${mode === "static" ? 4181 : 4182}/${mode}.html`);
    const chart = page.getByRole("application", { name: "Packed chart" });
    await expect(chart).toHaveAttribute("data-ref-tag", "svg");
    await expect(page.locator(".recharts-area-area")).toHaveCount(2);
    await expect(page.locator("[data-host-mark]")).toHaveCount(3);
    await expect(page.locator("[data-host-shape]")).toHaveCount(1);
    await expect(page.locator(".recharts-label-list text")).toHaveCount(3);
    await expect(page.locator(".recharts-reference-line")).toHaveCount(1);
    await expect(page.locator(".recharts-area-area").first()).toHaveAttribute(
      "fill",
      "url(#packed-gradient)",
    );
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText("No data");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText("0 units");
    await bounded(page.locator('[data-kind-ui="tooltip-frame"]'), chart);
    await expect(page.locator('[data-kind-ui="tooltip-frame"]')).toHaveAttribute(
      "data-ref-tag",
      "DIV",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("status")).not.toBeVisible();
    const mark = page.locator("[data-host-mark]").last();
    const box = await mark.boundingBox();
    if (!box) throw new Error("No visible mark");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByRole("status")).toContainText("7 units");
    await bounded(page.locator('[data-kind-ui="tooltip-frame"]'), chart);
    await page.locator(".recharts-area-area").first().dispatchEvent("click");
    await expect(page.getByRole("note", { name: "Events" })).toHaveText(/\d+\/\d+\/1/);
    await page.getByRole("button", { name: "Other", exact: true }).click();
    await expect(page.locator(".recharts-area-area")).toHaveCount(1);
    await page.getByRole("button", { name: "Rename series" }).click();
    await expect(page.locator(".recharts-area-area")).toHaveCount(2);
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText("Renamed");
    await page.getByLabel("Series data").check();
    await expect(page.locator("[data-host-mark]")).toHaveCount(3);
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await bounded(page.locator('[data-kind-ui="tooltip-frame"]'), chart);
    await page.screenshot({ path: info.outputPath(`packed-area-${mode}.png`) });
    expect(errors).toEqual([]);
  });
}

test("packed area motion cancels on native hide, controlled visibility, data, resize and reduced preference", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const clip = page.locator("[data-area-reveal]");
  for (const change of ["Native hide other", "Other", "Update", "Resize", "reduced"]) {
    await page.goto("http://127.0.0.1:4182/motion.html?native-visibility");
    await page.clock.runFor(120);
    const width = Number.parseFloat((await clip.getAttribute("width")) ?? "NaN");
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThan(100);
    if (change === "reduced") await page.emulateMedia({ reducedMotion: "reduce" });
    else if (change === "Native hide other")
      await page.getByLabel(change).evaluate((node) => (node as HTMLInputElement).click());
    else
      await page
        .getByRole("button", { name: change, exact: true })
        .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(clip).toHaveCount(0);
  }
});

test("packed area keeps stateful custom content and refs while changing animation mode", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("http://127.0.0.1:4182/motion.html");
  await page.getByRole("button", { name: "Custom content" }).click();
  await page.getByRole("application").focus();
  await page
    .getByRole("button", { name: "Content count 0" })
    .evaluate((node) => (node as HTMLButtonElement).click());
  const state = page.getByRole("button", { name: "Content count 1" });
  const before = await page.locator("body").getAttribute("data-tooltip-attachments");
  await page
    .getByLabel("Animate", { exact: true })
    .evaluate((node) => (node as HTMLInputElement).click());
  await expect(state).toHaveCount(1);
  await page.getByLabel("Default animation").evaluate((node) => (node as HTMLInputElement).click());
  await page
    .getByLabel("Animate", { exact: true })
    .evaluate((node) => (node as HTMLInputElement).click());
  await expect(state).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(state).toHaveCount(1);
  expect(await page.locator("body").getAttribute("data-tooltip-attachments")).toBe(before);
});

test("packed native area visibility snaps active marks to rescaled geometry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4182/motion.html?native-visibility");
  const toggle = page.getByLabel("Native hide other");
  await toggle.evaluate((node) => (node as HTMLInputElement).click());
  const point = page.locator("[data-host-mark]").first();
  const box = await point.boundingBox();
  if (!box) throw new Error("Missing area point");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.clock.runFor(500);
  const marker = page.locator('[data-kind-ui="active-marker"]').first();
  const before = Number(await point.getAttribute("cy"));
  expect(Number(await marker.getAttribute("cy"))).toBeCloseTo(before, 1);
  for (const hidden of [false, true]) {
    await toggle.evaluate((node) => (node as HTMLInputElement).click());
    await page.clock.runFor(32);
    const target = Number(await point.getAttribute("cy"));
    if (!hidden) expect(Math.abs(target - before)).toBeGreaterThan(20);
    expect(Number(await marker.getAttribute("cy"))).toBeCloseTo(target, 1);
    await bounded(page.locator('[data-kind-ui="tooltip-frame"]'), page.getByRole("application"));
  }
});
