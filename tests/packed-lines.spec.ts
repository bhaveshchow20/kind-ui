import { expect, type Locator, type Page, test } from "@playwright/test";

async function bounds(tip: Locator, chart: Locator) {
  const a = await tip.boundingBox();
  const b = await chart.boundingBox();
  expect(
    a &&
      b &&
      a.x >= b.x - 1 &&
      a.y >= b.y - 1 &&
      a.x + a.width <= b.x + b.width + 1 &&
      a.y + a.height <= b.y + b.height + 1,
  ).toBeTruthy();
}
async function points(page: Page) {
  return page.locator(".recharts-line-dot").evaluateAll((dots) =>
    dots.map((dot) => {
      const box = dot.getBoundingClientRect();
      return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        cx: Number(dot.getAttribute("cx")),
      };
    }),
  );
}
for (const variant of ["static", "motion"]) {
  test(`packed ${variant} owns registration, visibility, native extensions and bounded pointer/keyboard content`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${variant === "static" ? 4175 : 4176}/${variant}.html`);
    const chart = page.getByRole("application", { name: "Packed chart" });
    await expect(chart).toHaveAttribute("data-ref-tag", "svg");
    await expect(page.locator(".recharts-line-curve")).toHaveCount(2);
    await expect(page.locator(".host-shape")).toHaveCount(1);
    await expect(page.locator("[data-host-mark]")).toHaveCount(3); // Missing stays a gap; zero renders.
    await expect(page.locator(".recharts-label-list text")).toHaveCount(3);
    await expect(page.locator(".recharts-reference-line")).toHaveCount(1);
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText("No data");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText("0 units");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("status")).not.toBeVisible();
    const coords = await points(page);
    const last = coords.at(-1);
    if (!last) throw new Error("No engine points registered");
    await page.mouse.move(last.x, last.y);
    await expect(page.getByRole("status")).toBeVisible();
    const tip = page.locator('[data-kind-ui="tooltip-frame"]');
    await expect(tip).toHaveAttribute("data-ref-tag", "DIV");
    await bounds(tip, chart);
    await tip.dispatchEvent("mousedown");
    await expect(page.getByLabel("Events")).not.toHaveText("0/0/0");
    await page.locator(".host-shape").dispatchEvent("click");
    await expect(page.getByLabel("Events")).toHaveText(/\/2$/);
    await page.getByRole("button", { name: "Custom content" }).click();
    await chart.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("[data-host-content]")).toBeVisible();
    await bounds(tip, chart);
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await bounds(tip, chart);
    await page.getByRole("button", { name: "Value", exact: true }).click();
    await expect(page.locator(".recharts-line-curve")).toHaveCount(1);
    await expect(page.locator("[data-host-mark]")).toHaveCount(0);
    await page.getByRole("button", { name: "Custom content" }).click();
    await chart.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("status")).not.toContainText("Value");
    await page.getByRole("button", { name: "Other", exact: true }).click();
    await expect(page.locator(".recharts-line-curve")).toHaveCount(0);
    await expect(page.getByRole("status")).not.toBeVisible();
    await expect(page.locator("body")).not.toHaveAttribute("data-chart-ref-cleanup", "yes");
    await page.getByRole("button", { name: "Unmount chart" }).click();
    await expect(page.locator("body")).toHaveAttribute("data-chart-ref-cleanup", "yes");
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath(`packed-${variant}.png`) });
  });
  test(`packed ${variant} refreshes active series metadata without another input`, async ({
    page,
  }) => {
    await page.goto(`http://127.0.0.1:${variant === "static" ? 4175 : 4176}/${variant}.html`);
    await page.getByRole("application").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText("Other");
    await page
      .getByRole("button", { name: "Rename series" })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.getByRole("status")).toContainText("Renamed");
    await expect(page.getByRole("status")).not.toContainText("Other");
  });
}

