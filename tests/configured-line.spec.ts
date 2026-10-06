import { expect, test } from "@playwright/test";

test("projected native partitions keep gaps, zeroes, markers, tooltip identity and combo ownership", async ({ page }) => {
  await page.goto("/");
  const root = page.locator('[data-case="projection-cases"]');
  const gap = root.locator('[data-projection-connect="false"]');
  const connected = root.locator('[data-projection-connect="true"]');
  for (const plot of [gap, connected]) {
    await expect(plot.locator('[data-projected="true"] path')).toHaveAttribute("stroke-dasharray", "6 3");
    await expect(plot.locator('[data-projected="false"] path')).toHaveAttribute("stroke-dasharray", "2 1");
    await expect(plot.locator('[data-projected="true"] path')).toHaveAttribute("stroke-width", "3");
    await expect(plot.locator('[data-kind-ui="point-marker"]')).toHaveCount(3);
  }
  const gapPath = await gap.locator('[data-projected="true"] path').getAttribute("d");
  const connectedPath = await connected.locator('[data-projected="true"] path').getAttribute("d");
  expect(gapPath).not.toEqual(connectedPath);
  // Without connectNulls the projected path starts at Mar, never at the Jan anchor across Feb's gap.
  const gapDots = gap.locator('[data-kind-ui="point-marker"]');
  const firstProjectedX = await gapDots.nth(1).getAttribute("cx");
  const historicalX = await gapDots.first().getAttribute("cx");
  expect(Number(gapPath?.match(/^M([^,]+)/)?.[1])).toBeCloseTo(Number(firstProjectedX), 2);
  expect(Number(connectedPath?.match(/^M([^,]+)/)?.[1])).toBeCloseTo(Number(historicalX), 2);
  await connected.locator("svg.recharts-surface").focus();
  for (let index = 0; index < 4; index++) await page.keyboard.press("ArrowRight");
  const item = connected.locator('[data-kind-ui="chart-tooltip-item"]');
  await expect(item).toHaveCount(1);
  await expect(item).toHaveAttribute("data-series", "total");
  await expect(item).toContainText("Projected");
  await expect(item.locator('[data-kind-ui="chart-tooltip-value"]')).toHaveText("0");
  await expect(connected.locator('[data-kind-ui="active-marker"][data-point-style="colored-border"]')).toHaveCount(1);
  await expect(root.locator('[data-case="projection-combo"] [data-kind-ui="projected-line"]')).toHaveCount(1);
  const custom = root.locator('[data-case="projection-native-shape"]');
  await expect(custom.locator('[data-custom-projection="owned"]')).toHaveCount(1);
  await expect(custom.locator('[data-kind-ui="projected-line"]')).toHaveCount(0);
  const perSeries = root.locator('[data-case="projection-per-series"]');
  await expect(perSeries.locator('[data-kind-ui="projected-line"]')).toHaveCount(1);
  await perSeries.locator("svg.recharts-surface").focus();
  for (let index = 0; index < 4; index++) await page.keyboard.press("ArrowRight");
  await expect(perSeries.locator('[data-series="total"] [data-kind-ui="projection-status"]')).toHaveText("Projected");
  await expect(perSeries.locator('[data-series="other"] [data-kind-ui="projection-status"]')).toHaveCount(0);
  await expect(perSeries.locator('[data-series="total"] [data-kind-ui="chart-tooltip-value"]')).toHaveText("0");
  await root.screenshot({ path: "artifacts/configured-line-tests/projected-line.png" });
  await root.getByRole("button", { name: "Reorder projection" }).click();
  await expect(connected.locator('[data-kind-ui="projected-line"]')).toHaveCount(0);
  await expect(root.getByRole("cell", { name: "Projected", exact: true })).toHaveCount(0);
  await root.getByRole("button", { name: "Filter projection" }).click();
  await expect(connected.locator('[data-kind-ui="point-marker"]')).toHaveCount(1);
  await expect(connected.locator('[data-kind-ui="projected-line"]')).toHaveCount(0);
  await expect(root.getByRole("cell", { name: "Projected", exact: true })).toHaveCount(1);
  await connected.locator("svg.recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await expect(connected.locator('[data-kind-ui="projection-status"]')).toHaveText("Projected");
  await root.getByRole("button", { name: "Reorder projection" }).click();
  await root.getByRole("button", { name: "Filter projection" }).click();
  await root.getByRole("button", { name: "Missing projection" }).click();
  await expect(connected.locator('[data-kind-ui="point-marker"]')).toHaveCount(2);
  await expect(root.getByRole("row", { name: "Apr No data Projected" })).toHaveCount(1);
  await root.getByRole("button", { name: "Empty projection" }).click();
  await expect(connected.locator('[data-kind-ui="point-marker"]')).toHaveCount(0);
  await expect(connected.locator(".recharts-line-curve")).toHaveCount(0);
  await expect(root.getByRole("cell", { name: "Projected", exact: true })).toHaveCount(0);
});

test("configured line is complete, responsive and owns uncontrolled visibility without website CSS", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const basic = page.locator('[data-case="basic"]');
  await expect(basic.getByRole("application", { name: "Monthly totals" })).toBeVisible();
  const svg = basic.locator("svg.recharts-surface");
  await expect(svg).toHaveAttribute("data-host-ref", "attached");
  await expect(svg).toHaveAttribute("height", "280");
  await expect(basic.locator(".recharts-line-curve")).toHaveCount(2);
  await expect(basic.getByRole("button", { name: "Total" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    basic.locator(".recharts-cartesian-axis-line, .recharts-cartesian-axis-tick-line"),
  ).toHaveCount(0);
  await expect(basic.locator(".recharts-cartesian-grid-vertical line")).toHaveCount(0);
  await expect(basic.locator("clipPath[id$='-reveal'] rect")).toHaveCount(0);
  await expect(basic.locator(".recharts-line-curve").first()).toHaveAttribute("stroke-width", "2");
  await expect(basic.locator(".recharts-line-dot")).toHaveCount(5);
  await expect(svg).toHaveAttribute("aria-describedby", /.+/);
  await basic.screenshot({ path: "artifacts/configured-line-tests/basic-line.png" });
  await basic.getByRole("button", { name: "Total" }).click();
  await expect(basic.getByRole("button", { name: "Total" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(basic.locator(".recharts-line-curve")).toHaveCount(1);
  await basic.getByRole("button", { name: "Other" }).click();
  await expect(basic.locator(".recharts-line-curve")).toHaveCount(0);
  await basic.getByRole("button", { name: "Total" }).click();
  await svg.focus();
  await page.keyboard.press("ArrowRight");
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).toBeVisible();
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).toContainText("Total");
  await page.keyboard.press("Escape");
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).not.toBeVisible();
  await basic.getByRole("button", { name: "Other" }).focus();
  await page.keyboard.press("Enter");
  await expect(basic.getByRole("button", { name: "Other" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const before = await basic.locator(".recharts-line-curve").first().getAttribute("d");
  await page.getByRole("button", { name: "Update data", exact: true }).click();
  await expect
    .poll(() => basic.locator(".recharts-line-curve").first().getAttribute("d"))
    .not.toBe(before);
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  await expect(svg).toHaveAttribute("width", "360");
  const bounds = await svg.boundingBox();
  if (!bounds) throw new Error("Missing plot");
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await expect.poll(() => page.locator("[data-moves]").textContent()).not.toBe("0");
  await page.getByRole("button", { name: "Empty data", exact: true }).click();
  await expect(basic.locator(".recharts-line-curve")).toHaveCount(0);
  await expect(basic.getByRole("button", { name: "Total" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("controlled visibility, config reconciliation, accessors and explicit empty parts are deliberate", async ({
  page,
}) => {
  await page.goto("/");
  const basic = page.locator('[data-case="basic"]');
  await page.getByRole("button", { name: "Update config", exact: true }).click();
  await expect(basic.getByRole("button", { name: "Added" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await basic.getByRole("button", { name: "Total" }).click();
  await page.getByRole("button", { name: "Update config", exact: true }).click();
  await page.getByRole("button", { name: "Update config", exact: true }).click();
  await expect(basic.getByRole("button", { name: "Added" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const controlled = page.locator('[data-case="controlled"]');
  await expect(controlled.getByRole("button", { name: "Other" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await controlled.getByRole("button", { name: "Other" }).click();
  await expect(controlled.getByRole("button", { name: "Other" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("[data-callbacks]")).toHaveText("1");
  await page.getByRole("button", { name: "Hide controlled", exact: true }).click();
  await expect(controlled.locator(".recharts-line-curve")).toHaveCount(0);
  await page.getByRole("button", { name: "Switch control mode", exact: true }).click();
  await expect(controlled.getByRole("alert")).toContainText(
    "cannot switch controlled visibility mode",
  );
  const advanced = page.locator('[data-case="advanced"]');
  await expect(advanced.locator(".recharts-reference-line")).toHaveCount(1);
  await expect(advanced.locator('[data-kind-ui="chart-legend"]')).toHaveCount(0);
  await expect(advanced.locator(".recharts-line-curve")).toHaveCount(1);
  const accessor = page.locator('[data-case="accessor"]');
  await expect(accessor.getByRole("button", { name: "Other" })).toBeVisible();
  await expect(accessor.getByRole("button", { name: "Total" })).toHaveCount(0);
  await expect(accessor.locator(".recharts-cartesian-grid")).toHaveCount(0);
  await expect(accessor.locator(".recharts-line-curve")).toHaveCount(1);
  const empty = page.locator('[data-case="empty-parts"]');
  await expect(empty.locator(".recharts-line-curve")).toHaveCount(0);
  await page.getByRole("button", { name: "Explicit empty", exact: true }).click();
  await expect(empty.locator(".recharts-cartesian-axis")).toHaveCount(0);
  await expect(empty.locator('[data-kind-ui="chart-legend"]')).toHaveCount(0);
});

test("configured default motion respects reduced motion and explicit off", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  const basic = page.locator('[data-case="basic"]');
  const frame = basic.locator('[data-kind-ui="line-frame"]');
  const clip = basic.locator("clipPath[id$='-reveal'] rect");
  await expect(frame).toHaveAttribute("data-motion", "on");
  await expect(clip).toHaveCount(1);
  await page.clock.runFor(120);
  const progress = Number.parseFloat((await clip.getAttribute("width")) ?? "NaN");
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(100);
  // Host-only control: keep the pointer outside plots so hover does not cancel reveal.
  const toggle = page.getByRole("button", { name: "Toggle motion", exact: true });
  await toggle.evaluate((node) => (node as HTMLButtonElement).click());
  await expect(frame).toHaveAttribute("data-motion", "off");
  await expect(clip).toHaveCount(0);
  await toggle.evaluate((node) => (node as HTMLButtonElement).click());
  await page.clock.runFor(120);
  await expect(frame).toHaveAttribute("data-motion", "on");
  await expect(clip).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(frame).toHaveAttribute("data-motion", "off");
  await expect(clip).toHaveCount(0);
});

test("single-point and sparse line values remain visible without inventing interpolation", async ({
  page,
}) => {
  await page.goto("/?single");
  const basic = page.locator('[data-case="basic"]');
  await expect(basic.locator(".recharts-line-dot")).toHaveCount(2);
  await basic.getByRole("application", { name: "Monthly totals" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).toContainText("0");
});

test("point styles preserve keyboard/pointer inspection, native overrides and independent charts", async ({
  page,
}) => {
  await page.goto("/");
  const markers = page.locator('[data-case="markers"]');
  await expect(
    markers.locator('[data-point-style="border"][data-kind-ui="point-marker"]'),
  ).toHaveCount(3);
  await expect(
    markers.locator('[data-point-style="colored-border"][data-kind-ui="point-marker"]'),
  ).toHaveCount(2);
  await markers.scrollIntoViewIfNeeded();
  const border = markers
    .locator('[data-kind-ui="point-marker"][data-point-style="border"]')
    .first();
  const colored = markers
    .locator('[data-kind-ui="point-marker"][data-point-style="colored-border"]')
    .first();
  await expect(border).toHaveCSS("fill", "rgb(64, 85, 238)");
  await expect(border).toHaveCSS("stroke", "rgb(23, 32, 51)");
  await expect(colored).toHaveCSS("fill", "rgb(23, 32, 51)");
  await expect(colored).toHaveCSS("stroke", "rgb(168, 85, 247)");
  const svg = markers.locator("svg.recharts-surface");
  await svg.focus();
  await page.keyboard.press("ArrowRight");
  await expect(markers.locator('[data-kind-ui="tooltip-frame"]')).toBeVisible();
  await expect(
    markers.locator('[data-kind-ui="active-marker"][data-point-style="colored-border"]'),
  ).toHaveCount(1);
  await expect(markers.locator('[data-kind-ui="active-marker"]').first()).toHaveAttribute(
    "pointer-events",
    "none",
  );
  await expect(
    markers.locator('[data-kind-ui="active-marker"][data-point-style="colored-border"]'),
  ).toHaveCSS("stroke", "rgb(64, 85, 238)");
  await expect(
    markers.locator('[data-kind-ui="active-marker"][data-point-style="colored-border"]'),
  ).toHaveCSS("fill", "rgb(23, 32, 51)");
  await page.keyboard.press("Escape");
  await expect(markers.locator('[data-kind-ui="tooltip-frame"]')).not.toBeVisible();
  const box = await svg.boundingBox();
  if (!box) throw new Error("Missing chart");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(markers.locator('[data-kind-ui="tooltip-frame"]')).toBeVisible();
  const native = page.locator('[data-case="native-markers"]');
  await expect(native.locator(".recharts-line-dot")).toHaveCount(3);
  await expect(native.locator(".recharts-line-dot").first()).toHaveAttribute("r", "9");
  await expect(native.locator(".recharts-line-dot").first()).toHaveAttribute("fill", "gold");
  await expect(native.locator('[data-kind-ui="point-marker"]')).toHaveCount(0);
  await native.locator(".recharts-line-dot").first().click();
  await expect(page.locator("[data-marker-clicks]")).toHaveText("1");
  await native.locator("svg.recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await expect(native.locator('[data-kind-ui="active-marker"]')).toHaveCount(0);
  const renderer = page.locator('[data-case="renderer-markers"]');
  await expect(renderer.locator('[data-kind-ui="point-marker"]').first()).toHaveCSS(
    "fill",
    "rgb(255, 255, 255)",
  );
  await expect(renderer.locator('[data-kind-ui="point-marker"]').first()).toHaveCSS(
    "stroke",
    "rgb(64, 85, 238)",
  );
  await renderer.locator("svg.recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await expect(renderer.locator("[data-active-renderer]")).toHaveCSS("fill", "rgb(255, 215, 0)");
  await expect(renderer.locator("[data-active-renderer]")).toHaveCSS("stroke", "rgb(64, 85, 238)");
  const area = page.locator('[data-case="area-markers"]');
  await expect(area.locator('[data-kind-ui="point-marker"]')).toHaveCount(3);
  await area.locator("svg.recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    area.locator('[data-kind-ui="active-marker"][data-point-style="border"]'),
  ).toHaveCount(1);
  const ids = await page.locator("svg [id]").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
});
