import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4204 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const devUrl = `http://127.0.0.1:${4205 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const marks = '[data-kind-ui="candlestick-mark"]';
test("packed OHLC geometry, gaps, volume, updates and accessible inspection", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await expect(page.locator(marks)).toHaveCount(4);
  await expect(page.locator('[data-candle-part="doji"]')).toHaveCount(1);
  const table = page.getByRole("table", { name: "Observed session bars" });
  await expect(table.locator("tbody tr")).toHaveCount(5);
  await expect(table).toContainText("Gap");
  await expect(table).toContainText("0 contracts");
  const chart = page.getByRole("img", { name: "Session trade OHLC" });
  await expect(chart).toHaveAttribute("data-host-ref", "yes");
  const measurements = await page.locator(marks).evaluateAll((nodes) =>
    nodes.map((node) => {
      const line = node.querySelector('[data-candle-part="wick"]');
      const body = node.querySelector('[data-candle-part="body"]');
      return {
        high: Number(line?.getAttribute("y1")),
        low: Number(line?.getAttribute("y2")),
        top: Number(body?.getAttribute("y")),
        height: Number(body?.getAttribute("height")),
        direction: node.getAttribute("data-direction"),
      };
    }),
  );
  expect(measurements.map((mark) => mark.direction)).toEqual([
    "rising",
    "falling",
    "unchanged",
    "rising",
  ]);
  for (const mark of measurements) {
    expect(mark.high).toBeLessThanOrEqual(mark.low);
    if (mark.height) {
      expect(mark.top).toBeGreaterThanOrEqual(mark.high);
      expect(mark.top + mark.height).toBeLessThanOrEqual(mark.low + 0.001);
    }
  }
  const oracle = await page
    .locator("[data-oracle-price]")
    .evaluateAll((nodes) =>
      Object.fromEntries(
        nodes.map((node) => [
          node.getAttribute("data-oracle-price"),
          Number(node.getAttribute("y1")),
        ]),
      ),
    );
  expect(measurements[0]?.high).toBeCloseTo(oracle[116], 5);
  expect(measurements[0]?.low).toBeCloseTo(oracle[94], 5);
  expect(measurements[0]?.top).toBeCloseTo(oracle[108], 5);
  expect(measurements[0]?.height).toBeCloseTo(oracle[100] - oracle[108], 5);
  await expect(page.locator(".recharts-line-curve")).toHaveCount(1);
  const centers = await page
    .locator(marks)
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        Number(node.querySelector('[data-candle-part="wick"]')?.getAttribute("x1")),
      ),
    );
  const volumes = await page
    .locator('[data-kind-ui="candlestick-volume-mark"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        center: Number(node.getAttribute("x")) + Number(node.getAttribute("width")) / 2,
        top: Number(node.getAttribute("y")),
        height: Number(node.getAttribute("height")),
      })),
    );
  expect(volumes).toHaveLength(3);
  expect(volumes[0]?.center).toBeCloseTo(centers[0] ?? NaN, 5);
  expect(volumes[1]?.center).toBeCloseTo(centers[1] ?? NaN, 5);
  expect(volumes[2]?.center).toBeCloseTo(centers[3] ?? NaN, 5);
  expect(volumes[1]?.height).toBe(0);
  expect(volumes[0]?.top).toBeGreaterThan(measurements[0]?.low ?? Infinity);
  const frame = page.locator('[data-kind-ui="chart"]').filter({ has: chart });
  await frame.focus();
  await page.keyboard.press("Home");
  await expect(page.locator('[data-kind-ui="candlestick-content"]')).toContainText("2026-03-05");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="candlestick-content"]')).toContainText("2026-03-06");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="candlestick-content"]')).toContainText("2026-03-10");
  await page.keyboard.press("Enter");
  await expect(table.locator('tr[data-selected="true"]')).toContainText("2026-03-10");
  await page.getByRole("button", { name: "Prepend", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(6);
  await expect(table.locator('tr[data-selected="true"]')).toContainText("2026-03-10");
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await expect(table).toContainText("119.00 USD");
  await expect(table).toContainText("final");
  await page.getByRole("button", { name: "Correct", exact: true }).click();
  await expect(table).toContainText("88.00 USD");
  await page.getByRole("button", { name: "Spacing", exact: true }).click();
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  await expect(chart).toBeVisible();
  await page.screenshot({ path: info.outputPath("candlestick-responsive.png") });
  await frame.focus();
  await page.keyboard.press("Escape");
  await expect(table.locator('tr[data-selected="true"]')).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).include("main").analyze();
  expect(axe.violations).toEqual([]);
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(table).not.toBeVisible();
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(0);
  await expect(table.locator("tbody tr")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("controlled historical window remains anchored through appends and prepends; follow is opt-in", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole("button", { name: "History window" }).click();
  await expect(page.getByLabel("Window")).toHaveText("0.5,3.5");
  await page.getByRole("button", { name: "Append", exact: true }).click();
  await expect(page.getByLabel("Window")).toHaveText("0.5,3.5");
  await page.getByRole("button", { name: "Prepend", exact: true }).click();
  await expect(page.getByLabel("Window")).toHaveText("1.5,4.5");
  await expect(page.getByLabel("Reason")).toHaveText("data");
  const frame = page.getByRole("group", { name: "Session trade OHLC", exact: true });
  await frame.focus();
  await page.keyboard.press("+");
  await expect(page.getByLabel("Reason")).toHaveText("zoom");
  await page.keyboard.press("0");
  await expect(page.getByLabel("Window")).toHaveText("-0.5,6.5");
  await page.reload();
  await page.getByRole("button", { name: "Follow latest", exact: true }).click();
  await page.getByRole("button", { name: "Append", exact: true }).click();
  await expect(page.getByLabel("Window")).toHaveText("0.5,5.5");
});

test("candlestick Motion preserves consumer strict LazyMotion and reduced preference", async ({
  page,
}) => {
  // Enable Motion's development diagnostic environment before its module loads.
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "process", {
      value: { env: { NODE_ENV: "development" } },
      configurable: true,
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${devUrl}/?animate`);
  await expect(page.locator(marks)).toHaveCount(4);
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /Loading/ })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("elapsed spacing, logarithmic geometry and fixed price clipping retain pane alignment", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator(marks)).toHaveCount(4);
  const centers = () =>
    page
      .locator(marks)
      .evaluateAll((nodes) =>
        nodes.map((node) =>
          Number(node.querySelector('[data-candle-part="wick"]')?.getAttribute("x1")),
        ),
      );
  const ordinal = await centers();
  expect((ordinal[2]! - ordinal[1]!) / (ordinal[1]! - ordinal[0]!)).toBeCloseTo(2, 5);
  await page.getByRole("button", { name: "Spacing", exact: true }).click();
  await expect(async () => {
    const elapsed = await centers();
    expect((elapsed[2]! - elapsed[1]!) / (elapsed[1]! - elapsed[0]!)).toBeCloseTo(4, 5);
  }).toPass();
  await page.getByRole("button", { name: "Log scale", exact: true }).click();
  await expect(async () => {
    const values = await page
      .locator("[data-oracle-price]")
      .evaluateAll((nodes) =>
        Object.fromEntries(
          nodes.map((node) => [
            node.getAttribute("data-oracle-price"),
            Number(node.getAttribute("y1")),
          ]),
        ),
      );
    const scaleRatio = (values[100] - values[108]) / (values[94] - values[116]);
    expect(scaleRatio).toBeCloseTo(Math.log(108 / 100) / Math.log(116 / 94), 5);
  }).toPass();
  await page.getByRole("button", { name: "Fixed domain", exact: true }).click();
  await expect(page.locator(marks)).toHaveCount(4);
  const clips = await page.locator(marks).evaluateAll((nodes) =>
    nodes.map((node) => {
      const ids: string[] = [];
      for (let parent: Element | null = node; parent; parent = parent.parentElement) {
        const id = parent.getAttribute("clip-path")?.match(/^url\(#(.+)\)$/)?.[1];
        if (id) ids.push(id);
      }
      return ids.map((id) => {
        const rect = document.getElementById(id)?.querySelector("rect");
        return rect
          ? { y: Number(rect.getAttribute("y")), height: Number(rect.getAttribute("height")) }
          : null;
      });
    }),
  );
  const volumeTop = await page
    .locator('[data-kind-ui="candlestick-volume-mark"]')
    .first()
    .evaluate((node) => Number(node.getAttribute("y")));
  expect(
    clips.every((chain) => chain.some((rect) => rect !== null && rect.y + rect.height < volumeTop)),
  ).toBe(true);
});

