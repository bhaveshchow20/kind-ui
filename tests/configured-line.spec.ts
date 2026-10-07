import { expect, test } from "@playwright/test";
import { expectLastVisibleGuard } from "./last-visible";

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
  await expectLastVisibleGuard(
    basic.getByRole("button", { name: "Other" }),
    basic.locator(".recharts-line-curve"),
  );
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
    "false",
  );
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
  await expect(totalItem.getByRole("button", { name: "Total" })).toHaveAttribute(
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
