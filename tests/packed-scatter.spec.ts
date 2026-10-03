import { expect, type Locator, test } from "./browser";

const url = "http://127.0.0.1:4185";
const mark = (id: string) => `[data-point="${id}"]`;
async function within(tip: Locator, chart: Locator) {
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

test("packed scatter equals native geometry, Cells, labels and independent duplicate point identity", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(url);
  const chart = page.getByRole("application", { name: "Packed scatter" });
  const native = page.getByRole("application", { name: "Native scatter" });
  await expect(chart).toHaveAttribute("data-ref", "svg");
  await expect(chart.locator("[data-point]")).toHaveCount(7);
  await expect(native.locator("[data-point]")).toHaveCount(7);
  for (const id of [
    "origin",
    "signed",
    "duplicate-a",
    "duplicate-b",
    "missing-size",
    "other-origin",
    "other-point",
  ]) {
    for (const attribute of ["data-cx", "data-cy", "data-size", "d", "stroke"]) {
      expect(await chart.locator(mark(id)).getAttribute(attribute)).toBe(
        await native.locator(mark(id)).getAttribute(attribute),
      );
    }
  }
  expect(
    await chart.locator(mark("other-point")).evaluate((node) => getComputedStyle(node).fill),
  ).toBe(await native.locator(mark("other-point")).evaluate((node) => getComputedStyle(node).fill));
  expect(await chart.locator(mark("origin")).getAttribute("data-size")).toBe("55");
  expect(await chart.locator(mark("missing-size")).getAttribute("data-size")).toBe("55");
  expect(await chart.locator(mark("duplicate-a")).getAttribute("data-cx")).toBe(
    await chart.locator(mark("duplicate-b")).getAttribute("data-cx"),
  );
  await expect(chart.locator(".recharts-label-list text")).toHaveText([
    "origin",
    "signed",
    "duplicate-a",
    "duplicate-b",
    "missing-size",
    "missing-y",
  ]);
  await chart.locator(mark("signed")).hover();
  const tip = page.locator('[data-kind-ui="chart-tooltip"][role="status"]');
  await expect(tip).toContainText("signed");
  await expect(tip).toContainText("-4 ms");
  await expect(tip).toContainText("8%");
  await expect(tip).toContainText("20 jobs");
  await chart.locator(mark("signed")).click();
  await expect(page.getByLabel("Events")).toContainText(/^1\/\d+\/[1-9]\d*\//);
  await chart.locator(mark("other-point")).hover();
  await expect(tip).toContainText("other-point");
  await expect(tip).toContainText("8 ms");
  await expect(tip).toContainText("-7%");
  await expect(tip).toContainText("35 jobs");
  await expect(tip).not.toContainText("signed");
  const frame = page.locator('[data-kind-ui="tooltip-frame"]');
  await expect(frame).toHaveAttribute("data-ref", "DIV");
  await within(frame, chart);
  await page.getByRole("button", { name: "Beta", exact: true }).click();
  await expect(chart.locator(mark("other-point"))).toHaveCount(0);
  await expect(tip).not.toBeVisible();
  await page.getByRole("button", { name: "Beta", exact: true }).click();
  await page.getByRole("button", { name: "Domain", exact: true }).click();
  for (const id of ["signed", "duplicate-a", "other-point"])
    expect(await chart.locator(mark(id)).getAttribute("data-cx")).toBe(
      await native.locator(mark(id)).getAttribute("data-cx"),
    );
  await page.getByRole("button", { name: "Size range", exact: true }).click();
  expect(await chart.locator(mark("duplicate-a")).getAttribute("data-size")).toBe(
    await native.locator(mark("duplicate-a")).getAttribute("data-size"),
  );
  expect(errors).toEqual([]);
});

test("packed keyboard describes actual signed, zero and duplicate points; table contains all series and missing data", async ({
  page,
}) => {
  await page.goto(url);
  const chart = page.getByRole("application", { name: "Packed scatter" });
  await chart.focus();
  const tip = page.locator('[data-kind-ui="chart-tooltip"][role="status"]');
  await expect(tip).toContainText("origin");
  await expect(tip).toContainText("0 ms");
  await expect(tip).toContainText("0%");
  await expect(tip).toContainText("Volume0 jobs");
  for (const id of ["signed", "duplicate-a", "duplicate-b", "missing-size", "missing-y"]) {
    await page.keyboard.press("ArrowRight");
    await expect(tip).toContainText(id);
    if (id === "missing-size") await expect(tip).toContainText("VolumeNo data");
  }
  await expect(tip).toContainText("No data");
  await page.keyboard.press("ArrowLeft");
  await expect(tip).toContainText("missing-size");
  await page.keyboard.press("Escape");
  await expect(tip).not.toBeVisible();
  await page.getByText("All point values", { exact: true }).click();
  await expect(page.getByRole("row", { name: "origin 0 0 0", exact: true })).toBeVisible();
  await expect(
    page.getByRole("row", { name: "missing-size 9 5 No data", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: "other-point 8 -7 35", exact: true })).toBeVisible();
});

test("packed custom tooltip state survives Motion switches, updates and responsive bounds", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  await page.getByRole("button", { name: "Custom content", exact: true }).click();
  const chart = page.getByRole("application", { name: "Packed scatter" });
  await chart.locator(mark("signed")).hover();
  await page
    .getByRole("button", { name: "Count 0", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  for (const name of ["Animate", "Default animation", "Resize", "Domain", "Update", "Size range"]) {
    await page
      .getByRole("button", { name, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.getByRole("button", { name: "Count 1", exact: true })).toBeVisible();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="line-frame"]')).toHaveAttribute("data-motion", "off");
  await within(page.locator('[data-kind-ui="tooltip-frame"]'), chart);
  await expect(page.getByRole("button", { name: "Count 1", exact: true })).toBeVisible();
});

test("packed entrance fades actual native marks and interruptions settle without changing point coordinates", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?builtin`);
  const fade = page
    .locator('[data-kind-ui="scatter-point-entrance"]')
    .filter({ has: page.locator(mark("signed")) })
    .first();
  const chart = page.getByRole("application", { name: "Packed scatter" });
  const before = await chart.locator(mark("signed")).getAttribute("d");
  await page
    .getByRole("button", { name: "Animate", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await page.clock.runFor(500);
  const opacity = await fade.evaluate((node) => Number(getComputedStyle(node).opacity));
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  const stagger = await chart
    .locator('[data-kind-ui="scatter-point-entrance"]')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => ({
          x: Number((node as SVGElement).dataset.entranceX),
          opacity: Number(getComputedStyle(node).opacity),
        }))
        .sort((a, b) => a.x - b.x),
    );
  expect(stagger.length).toBeGreaterThan(2);
  expect(stagger[0]?.opacity).toBeGreaterThan(stagger.at(-1)?.opacity ?? 1);
  await page.clock.runFor(200);
  expect(await fade.evaluate((node) => Number(getComputedStyle(node).opacity))).toBeGreaterThan(
    opacity,
  );
  expect(await chart.locator(mark("signed")).getAttribute("d")).toBe(before);
  await chart.focus();
  await expect(fade).toHaveCSS("opacity", "1");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"][role="status"]')).toContainText(
    "signed",
  );
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(fade).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(fade).toHaveCSS("opacity", "1");
});

for (const functional of [false, true]) {
  test(`packed default size content uses ${functional ? "typed function" : "top-level string"} accessor for zero/missing and preserves nonzero entries`, async ({
    page,
  }) => {
    await page.goto(url);
    if (functional) await page.getByRole("button", { name: "Size accessor", exact: true }).click();
    const chart = page.getByRole("application", { name: "Packed scatter" });
    await chart.focus();
    const tip = page.locator('[data-kind-ui="chart-tooltip"][role="status"]');
    await expect(tip).toContainText("origin");
    await expect(tip).toContainText("Volume0 jobs");
    await expect(tip.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveCount(3);
    await page.keyboard.press("ArrowRight");
    await expect(tip).toContainText("20 jobs");
    await expect(tip.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveCount(3);
    for (let step = 0; step < 3; step++) await page.keyboard.press("ArrowRight");
    await expect(tip).toContainText("missing-size");
    await expect(tip).toContainText("VolumeNo data");
    await expect(tip.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveCount(3);
    await page
      .getByRole("button", { name: "Filter null", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(tip).toContainText("missing-y");
    await expect(tip.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveCount(2);
    await expect(tip).toContainText("Volume60 jobs");
    expect((await tip.textContent())?.match(/60 jobs/g)).toHaveLength(1);
  });
}

test("consumer-owned scatter renderers remain native while entrance is enabled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  const point = page.locator('[data-point="signed"]').first();
  const path = await point.getAttribute("d");
  await page
    .getByRole("button", { name: "Animate", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.locator('[data-kind-ui="scatter-point-entrance"]')).toHaveCount(0);
  expect(await point.getAttribute("d")).toBe(path);
});
