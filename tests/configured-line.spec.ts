import { expect, test } from "@playwright/test";
import { expectHiddenPaint } from "./interaction-paint";
import { expectLastVisibleGuard } from "./last-visible";

test("configured line is complete, responsive and owns explicit uncontrolled visibility without website CSS", async ({
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
  await expect(basic.getByRole("button", { name: "Total", exact: true })).toHaveAttribute(
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
  await basic.getByRole("button", { name: "Total", exact: true }).click();
  await expect(basic.getByRole("button", { name: "Total", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(basic.locator(".recharts-line-curve")).toHaveCount(2);
  await expectHiddenPaint(basic.locator(".recharts-line-curve").first());
  await expectLastVisibleGuard(
    basic.getByRole("button", { name: "Other", exact: true }),
    basic.locator(".recharts-line-curve"),
  );
  await basic.getByRole("button", { name: "Total", exact: true }).click();
  await svg.focus();
  await page.keyboard.press("ArrowRight");
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).toBeVisible();
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).toContainText("Total");
  await page.keyboard.press("Escape");
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).not.toBeVisible();
  await basic.getByRole("button", { name: "Other", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(basic.getByRole("button", { name: "Other", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.keyboard.press("Enter");
  await expect(basic.getByRole("button", { name: "Other", exact: true })).toHaveAttribute(
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
  const visibility = page.locator("[data-basic-visibility]");
  const priorVisibility = await visibility.getAttribute("data-basic-visibility");
  const priorCallbacks = await visibility.getAttribute("data-basic-callbacks");
  if (priorVisibility === null || priorCallbacks === null)
    throw new Error("Missing visibility observer");
  expect(priorVisibility).toBe("total,other");
  await page.getByRole("button", { name: "Empty data", exact: true }).click();
  await expect(basic.locator(".recharts-line-curve")).toHaveCount(0);
  const totalItem = basic.locator('[data-kind-ui="chart-legend-item"][data-series="total"]');
  await expect(totalItem).toHaveText("Total");
  await expect(totalItem.getByRole("button")).toHaveCount(0);
  await expect(visibility).toHaveAttribute("data-basic-visibility", priorVisibility);
  await expect(visibility).toHaveAttribute("data-basic-callbacks", priorCallbacks);
  await page.getByRole("button", { name: "Empty data", exact: true }).click();
  await expect(basic.locator(".recharts-line-curve")).toHaveCount(2);
  await expect(totalItem.getByRole("button", { name: "Total", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(visibility).toHaveAttribute("data-basic-visibility", priorVisibility);
  await expect(visibility).toHaveAttribute("data-basic-callbacks", priorCallbacks);
  expect(errors).toEqual([]);
});

test("controlled visibility, config reconciliation, accessors and explicit empty parts are deliberate", async ({
  page,
}) => {
  await page.goto("/");
  const basic = page.locator('[data-case="basic"]');
  await page.getByRole("button", { name: "Update config", exact: true }).click();
  await expect(basic.getByRole("button", { name: "Added", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await basic.getByRole("button", { name: "Total", exact: true }).click();
  await page.getByRole("button", { name: "Update config", exact: true }).click();
  await page.getByRole("button", { name: "Update config", exact: true }).click();
  await expect(basic.getByRole("button", { name: "Added", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const controlled = page.locator('[data-case="controlled"]');
  await expect(controlled.getByRole("button", { name: "Other", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await controlled.getByRole("button", { name: "Other", exact: true }).click();
  await expect(controlled.getByRole("button", { name: "Other", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("[data-callbacks]")).toHaveText("1");
  await page.getByRole("button", { name: "Hide controlled", exact: true }).click();
  await expect(controlled.locator(".recharts-line-curve")).toHaveCount(2);
  await expectHiddenPaint(controlled.locator(".recharts-line-curve").first());
  await page.getByRole("button", { name: "Switch control mode", exact: true }).click();
  await expect(controlled.getByRole("alert")).toContainText(
    "cannot switch controlled visibility mode",
  );
  const advanced = page.locator('[data-case="advanced"]');
  await expect(advanced.locator(".recharts-reference-line")).toHaveCount(1);
  await expect(advanced.locator('[data-kind-ui="chart-legend"]')).toHaveCount(0);
  await expect(advanced.locator(".recharts-line-curve")).toHaveCount(1);
  const accessor = page.locator('[data-case="accessor"]');
  await expect(accessor.getByRole("button", { name: "Other", exact: true })).toBeVisible();
  await expect(accessor.getByRole("button", { name: "Total", exact: true })).toHaveCount(0);
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

test("backgrounds clip, scope paint and preserve data interaction", async ({ page }) => {
  await page.goto("/");
  const basic = page.locator('[data-case="basic"]');
  const decoration = basic.locator('[data-kind-ui="chart-background-pattern"]');
  await expect(decoration).toHaveCount(1);
  await expect(decoration).toHaveAttribute("aria-hidden", "true");
  await expect(decoration).toHaveAttribute("focusable", "false");
  await expect(decoration).toHaveAttribute("opacity", "0.15");
  const geometry = () =>
    decoration.locator(":scope > rect").evaluate((rect) => ({
      x: rect.getAttribute("x"),
      y: rect.getAttribute("y"),
      width: rect.getAttribute("width"),
      height: rect.getAttribute("height"),
    }));
  const before = await geometry();
  expect(Number(before.x)).toBeGreaterThan(0);
  expect(Number(before.width)).toBeLessThan(500);
  expect(Number(before.height)).toBeLessThan(280);
  expect(
    await decoration.locator("clipPath rect").evaluate((rect) => ({
      x: rect.getAttribute("x"),
      y: rect.getAttribute("y"),
      width: rect.getAttribute("width"),
      height: rect.getAttribute("height"),
    })),
  ).toEqual(before);
  const patternId = await decoration.locator("pattern").getAttribute("id");
  await expect(decoration.locator(":scope > rect")).toHaveAttribute("fill", `url(#${patternId})`);
  const bars = page.locator('[data-case="bar-background"]');
  const barDecoration = bars.locator('[data-kind-ui="chart-background-pattern"]');
  await expect(barDecoration).toHaveCount(1);
  expect(
    await barDecoration.evaluate((node) => {
      const grid = node.ownerDocument.querySelector(
        '[data-case="bar-background"] .recharts-cartesian-grid',
      );
      return !!grid && !!(node.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING);
    }),
  ).toBe(true);
  await expect(bars.locator(".recharts-bar-rectangle")).not.toHaveCount(0);
  const controlled = page.locator('[data-case="controlled"]');
  await expect(controlled.locator('[data-kind-ui="chart-background-pattern"]')).toHaveCount(0);
  const ids = await page
    .locator('[data-kind-ui="chart-background-pattern"] [id]')
    .evaluateAll((els) => els.map((el) => el.id));
  expect(new Set(ids).size).toBe(ids.length);
  const advanced = page.locator('[data-case="advanced"] [data-kind-ui="chart-background-pattern"]');
  await expect(advanced).toHaveCount(2);
  await expect(advanced.last()).toHaveAttribute("opacity", "0");
  expect(await decoration.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe("none");
  expect(
    await decoration.evaluate((node) => {
      const line = node.ownerDocument.querySelector('[data-case="basic"] .recharts-line-curve');
      return !!line && !!(node.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING);
    }),
  ).toBe(true);
  await basic.evaluate((node) => {
    (node as HTMLElement).style.setProperty("--background-ink", "rgb(255, 0, 0)");
  });
  expect(await decoration.locator("circle").evaluate((node) => getComputedStyle(node).fill)).toBe(
    "rgb(255, 0, 0)",
  );
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  await expect.poll(async () => (await geometry()).width).not.toBe(before.width);
  await expect(decoration.locator("pattern")).toHaveAttribute("width", "16");
  await expect(decoration.locator("pattern")).toHaveAttribute("id", patternId ?? "");
  await expect(basic.locator(".recharts-line-curve")).toHaveCount(2);
  await basic.locator("svg.recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(basic.locator('[data-kind-ui="tooltip-frame"]')).not.toBeVisible();
  await basic.screenshot({ path: "artifacts/configured-line-tests/decorative-background.png" });
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