test("dense history renders only the explicit visible window without aggregation", async ({
  page,
}, info) => {
  await page.goto(url);
  const started = Date.now();
  await page.getByRole("button", { name: "Dense history" }).click();
  await expect(page.getByLabel("Observation count")).toHaveText("5000");
  await expect(page.locator(marks)).toHaveCount(6);
  await expect(page.getByLabel("Window")).toHaveText("-0.5,4.5");
  const elapsed = Date.now() - started;
  await info.attach("visible-window-measurement", {
    body: JSON.stringify({ records: 5000, marks: 6, elapsedMs: elapsed }),
    contentType: "application/json",
  });
  expect(elapsed).toBeLessThan(5000);
});

test("touch inspection and removal of selection have explicit current-state behavior", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(url);
  await expect(page.locator(marks)).toHaveCount(4);
  await page.locator('[data-candle-part="body"]').first().tap();
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-05");
  await page.getByRole("button", { name: "Remove selection" }).tap();
  await expect(page.getByLabel("Selected time")).toHaveText("None");
  await expect(page.locator(marks)).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test("controlled atomic prepend and consumer pointer veto retain ownership", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "History window" }).click();
  await page.getByRole("button", { name: "Atomic prepend" }).click();
  await expect(page.getByLabel("Window")).toHaveText("1.5,4.5");
  await page.reload();
  await page.getByRole("button", { name: "Veto pointer-up" }).click();
  await page.locator('[data-candle-part="body"]').first().click();
  await expect(page.getByLabel("Selected time")).toHaveText("None");
});