test("packed Motion retargets marks and tooltip, snaps off reactively, and cancels entrance on updates/resizes", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4176/motion.html");
  await page.clock.runFor(120);
  const clip = page.locator("clipPath[id$='-reveal'] rect");
  const progress = Number.parseFloat((await clip.getAttribute("width")) ?? "NaN");
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(100);
  await page
    .getByRole("button", { name: "Update", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(clip).toHaveCount(0);
  await page.getByLabel("Series data", { exact: true }).check();
  await page.getByRole("button", { name: "Unmount chart" }).click();
  await page.getByRole("button", { name: "Unmount chart" }).click();
  await page.clock.runFor(120);
  await expect(clip).toHaveCount(1);
  await page
    .getByRole("button", { name: "Update", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(clip).toHaveCount(0);
  await page.reload();
  await page.clock.runFor(120);
  await expect(clip).toHaveCount(1);
  await page
    .getByRole("button", { name: "Resize", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(clip).toHaveCount(0);
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  const coords = await points(page);
  const start = coords[0];
  const end = coords[3];
  const middle = coords[2];
  if (!start || !end || !middle) throw new Error("Missing coordinates");
  await page.mouse.move(start.x, start.y);
  await page.clock.runFor(500);
  const marker = page.locator('[data-kind-ui="active-marker"]').last();
  const readX = () => marker.evaluate((node) => Number(node.getAttribute("cx")));
  const tip = page.locator('[data-kind-ui="tooltip-motion"]');
  const tooltipX = () =>
    tip.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
  const firstTipX = await tooltipX();
  // Geometry changes during active hover must snap, not animate from obsolete coordinates.
  await page
    .getByRole("button", { name: "Resize", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page.clock.runFor(32);
  const resizedX = await page.locator(".recharts-line-dot").first().getAttribute("cx");
  expect(await readX()).toBeLessThanOrEqual(160);
  expect(await readX()).toBeCloseTo(Number(resizedX), 1);
  await page
    .getByRole("button", { name: "Resize", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page.clock.runFor(32);
  await page
    .getByRole("button", { name: "Update", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page.clock.runFor(32);
  const targetY = Number(await page.locator(".recharts-line-dot").first().getAttribute("cy"));
  expect(Number(await marker.getAttribute("cy"))).toBeCloseTo(targetY, 1);
  await page
    .getByRole("button", { name: "Update", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page.clock.runFor(32);
  await page.mouse.move(start.x, start.y);
  await page.clock.runFor(500);
  await page.mouse.move(end.x, end.y);
  await page.clock.runFor(80);
  expect(await readX()).toBeGreaterThan(start.cx);
  expect(await readX()).toBeLessThan(end.cx);
  expect(await tooltipX()).toBeGreaterThan(firstTipX);
  await page.mouse.move(middle.x, middle.y);
  await page.clock.runFor(500);
  expect(await readX()).toBeCloseTo(middle.cx, 1);
  await page.mouse.move(end.x, end.y);
  await page.clock.runFor(80);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "off");
  await page.clock.runFor(32);
  expect(await readX()).toBeCloseTo(end.cx, 1);
  await bounds(page.locator('[data-kind-ui="tooltip-frame"]'), page.getByRole("application"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "on");
  await page.mouse.move(start.x, start.y);
  await page.clock.runFor(80);
  await page.getByLabel("Animate").evaluate((node) => (node as HTMLInputElement).click());
  await page.clock.runFor(32);
  expect(await readX()).toBeCloseTo(start.cx, 1);
  expect(await tooltipX()).toBeCloseTo(firstTipX, 1);
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await page.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toContainText("No data");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("status")).not.toBeVisible();
  await page.screenshot({ path: info.outputPath("packed-motion-interruption.png") });
});

test("the same packed components support false, true and config without losing customization", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4176/motion.html");
  const frame = page.locator('[data-kind-ui="line-frame"]');
  const clip = page.locator("clipPath[id$='-reveal'] rect");
  await page.getByLabel("Animate", { exact: true }).uncheck();
  await expect(frame).toHaveAttribute("data-motion", "off");
  await expect(clip).toHaveCount(0);
  await page.getByLabel("Default animation", { exact: true }).check();
  await page.getByLabel("Animate", { exact: true }).check();
  await page.clock.runFor(120);
  await expect(frame).toHaveAttribute("data-motion", "on");
  const progress = Number.parseFloat((await clip.getAttribute("width")) ?? "NaN");
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(100);
  await expect(page.locator(".host-shape")).toHaveCount(1);
  await expect(page.locator("[data-host-mark]")).toHaveCount(3);
  await expect(page.getByRole("application")).toHaveAttribute("data-ref-tag", "svg");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(frame).toHaveAttribute("data-motion", "off");
  await expect(clip).toHaveCount(0);
});

test("stateful packed tooltip content and refs survive mode, preference and geometry changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("http://127.0.0.1:4176/motion.html");
  await page.getByRole("button", { name: "Custom content", exact: true }).click();
  const coords = await points(page);
  const start = coords[0];
  if (!start) throw new Error("Missing coordinates");
  await page.mouse.move(start.x, start.y);
  await page
    .getByRole("button", { name: "Content count 0" })
    .evaluate((node) => (node as HTMLButtonElement).click());
  const content = page.getByRole("button", { name: "Content count 1" });
  const before = await page.locator("body").evaluate((node) => ({
    attaches: node.dataset.tooltipAttachments,
    cleanups: node.dataset.tooltipCleanups,
  }));
  await page
    .getByLabel("Animate", { exact: true })
    .evaluate((node) => (node as HTMLInputElement).click());
  await expect(content).toHaveCount(1);
  await page
    .getByLabel("Animate", { exact: true })
    .evaluate((node) => (node as HTMLInputElement).click());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const name of ["Resize", "Update"]) {
    await page
      .getByRole("button", { name, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(content).toHaveCount(1);
  }
  const after = await page.locator("body").evaluate((node) => ({
    attaches: node.dataset.tooltipAttachments,
    cleanups: node.dataset.tooltipCleanups,
  }));
  expect(after).toEqual(before);
});

test("packed native hide cancels entrance without changing Root visibility or data", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4176/motion.html?native-visibility");
  await page.clock.runFor(120);
  const clip = page.locator("clipPath[id$='-reveal'] rect");
  const progress = Number.parseFloat((await clip.getAttribute("width")) ?? "NaN");
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(100);
  await page.getByLabel("Native hide other").evaluate((node) => (node as HTMLInputElement).click());
  await expect(page.locator(".recharts-line-curve")).toHaveCount(1);
  await expect(clip).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Other", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("packed native visibility changes snap active hover to rescaled geometry", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4176/motion.html?native-visibility");
  const toggle = page.getByLabel("Native hide other");
  await toggle.evaluate((node) => (node as HTMLInputElement).click());
  const point = page.locator("[data-host-mark]").first();
  const box = await point.boundingBox();
  if (!box) throw new Error("Missing visible point");
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
    await bounds(page.locator('[data-kind-ui="tooltip-frame"]'), page.getByRole("application"));
  }
});
