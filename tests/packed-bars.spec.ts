import { expect, type Locator, test } from "./browser";
import { expectHiddenPaint } from "./interaction-paint";

const url = "http://127.0.0.1:4183";
const clips = '[data-kind-ui="bar-reveal"]';
async function bounds(tip: Locator, chart: Locator) {
  await expect
    .poll(async () => {
      const a = await tip.boundingBox(),
        b = await chart.boundingBox();
      return Boolean(
        a &&
          b &&
          a.x >= b.x - 1 &&
          a.y >= b.y - 1 &&
          a.x + a.width <= b.x + b.width + 1 &&
          a.y + a.height <= b.y + b.height + 1,
      );
    })
    .toBeTruthy();
}

test("packed bars preserve registration, semantics, native composition, refs and state", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  const chart = page.getByRole("application", { name: "Packed bar chart" });
  await expect(chart).toHaveAttribute("data-ref-tag", "svg");
  await expect(page.locator(".recharts-bar")).toHaveCount(2);
  await expect(page.locator("[data-host-shape]")).toHaveCount(2);
  await expect(page.locator(".recharts-label-list text")).toHaveText(["8", "-5", "0"]);
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toContainText("-5 units");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toContainText("No data");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("status")).toContainText("0 units");
  await expect(page.getByRole("status")).toContainText("Other");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("status")).not.toBeVisible();
  const marks = page.locator("[data-host-shape]");
  await marks.first().click();
  await expect(page.getByLabel("Events")).toContainText(/^1\//);
  await expect(page.locator('[data-kind-ui="tooltip-frame"]')).toHaveAttribute(
    "data-ref-tag",
    "DIV",
  );
  await bounds(page.locator('[data-kind-ui="tooltip-frame"]'), chart);
  await page
    .getByRole("button", { name: "Rename", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.getByRole("status")).toContainText("Alias");
  await expect(page.getByRole("status")).not.toContainText("Other");
  await page.getByRole("button", { name: "Value", exact: true }).click();
  await expect(page.locator("[data-host-shape]")).toHaveCount(2);
  await expectHiddenPaint(page.locator("[data-host-shape]"));
  await page.getByRole("button", { name: "Value", exact: true }).click();
  await page.getByRole("button", { name: "Stack", exact: true }).click();
  await expect(page.locator(".recharts-bar")).toHaveCount(2);
  await page.getByRole("button", { name: "Orientation", exact: true }).click();
  await expect(page.locator("[data-host-shape]")).toHaveCount(2);
  await page.getByRole("button", { name: "Custom content", exact: true }).click();
  await marks.first().hover();
  await expect(page.getByRole("button", { name: "Content count 0" })).toBeVisible();
  const frame = page.locator('[data-kind-ui="tooltip-frame"]');
  await bounds(frame, chart);
  await page
    .getByRole("button", { name: "Content count 0" })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page
    .getByRole("button", { name: "Native hide", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.getByRole("button", { name: "Content count 1" })).toBeVisible();
  for (const name of ["Native hide", "Value", "Animate", "Default animation"]) {
    await page
      .getByRole("button", { name, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.getByRole("button", { name: "Content count 1" })).toBeVisible();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Content count 1" })).toBeVisible();
  await page
    .getByRole("button", { name: "Resize", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await bounds(frame, chart);
  await expect(page.getByRole("button", { name: "Content count 1" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("packed-bars-native-content.png") });
  expect(errors).toEqual([]);
});

for (const horizontal of [false, true]) {
  test(`packed signed ${horizontal ? "horizontal" : "vertical"} bar reveal uses native custom axis zero and settles on geometry/visibility`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(horizontal ? `${url}/?horizontal` : url);
    // Enabling without moving the pointer into the chart keeps the reveal observable.
    await page
      .getByRole("button", { name: "Animate", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(clips)).toHaveCount(2);
    await page.clock.runFor(120);
    const line = page.locator(".recharts-reference-line-line");
    const zero = Number(await line.getAttribute(horizontal ? "x1" : "y1"));
    const clip = page.locator(clips).first();
    const early = await clip.evaluate((node, horizontal) => {
      const matrix = new DOMMatrix(getComputedStyle(node).transform);
      return {
        start: horizontal ? matrix.m41 : matrix.m42,
        size: Number.parseFloat(node.getAttribute(horizontal ? "width" : "height") ?? "NaN"),
      };
    }, horizontal);
    expect(early.start).toBeLessThan(zero);
    expect(early.start + early.size).toBeGreaterThan(zero);
    await page.clock.runFor(160);
    expect(
      Number.parseFloat((await clip.getAttribute(horizontal ? "width" : "height")) ?? "NaN"),
    ).toBeGreaterThan(early.size);
    await page
      .getByRole("button", { name: "Native hide", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(clips)).toHaveCount(0);
    await expect(page.locator(".recharts-bar")).toHaveCount(2);
    await page
      .getByRole("button", { name: "Native hide", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(clips)).toHaveCount(0);
    await expect(page.locator(".recharts-bar")).toHaveCount(2);
    await page.getByRole("application").focus();
    await page.keyboard.press(horizontal ? "ArrowLeft" : "ArrowRight");
    await expect(page.getByRole("status")).toContainText("-5 units");
  });
}

test("packed bar tooltip retargets, reduces and switches off without remounting content", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  await page.getByRole("button", { name: "Default animation", exact: true }).click();
  const chart = page.getByRole("application");
  const box = await chart.boundingBox();
  if (!box) throw new Error("No chart bounds");
  await page.mouse.move(box.x + 90, box.y + 60);
  await expect(page.locator(clips)).toHaveCount(0);
  const tip = page.locator('[data-kind-ui="tooltip-frame"]');
  await expect(tip).toBeVisible();
  await page.clock.runFor(1000);
  const first = await tip.boundingBox();
  await page.mouse.move(box.x + box.width - 35, box.y + box.height - 35);
  await page.clock.runFor(80);
  const mid = await tip.boundingBox();
  expect(mid?.x).toBeGreaterThan(first?.x ?? 0);
  await bounds(tip, chart);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "off");
  await page.clock.runFor(32);
  const final = await tip.boundingBox();
  await page.clock.runFor(1000);
  expect((await tip.boundingBox())?.x).toBe(final?.x);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.mouse.move(box.x + 90, box.y + 60);
  await page.clock.runFor(80);
  await page
    .getByRole("button", { name: "Animate", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page.clock.runFor(32);
  await bounds(tip, chart);
  await expect(page.locator(clips)).toHaveCount(0);
});

for (const control of ["Data key", "Domain", "Stack", "Resize", "Update", "Value"]) {
  test(`packed bar ${control} interrupts entrance without pointer or focus`, async ({ page }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${url}/?fixed-zero`);
    await page
      .getByRole("button", { name: "Animate", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(clips)).toHaveCount(2);
    await page.clock.runFor(100);
    await page
      .getByRole("button", { name: control, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(clips)).toHaveCount(0);
    await page.clock.runFor(1000);
    await expect(page.locator(clips)).toHaveCount(0);
  });
}

for (const reversed of [false, true]) {
  test(`packed padded domain excludes zero and starts at native ${reversed ? "reversed" : "normal"} baseline`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${url}/?exclude-zero${reversed ? "&reversed" : ""}`);
    await page
      .getByRole("button", { name: "Animate", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(clips)).toHaveCount(2);
    const clip = page.locator(clips).first();
    const baseline = await page
      .locator(".recharts-bar")
      .last()
      .locator(".recharts-bar-rectangle path")
      .first()
      .evaluate((node, reversed) => {
        const box = (node as SVGGraphicsElement).getBBox();
        return reversed ? box.y : box.y + box.height;
      }, reversed);
    const initial = await clip.evaluate(
      (node) => new DOMMatrix(getComputedStyle(node).transform).m42,
    );
    expect(Math.abs(initial - baseline)).toBeLessThan(0.01);
    await page.clock.runFor(120);
    const size = Number.parseFloat((await clip.getAttribute("height")) ?? "NaN");
    expect(size).toBeGreaterThan(0);
  });
}

test("packed controlled function dataKey requires a metadata identity", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}/?missing-key`);
  await expect
    .poll(() =>
      errors.some((message) =>
        message.includes("BarSeries requires seriesKey for controlled non-string dataKey"),
      ),
    )
    .toBe(true);
});

for (const horizontal of [false, true]) {
  test(`packed categorical ${horizontal ? "Y" : "X"} padding cancels entrance without pointer or focus`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(horizontal ? `${url}/?horizontal&fixed-zero` : `${url}/?fixed-zero`);
    const mark = page.locator("[data-host-shape]").first();
    const geometry = () =>
      mark.evaluate((node) => {
        const box = (node as SVGGraphicsElement).getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      });
    const before = await geometry();
    await page
      .getByRole("button", { name: "Animate", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(clips)).toHaveCount(2);
    await page.clock.runFor(100);
    await page
      .getByRole("button", { name: "Category padding", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect
      .poll(async () => (horizontal ? (await geometry()).height : (await geometry()).width))
      .toBeLessThan(horizontal ? before.height : before.width);
    const after = await geometry();
    expect(horizontal ? after.y : after.x).toBeGreaterThan(horizontal ? before.y : before.x);
    await expect(page.locator(clips)).toHaveCount(0);
    await expect(page.getByLabel("Events")).toHaveText("0/0/0");
    await page.clock.runFor(1200);
    await expect(page.locator(clips)).toHaveCount(0);
    await page.getByRole("application").focus();
    await page.keyboard.press(horizontal ? "ArrowLeft" : "ArrowRight");
    await expect(page.getByRole("status")).toContainText("-5 units");
  });
}

for (const horizontal of [false, true]) {
  test(`packed numeric ${horizontal ? "X" : "Y"} scale change cancels entrance without pointer or focus`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(horizontal ? `${url}/?horizontal&fixed-zero` : `${url}/?fixed-zero`);
    const size = () =>
      page
        .locator("[data-host-shape]")
        .first()
        .evaluate((node, horizontal) => {
          const box = (node as SVGGraphicsElement).getBBox();
          return horizontal ? box.width : box.height;
        }, horizontal);
    const before = await size();
    await page
      .getByRole("button", { name: "Animate", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(clips)).toHaveCount(2);
    await page.clock.runFor(100);
    await page
      .getByRole("button", { name: "Numeric scale", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect.poll(size).toBeGreaterThan(before);
    await expect(page.locator(clips)).toHaveCount(0);
    await expect(page.getByLabel("Events")).toHaveText("0/0/0");
    await page.clock.runFor(1200);
    await expect(page.locator(clips)).toHaveCount(0);
  });
}
