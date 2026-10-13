import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4205 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
test("visible zoom controls propose controlled windows and preserve native veto", async ({
  page,
}) => {
  await page.goto(`${url}/?navigation`);
  const zoom = page.getByRole("button", { name: "Zoom in", exact: true });
  await zoom.click();
  await expect(page.getByLabel("Reason")).toHaveText("zoom");
  const window = ((await page.getByLabel("Window", { exact: true }).textContent()) ?? "")
    .split(",")
    .map(Number);
  expect((window[1] ?? 0) - (window[0] ?? 0)).toBeCloseTo(5 / 1.5);
  await page.getByRole("button", { name: "Zoom out", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,4.5");
  await expect(page.getByLabel("Selected time", { exact: true })).toHaveText("None");
  await expect(page.getByLabel("Inspection", { exact: true })).toHaveText("None");
  await page.getByRole("button", { name: "History window", exact: true }).click();
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,4.5");
  await expect(page.getByLabel("Reason")).toHaveText("reset");
  await zoom.focus();
  await page.keyboard.press(" ");
  await expect(page.getByLabel("Selected time", { exact: true })).toHaveText("None");
  await expect(page.getByLabel("Inspection", { exact: true })).toHaveText("None");
  await page.goto(`${url}/?navigation&controls-veto`);
  await zoom.click();
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,4.5");
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(zoom).toBeDisabled();
  await expect(page.getByRole("button", { name: "Reset view", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Load observations", exact: true }).click();
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(page.locator('[data-kind-ui="candlestick-controls"]')).toHaveAttribute(
    "disabled",
    "",
  );
  await expect(page.locator('[data-kind-ui="candlestick-controls"] button').first()).toBeDisabled();
  await expect(page.locator('[data-kind-ui="candlestick-history-navigator"]')).toHaveAttribute(
    "disabled",
    "",
  );
  await expect(page.locator('[data-kind-ui="candlestick-history-navigator"]')).toHaveAttribute(
    "inert",
    "",
  );
});

test("discrete zoom animates displayed coordinates while controlled callbacks fire once; reduced motion snaps", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto(`${url}/?navigation&viewport-motion`);
  await page.clock.runFor(500);
  const wick = page.locator(
    '[data-kind-ui="candlestick-mark"][aria-label^="2026-03-10:"] [data-candle-part="wick"]',
  );
  const before = Number(await wick.getAttribute("x1"));
  const area = page.locator('clipPath[id$="-price"] rect');
  const target =
    Number(await area.getAttribute("x")) + Number(await area.getAttribute("width")) * 0.8;
  const callbacks = Number(await page.getByLabel("Window changes", { exact: true }).textContent());
  await page.getByRole("button", { name: "Zoom in", exact: true }).dispatchEvent("click");
  await page.clock.runFor(48);
  const intermediate = Number(await wick.getAttribute("x1"));
  expect(intermediate).toBeGreaterThan(before);
  expect(intermediate).toBeLessThan(target);
  await page.clock.runFor(250);
  await expect.poll(async () => Number(await wick.getAttribute("x1"))).toBeCloseTo(target, 1);
  await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(
    String(callbacks + 1),
  );
  await page.getByRole("button", { name: "Reset view", exact: true }).dispatchEvent("click");
  await page.clock.runFor(48);
  await page.getByRole("button", { name: "Replace", exact: true }).dispatchEvent("click");
  await page.clock.runFor(16);
  await expect.poll(async () => Number(await wick.getAttribute("x1"))).toBeCloseTo(before, 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${url}/?navigation&viewport-motion`);
  await page.clock.runFor(500);
  await page.getByRole("button", { name: "Zoom in", exact: true }).dispatchEvent("click");
  await page.clock.runFor(16);
  await expect.poll(async () => Number(await wick.getAttribute("x1"))).toBeCloseTo(target, 1);
  await expect(page.getByLabel("Window changes", { exact: true })).toHaveText("1");
});
test("historical overview stays below price and volume and native handles control the window", async ({
  page,
}) => {
  await page.goto(`${url}/?navigation&legend-top`);
  const nav = page.locator('[data-kind-ui="candlestick-history-navigator"]');
  const plot = await page.locator("svg.recharts-surface").first().boundingBox();
  const navigator = await nav.boundingBox();
  if (!plot || !navigator) throw new Error("Missing overview geometry");
  expect(navigator.y).toBeGreaterThanOrEqual(plot.y + plot.height);
  await expect(nav.locator(".recharts-line-curve")).toHaveCount(1);
  const start = nav.getByRole("slider", { name: "Historical window start", exact: true });
  const end = nav.getByRole("slider", { name: "Historical window end", exact: true });
  await expect(start).toHaveAttribute("aria-valuenow", "0");
  await expect(end).toHaveAttribute("aria-valuenow", "4");
  const changes = Number(await page.getByLabel("Window changes", { exact: true }).textContent());
  await start.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,4.5");
  await expect(page.getByLabel("Reason")).toHaveText("pan");
  await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(String(changes + 1));
  await expect(page.getByLabel("Inspection", { exact: true })).toHaveText("None");
  await end.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,3.5");
  await expect(start).toHaveAttribute("aria-valuenow", "1");
  await expect(end).toHaveAttribute("aria-valuenow", "3");
  await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(String(changes + 2));
  await expect(page.getByLabel("Inspection", { exact: true })).toHaveText("None");
  const before = await page.getByLabel("Window", { exact: true }).textContent();
  await page.getByRole("button", { name: "Append", exact: true }).click();
  await expect(page.getByLabel("Window", { exact: true })).toHaveText(before ?? "");
  await page.getByRole("button", { name: "Follow latest", exact: true }).click();
  await end.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,5.5");
  await page
    .getByRole("button", { name: "Append next observation", exact: true })
    .dispatchEvent("click");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("1.5,6.5");
  await expect(end).toBeFocused();
  await page.getByRole("button", { name: "Prepend", exact: true }).dispatchEvent("click");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("2.5,7.5");
  await expect(end).toBeFocused();
  const axe = await new AxeBuilder({ page })
    .include('[data-kind-ui="candlestick-history-navigator"]')
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 900 });
  await expect
    .poll(() => nav.evaluate((node) => node.getBoundingClientRect().width))
    .toBeLessThanOrEqual(320);
  await expect
    .poll(() => nav.evaluate((node) => node.scrollWidth - node.clientWidth))
    .toBeLessThanOrEqual(1);
});

test("forming-row corrections update the overview without resetting focused handles or cancelling a drag", async ({
  page,
}) => {
  await page.goto(`${url}/?navigation`);
  await page.getByRole("button", { name: "History window", exact: true }).click();
  const nav = page.locator('[data-kind-ui="candlestick-history-navigator"]');
  const start = nav.getByRole("slider", { name: "Historical window start", exact: true });
  const end = nav.getByRole("slider", { name: "Historical window end", exact: true });
  const curve = nav.locator(".recharts-line-curve");
  const beforeCurve = await curve.getAttribute("d");
  await end.focus();
  await page.getByRole("button", { name: "Replace", exact: true }).dispatchEvent("click");
  await expect(end).toBeFocused();
  await expect(curve).not.toHaveAttribute("d", beforeCurve ?? "");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,4.5");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,3.5");
  const a = await start.boundingBox();
  const b = await end.boundingBox();
  const slide = await nav.locator(".recharts-brush-slide").boundingBox();
  if (!a || !b || !slide) throw new Error("Missing native brush geometry");
  const handle = await start.elementHandle();
  await page.mouse.move(slide.x + slide.width / 2, slide.y + slide.height / 2);
  await page.mouse.down();
  await page.getByRole("button", { name: "Replace", exact: true }).dispatchEvent("click");
  await expect.poll(() => handle?.evaluate((node) => node.isConnected) ?? false).toBe(true);
  await page.mouse.move(
    slide.x + slide.width / 2 - (b.x - a.x) / 2 - 2,
    slide.y + slide.height / 2,
  );
  await page.mouse.up();
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,2.5");
});