test("entrance progresses once, interruptions finish and reduced motion stays static", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?animate`);
  const clip = page.locator('[data-kind-ui="candlestick-reveal"]');
  const fraction = () =>
    clip.evaluate((rect) => {
      const svg = rect instanceof SVGElement ? rect.ownerSVGElement : null;
      return Number(rect.getAttribute("width")) / (svg?.viewBox.baseVal.width ?? 1);
    });
  await expect.poll(fraction).toBeGreaterThan(0);
  await expect.poll(fraction).toBeLessThan(0.7);
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await expect.poll(fraction).toBeGreaterThan(0.7);
  const finished = await fraction();
  await page.getByRole("button", { name: "Prepend", exact: true }).click();
  await expect.poll(fraction).toBeCloseTo(finished, 3);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(fraction).toBeGreaterThan(0.7);
});

test("horizontal touch drag pans a history window while leaving page scroll available", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(url);
  await page.getByRole("button", { name: "History window" }).tap();
  const svg = page.locator("svg.recharts-surface");
  const bounds = await svg.boundingBox();
  if (!bounds) throw new Error("Missing plot bounds");
  const session = await context.newCDPSession(page);
  const start = { x: bounds.x + bounds.width * 0.7, y: bounds.y + bounds.height * 0.4, id: 0 };
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
  for (let step = 1; step <= 10; step++)
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ ...start, x: start.x - step * 5 }],
    });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByLabel("Reason")).toHaveText("pan");
  const viewport = (await page.getByLabel("Window").textContent())?.split(",").map(Number);
  expect(viewport?.[0]).toBeGreaterThan(0.5);
  expect(viewport?.[1]).toBeGreaterThan(3.5);
  await session.detach();
  await context.close();
});

test("elapsed wheel zoom preserves the pointer's time anchor and horizontal pan uses elapsed distance", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Spacing", exact: true }).click();
  await page.getByRole("button", { name: "History window" }).click();
  const frame = page.getByRole("group", { name: "Session trade OHLC", exact: true });
  await frame.focus();
  const grid = await page.locator(".recharts-cartesian-grid").boundingBox();
  if (!grid) throw new Error("Missing native plot");
  await page.mouse.move(grid.x + grid.width / 2, grid.y + grid.height / 3);
  await page.mouse.wheel(0, -100);
  await expect(page.getByLabel("Reason")).toHaveText("zoom");
  const zoomed = (await page.getByLabel("Window").textContent())?.split(",").map(Number);
  expect(zoomed?.[0]).toBeCloseTo(0.5 + 2.5 - 2.5 / 1.1, 4);
  expect(zoomed?.[1]).toBeCloseTo(3.5 - 2.5 + 2.5 / 1.1, 4);
  await page.getByRole("button", { name: "History window" }).click();
  await frame.focus();
  await page.mouse.move(grid.x + grid.width / 2, grid.y + grid.height / 3);
  await page.mouse.wheel(grid.width / 20, 0);
  await expect(page.getByLabel("Reason")).toHaveText("pan");
  const panned = (await page.getByLabel("Window").textContent())?.split(",").map(Number);
  expect(panned?.[0]).toBeCloseTo(0.75, 3);
  expect(panned?.[1]).toBeCloseTo(3.75, 3);
});

test("consumer full Motion still fails inside the family's preserved strict context", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, "process", {
      value: { env: { NODE_ENV: "development" } },
      configurable: true,
    });
  });
  await page.goto(`${devUrl}/?strict-probe`);
  await expect(page.getByRole("alert")).toContainText(
    "You have rendered a `motion` component within a `LazyMotion` component",
  );
});

test("focused wheel zoom captures page scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 500 });
  await page.goto(url);
  const frame = page.getByRole("group", { name: "Session trade OHLC", exact: true });
  await frame.focus();
  const grid = await page.locator(".recharts-cartesian-grid").boundingBox();
  if (!grid) throw new Error("Missing plot");
  await page.mouse.move(grid.x + grid.width / 2, grid.y + 40);
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 100);
  await expect(page.getByLabel("Reason")).toHaveText("zoom");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
});

test("loading blocks stale keyboard defaults and each explicit completion rearms one reveal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?animate`);
  const frame = page.getByRole("group", { name: "Session trade OHLC", exact: true });
  await frame.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-05");
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await frame.focus();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-05");
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  const fraction = () =>
    page
      .locator('[data-kind-ui="candlestick-reveal"]')
      .evaluate(
        (rect) =>
          Number(rect.getAttribute("width")) /
          (rect instanceof SVGElement ? (rect.ownerSVGElement?.viewBox.baseVal.width ?? 1) : 1),
      );
  await expect.poll(fraction).toBeGreaterThan(0);
  await expect.poll(fraction).toBeLessThan(0.7);
});
