import { expect, test } from "./browser.js";

test.beforeEach(async ({ page }) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`,
  );
});
const marks = "[data-kind-ui=emphasis-mark]";
const dimmed = "[data-emphasis=dimmed]";

test("native grouped/stacked category emphasis preserves opacity, materials and annotations", async ({
  page,
}) => {
  const plot = page.locator("#bars");
  await expect(plot.locator(marks)).toHaveCount(6);
  const first = plot.locator(".recharts-rectangle").first();
  const geometry = await first.getAttribute("d");
  const filter = await first.getAttribute("filter");
  await first.hover({ position: { x: 10, y: 10 } });
  await expect(plot.locator(dimmed)).toHaveCount(4);
  await expect(first).toHaveAttribute("opacity", "0.5");
  await expect(first).toHaveAttribute("d", geometry ?? "");
  await expect(first).toHaveAttribute("filter", filter ?? "");
  await expect(page.locator("#independent").locator(dimmed)).toHaveCount(0);
  expect(
    await plot
      .locator("text")
      .evaluateAll((nodes) =>
        nodes.every((node) => !node.closest("[data-kind-ui=emphasis-paint]")),
      ),
  ).toBe(true);
  await page.mouse.move(0, 0);
  await expect(plot.locator(dimmed)).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle stack" }).click();
  await plot
    .locator(".recharts-rectangle")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  await expect(plot.locator(dimmed)).toHaveCount(4);
  await plot
    .locator(".recharts-rectangle")
    .first()
    .click({ position: { x: 10, y: 10 } });
  await expect(page.locator("output")).toHaveText("1");
});

test("pointer to legend and leave restores baseline; clicks retain controlled visibility", async ({
  page,
}) => {
  const plot = page.locator("#bars");
  await plot
    .locator(".recharts-rectangle")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  await expect(plot.locator(dimmed)).toHaveCount(4);
  const second = plot.getByRole("button", { name: "Second", exact: true });
  await second.hover();
  await expect(plot.locator(dimmed)).toHaveCount(3);
  await page.mouse.move(0, 0);
  await expect(plot.locator(dimmed)).toHaveCount(0);
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "false");
  await expect(plot.locator(marks)).toHaveCount(3);
  await expect(plot.locator(dimmed)).toHaveCount(0);
});

test("native keyboard context survives hover/leave, Escape and blur clear transient emphasis", async ({
  page,
}) => {
  const plot = page.locator("#bars");
  await plot.locator(".recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await expect(plot.locator(dimmed)).toHaveCount(4);
  const baseline = await plot
    .locator(marks)
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-emphasis")));
  await plot
    .locator(".recharts-rectangle")
    .last()
    .hover({ position: { x: 10, y: 10 } });
  await page.mouse.move(0, 0);
  await expect
    .poll(() =>
      plot.locator(marks).evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-emphasis"))),
    )
    .toEqual(baseline);
  await page.keyboard.press("Escape");
  await expect(plot.locator(dimmed)).toHaveCount(0);
  await plot.getByRole("button", { name: "Second", exact: true }).focus();
  await expect(plot.locator(dimmed)).toHaveCount(3);
  await page.getByRole("button", { name: "Reorder", exact: true }).focus();
  await expect(plot.locator(dimmed)).toHaveCount(0);
});

test("stable IDs, removal, opt-out, custom portal and no-dim comparison compose", async ({
  page,
}) => {
  const plot = page.locator("#bars");
  await plot
    .locator(".recharts-rectangle")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  await expect(plot.locator(dimmed)).toHaveCount(4);
  // Dispatch a consumer update without moving the pointer out of the inspected category.
  await page
    .getByRole("button", { name: "Reorder", exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(plot.locator(dimmed)).toHaveCount(4);
  await page
    .getByRole("button", { name: "Remove A", exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(plot.locator(dimmed)).toHaveCount(0);
  await page.getByRole("button", { name: "Toggle emphasis", exact: true }).click();
  await plot
    .locator(".recharts-rectangle")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  await expect(plot.locator(dimmed)).toHaveCount(0);
  const custom = page.locator("#custom");
  await custom
    .locator("[data-custom=portal]")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  await expect(custom.locator(dimmed)).toHaveCount(1);
  await expect(custom.locator("[data-custom=portal]").first()).toHaveAttribute("opacity", "0.5");
  await page.locator("#line .recharts-line-curve").first().hover({ force: true });
  await expect(page.locator("#line").locator(marks)).toHaveCount(0);
});

test("donut sectors retain native geometry and baseline Cell opacity", async ({ page }) => {
  const plot = page.locator("#pie");
  const sectors = plot.locator("[data-kind-ui=pie-sector]");
  const paths = await sectors.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")));
  await sectors.first().hover({ position: { x: 150, y: 15 }, force: true });
  // Hit the actual visible sector rather than its donut bounding-box hole.

  await expect(plot.locator(dimmed)).toHaveCount(1);
  await expect(sectors.first()).toHaveAttribute("opacity", "0.4");
  expect(await sectors.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")))).toEqual(
    paths,
  );
  await page.mouse.move(0, 0);
  await expect(plot.locator(dimmed)).toHaveCount(0);
});

test("reduced motion and pointer cancel retain meaning without changing hit testing", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const plot = page.locator("#bars");
  await plot
    .locator(".recharts-rectangle")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  const paint = plot.locator(`${dimmed} > [data-kind-ui=emphasis-paint]`).first();
  await expect(paint).toHaveCSS("opacity", "0.28");
  await expect(paint).toHaveCSS("transition-duration", "0s");
  expect(await paint.evaluate((node) => getComputedStyle(node).pointerEvents)).not.toBe("none");
  await plot.locator(marks).first().dispatchEvent("pointercancel", { pointerType: "mouse" });
  await expect(plot.locator(dimmed)).toHaveCount(0);
});

test("touch uses existing click ownership and does not create focus emphasis", async ({ page }) => {
  const plot = page.locator("#bars");
  await plot.locator(marks).first().dispatchEvent("pointerenter", { pointerType: "touch" });
  await expect(plot.locator(dimmed)).toHaveCount(0);
  await plot.locator(".recharts-rectangle").first().dispatchEvent("click");
  await expect(page.locator("output")).toHaveText("1");
});

test("whole visible comparison falls back safe→sparse/custom→safe and matches native oracle", async ({
  page,
}) => {
  const plot = page.locator("#bars");
  const oracle = page.locator("#oracle");
  const geometry = () =>
    plot
      .locator(".recharts-rectangle")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")));
  const nativeGeometry = () =>
    oracle
      .locator(".recharts-rectangle")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")));
  const compare = async () => {
    expect(await geometry()).toEqual(await nativeGeometry());
    expect(await plot.locator(".recharts-label-list text").allTextContents()).toEqual(
      await oracle.locator(".recharts-label-list text").allTextContents(),
    );
  };
  await compare();
  await plot
    .locator(".recharts-rectangle")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  await expect(plot.locator(dimmed)).toHaveCount(4);
  await page
    .getByRole("button", { name: "Toggle sparse", exact: true })
    .evaluate((node: HTMLButtonElement) => node.click());
  await expect(plot.locator(marks)).toHaveCount(0);
  await compare();
  await page
    .getByRole("button", { name: "Toggle sparse", exact: true })
    .evaluate((node: HTMLButtonElement) => node.click());
  await expect(plot.locator(marks)).toHaveCount(6);
  await expect(plot.locator(dimmed)).toHaveCount(0);
  await compare();
  await page
    .getByRole("button", { name: "Toggle custom peer", exact: true })
    .evaluate((node: HTMLButtonElement) => node.click());
  await expect(plot.locator(marks)).toHaveCount(0);
  await compare();
  await page
    .getByRole("button", { name: "Toggle custom peer", exact: true })
    .evaluate((node: HTMLButtonElement) => node.click());
  await expect(plot.locator(marks)).toHaveCount(6);
  await expect(plot.locator(dimmed)).toHaveCount(0);
  await compare();
});

test("native hover+keyboard overlap stays aligned with engine inspection, without a second index", async ({
  page,
}) => {
  const plot = page.locator("#bars");
  await plot
    .locator(".recharts-rectangle")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  await plot.locator(".recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(plot.locator("[data-kind-ui=chart-tooltip]")).toContainText("A");
  const emphasis = await plot
    .locator(marks)
    .evaluateAll((nodes) =>
      nodes.map((n) => [
        n.getAttribute("data-emphasis"),
        n.querySelector("path")?.getAttribute("x"),
      ]),
    );
  const categoryA = await plot
    .locator(".recharts-rectangle")
    .evaluateAll((nodes) => [nodes[0]?.getAttribute("x"), nodes[3]?.getAttribute("x")]);
  expect(emphasis.filter(([state]) => state === "baseline").map(([, x]) => x)).toEqual(categoryA);
  await page.mouse.move(0, 0);
  await page.keyboard.press("Escape");
  await expect(plot.locator(dimmed)).toHaveCount(0);
});

test("pointer movement reclaims category after legend keyboard emphasis and restores it on leave", async ({
  page,
}) => {
  const plot = page.locator("#bars");
  const first = plot.locator(".recharts-rectangle").first();
  await first.hover({ position: { x: 10, y: 10 } });
  await page.keyboard.press("Tab");
  await plot.getByRole("button", { name: "Second", exact: true }).focus();
  await expect(plot.locator(dimmed)).toHaveCount(3);
  const box = await first.boundingBox();
  if (!box) throw new Error("Missing native mark");
  await page.mouse.move(box.x + 11, box.y + 11);
  await expect(plot.locator(dimmed)).toHaveCount(4);
  await page.mouse.move(0, 0);
  await expect(plot.locator(dimmed)).toHaveCount(3);
});

test("immediate sector exit clears across native remount without awaiting paint", async ({
  page,
}) => {
  for (let i = 0; i < 6; i++) {
    await page
      .locator("#pie [data-kind-ui=pie-sector]")
      .first()
      .hover({ position: { x: 150, y: 15 }, force: true });
    await page.mouse.move(0, 0);
    await expect(page.locator("#pie").locator(dimmed)).toHaveCount(0);
  }
});

test("default Bar and index-only opt-in stay native; explicit stable identity enables category comparison", async ({
  page,
}) => {
  await expect(page.locator("#independent").locator(marks)).toHaveCount(0);
  await expect(page.locator("#index-default").locator(marks)).toHaveCount(0);
  const explicit = page.locator("#index-explicit");
  await expect(explicit.locator(marks)).toHaveCount(6);
  await explicit
    .locator(".recharts-rectangle")
    .first()
    .hover({ position: { x: 10, y: 10 } });
  await expect(explicit.locator(dimmed)).toHaveCount(4);
});

test.describe("native touch", () => {
  test.use({ hasTouch: true });
  test("tap invokes the consumer once and legend touch focus leaves emphasis at baseline", async ({
    page,
  }) => {
    const plot = page.locator("#bars");
    const box = await plot.locator(".recharts-rectangle").first().boundingBox();
    if (!box) throw new Error("Missing native mark");
    await page.touchscreen.tap(box.x + 10, box.y + 10);
    await expect(page.locator("output")).toHaveText("1");
    await expect(plot.locator(dimmed)).toHaveCount(0);
    const second = plot.getByRole("button", { name: "Second", exact: true });
    await second.tap();
    await expect(second).toHaveAttribute("aria-pressed", "false");
    await expect(plot.locator(dimmed)).toHaveCount(0);
  });
});

test("deduplicated category domains fall back instead of assigning wrong positional identities", async ({
  page,
}) => {
  await expect(page.locator("#deduplicated .recharts-rectangle").first()).toBeVisible();
  await expect(page.locator("#deduplicated").locator(marks)).toHaveCount(0);
});

test("incoming Histogram and Box materials retain native paint and controlled visibility during legend emphasis", async ({
  page,
}) => {
  const region = page.locator("#incoming");
  await expect(region.locator("[data-kind-ui=box-plot-mark]")).toHaveCount(1);
  const paint = () =>
    region
      .locator("svg g, svg path, svg rect, svg line, svg circle")
      .evaluateAll((nodes) =>
        nodes.map((node) => [
          node.tagName,
          ...[
            "d",
            "x",
            "y",
            "width",
            "height",
            "x1",
            "x2",
            "y1",
            "y2",
            "cx",
            "cy",
            "r",
            "filter",
            "opacity",
            "fill",
            "stroke",
          ].map((name) => node.getAttribute(name)),
        ]),
      );
  const baseline = await paint();
  await region.getByRole("button", { name: "Distribution", exact: true }).hover();
  await expect(region.locator(marks)).toHaveCount(0);
  expect(await paint()).toEqual(baseline);
  await page.mouse.move(0, 0);
  await page.keyboard.press("Tab");
  await region.getByRole("button", { name: "Distribution", exact: true }).focus();
  expect(await paint()).toEqual(baseline);
  await region.getByRole("button", { name: "Distribution", exact: true }).click();
  await expect(region.locator("[data-kind-ui=box-plot-mark]")).toHaveCount(0);
});

test("native category cursor drives emphasis through plot whitespace and grouped gaps", async ({
  page,
}) => {
  const plot = page.locator("#bars");
  const native = plot.locator(".recharts-rectangle");
  const surface = await plot.locator(".recharts-surface").boundingBox();
  const first = await native.nth(0).boundingBox();
  const peer = await native.nth(3).boundingBox();
  if (!surface || !first || !peer) throw new Error("Missing native grouped geometry");
  const positions = [first.x + first.width / 2, (first.x + first.width + peer.x) / 2];
  for (let repeat = 0; repeat < 3; repeat++) {
    for (const x of positions) {
      await page.mouse.move(x, surface.y + 15);
      await expect(plot.locator("[data-kind-ui=chart-tooltip]")).toContainText("A");
      await expect(plot.locator(dimmed)).toHaveCount(4);
      await expect(plot.locator(marks).nth(0)).toHaveAttribute("data-emphasis", "baseline");
      await expect(plot.locator(marks).nth(3)).toHaveAttribute("data-emphasis", "baseline");
    }
    await page.mouse.move(0, 0);
    await expect(plot.locator(dimmed)).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Toggle stack" }).click();
  const stacked = await native.first().boundingBox();
  if (!stacked) throw new Error("Missing stacked geometry");
  await page.mouse.move(stacked.x + stacked.width / 2, surface.y + 15);
  await expect(plot.locator("[data-kind-ui=chart-tooltip]")).toContainText("A");
  await expect(plot.locator(dimmed)).toHaveCount(4);
  await page.mouse.move(0, 0);
  await expect(plot.locator(dimmed)).toHaveCount(0);
});

test("category whitespace follows native inspection after responsive resize", async ({ page }) => {
  const plot = page.locator("#bars");
  for (const width of [1000, 375, 800]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(plot.locator(".recharts-surface")).toHaveAttribute(
      "width",
      String(Math.min(440, width - 48)),
    );
    const surface = await plot.locator(".recharts-surface").boundingBox();
    const bar = await plot.locator(".recharts-rectangle").nth(1).boundingBox();
    if (!surface || !bar) throw new Error("Missing responsive native geometry");
    await page.mouse.move(bar.x + bar.width / 2, surface.y + 15);
    await expect(plot.locator("[data-kind-ui=chart-tooltip]")).toContainText("B");
    await expect(plot.locator(dimmed)).toHaveCount(4);
    await expect(plot.locator(marks).nth(1)).toHaveAttribute("data-emphasis", "baseline");
    await expect(plot.locator(marks).nth(4)).toHaveAttribute("data-emphasis", "baseline");
    await page.mouse.move(0, 0);
    await expect(plot.locator(dimmed)).toHaveCount(0);
  }
});
