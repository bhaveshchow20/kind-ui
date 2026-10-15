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
  await expect(page.locator('[data-kind-ui="candlestick-readout"]')).toContainText("2026-03-05");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="candlestick-readout"]')).toContainText("2026-03-06");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="candlestick-readout"]')).toContainText("2026-03-10");
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
  const [firstOrdinal, secondOrdinal, thirdOrdinal] = ordinal;
  if (firstOrdinal === undefined || secondOrdinal === undefined || thirdOrdinal === undefined)
    throw new Error("Missing ordinal positions");
  expect((thirdOrdinal - secondOrdinal) / (secondOrdinal - firstOrdinal)).toBeCloseTo(2, 5);
  await page.getByRole("button", { name: "Spacing", exact: true }).click();
  await expect(async () => {
    const elapsed = await centers();
    const [firstElapsed, secondElapsed, thirdElapsed] = elapsed;
    if (firstElapsed === undefined || secondElapsed === undefined || thirdElapsed === undefined)
      throw new Error("Missing elapsed positions");
    expect((thirdElapsed - secondElapsed) / (secondElapsed - firstElapsed)).toBeCloseTo(4, 5);
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

test("an explicit controlled window survives initial empty data while observations load", async ({
  page,
}) => {
  await page.goto(`${url}/?initial-empty`);
  await expect(page.getByLabel("Window")).toHaveText("0.5,3.5");
  await page.getByRole("button", { name: "Load observations" }).click();
  await expect(page.locator(marks)).toHaveCount(4);
  await expect(page.getByLabel("Window")).toHaveText("0.5,3.5");
});

test("secondary mouse buttons do not select or pan the controlled viewport", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "History window" }).click();
  const grid = await page.locator(".recharts-cartesian-grid").boundingBox();
  if (!grid) throw new Error("Missing plot");
  await page.mouse.click(grid.x + grid.width / 2, grid.y + 40, { button: "right" });
  await expect(page.getByLabel("Selected time")).toHaveText("None");
  await page.mouse.move(grid.x + grid.width / 2, grid.y + 40);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(grid.x + grid.width / 3, grid.y + 40);
  await page.mouse.up({ button: "middle" });
  await expect(page.getByLabel("Window")).toHaveText("0.5,3.5");
  await expect(page.getByLabel("Selected time")).toHaveText("None");
});

test("offscreen overscan volume does not flatten visible bars", async ({ page }) => {
  await page.goto(`${url}/?overscan-volume`);
  const volumes = page.locator('[data-kind-ui="candlestick-volume-mark"]');
  await expect(volumes).toHaveCount(4);
  const overscanHeight = Number(await volumes.nth(1).getAttribute("height"));
  expect(overscanHeight).toBeGreaterThan(25);
  await page.goto(`${url}/?overscan-volume&no-overscan`);
  await expect(volumes).toHaveCount(2);
  expect(Number(await volumes.first().getAttribute("height"))).toBeCloseTo(overscanHeight, 5);
});

test("default time ticks identify actual observations and preserve explicit ticks", async ({
  page,
}) => {
  await page.goto(`${url}/?one-candle`);
  const ticks = page.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value");
  await expect(ticks).toHaveCount(1);
  await expect(ticks).toHaveText("2026-03-05");
  await page.getByRole("button", { name: "Spacing", exact: true }).click();
  await expect(ticks).toHaveCount(1);
  await expect(ticks).toHaveText("2026-03-05");
  await page.goto(`${url}/?explicit-ticks`);
  await expect(ticks).toHaveText(["1.5", "3.5"]);
});

for (const invalid of ["finite", "log", "bounds"]) {
  test(`offscreen overlay ${invalid} fails before it enters the viewport`, async ({ page }) => {
    await page.goto(`${url}/?overlay-invalid=${invalid}`);
    await expect(page.getByRole("alert")).toBeVisible();
  });
}

test("excluded overlay values retain bounds clipping", async ({ page }) => {
  await page.goto(`${url}/?overlay-invalid=bounds&clip-overlay`);
  await expect(page.locator(marks)).toHaveCount(4);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("shared series focus dims paint and supports keyboard activation in strict Motion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${devUrl}/?focus`);
  const price = page.getByRole("button", { name: "Highlight Price", exact: true });
  const volume = page.getByRole("button", { name: "Highlight Volume", exact: true });
  await expect(price).toHaveCount(1);
  await expect(volume).toHaveCount(1);
  await page.locator('[data-candle-part="body"]').first().click();
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-05");
  await expect(price).toHaveAttribute("aria-pressed", "true");
  const volumeOpacity = () =>
    volume
      .locator('[data-kind-ui="series-interaction-paint"]')
      .evaluate((node) => Number(getComputedStyle(node).opacity));
  await expect.poll(volumeOpacity).toBeCloseTo(0.28, 2);
  await volume.focus();
  await page.keyboard.press("Enter");
  await expect(volume).toHaveAttribute("aria-pressed", "true");
  const pricePaints = page.locator(
    '[data-series="price"] > [data-kind-ui="series-interaction-paint"]',
  );
  await expect(pricePaints).toHaveCount(2);
  await expect
    .poll(() =>
      pricePaints.evaluateAll((nodes) =>
        nodes.map((node) => Number(getComputedStyle(node).opacity)),
      ),
    )
    .toEqual([0.28, 0.28]);
  await page
    .locator('[data-series="price"] .recharts-line-curve')
    .dispatchEvent("click", { button: 0 });
  await expect(price).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      pricePaints.evaluateAll((nodes) =>
        nodes.map((node) => Number(getComputedStyle(node).opacity)),
      ),
    )
    .toEqual([1, 1]);
  await page
    .locator('[data-series="price"] .recharts-line-curve')
    .dispatchEvent("click", { button: 0 });
  await expect(price).toHaveAttribute("aria-pressed", "false");
  await page
    .locator('[data-series="price"] .recharts-line-curve')
    .dispatchEvent("pointermove", { pointerType: "mouse", isPrimary: true });
  await expect.poll(volumeOpacity).toBeCloseTo(0.28, 2);
  await expect
    .poll(() =>
      pricePaints.evaluateAll((nodes) =>
        nodes.map((node) => Number(getComputedStyle(node).opacity)),
      ),
    )
    .toEqual([1, 1]);
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(page.locator('[data-kind-ui="candlestick-loading"]')).toHaveCount(1);
  await expect(page.locator('[data-kind-ui="chart-loading-skeleton"]')).toHaveCount(1);
  await expect(price).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("overlay joins the shared entrance reveal and finishes on history replacement", async ({
  page,
}) => {
  // Install before imports so Motion and the test use the same RAF clock.
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${devUrl}/?deferred-animate`);
  const curve = page.locator(".recharts-line-curve");
  await curve.waitFor();
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let frame = 0; frame < 5; frame++) await new Promise(requestAnimationFrame);
  });
  const clips = await curve.evaluate((node) => {
    const values: string[] = [];
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (parent.hasAttribute("clip-path")) values.push(parent.getAttribute("clip-path") ?? "");
    }
    return values;
  });
  expect(clips.some((value) => /candlestick-reveal-.*-price/.test(value))).toBe(true);
  expect(
    clips.some((value) => /candlestick-reveal-.*\)"?$/.test(value) && !value.includes("-price")),
  ).toBe(true);
  const reveal = page.locator(
    'clipPath[id^="candlestick-reveal-"]:not([id$="-price"]):not([id$="-volume"]) rect',
  );
  const plotWidth = Number(await page.locator('clipPath[id$="-price"] rect').getAttribute("width"));
  expect(plotWidth).toBeGreaterThan(0);
  await expect(reveal).toHaveAttribute("width", String(plotWidth));
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 1000)));
  await page.getByRole("button", { name: "Start reveal", exact: true }).dispatchEvent("click");
  await page.clock.runFor(128);
  const partial = Number(await reveal.getAttribute("width"));
  expect(partial).toBeGreaterThan(0);
  expect(partial).toBeLessThan(plotWidth);
  await page.getByRole("button", { name: "Replace" }).dispatchEvent("click");
  await page.clock.runFor(32);
  await expect
    .poll(async () => Number(await reveal.getAttribute("width")))
    .toBeCloseTo(plotWidth, 1);
});

test("overlay series shares keyboard focus, inactive paint and native activation callbacks in strict Motion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${devUrl}/?focus&overlay-focus`);
  const overlay = page.getByRole("button", { name: "Highlight Close overlay", exact: true });
  const price = page.getByRole("button", { name: "Highlight Price", exact: true }).first();
  await expect(overlay).toHaveCount(1);
  const opacity = (series: string) =>
    page
      .locator(`[data-series="${series}"] > [data-kind-ui="series-interaction-paint"]`)
      .first()
      .evaluate((node) => Number(getComputedStyle(node).opacity));
  await overlay.focus();
  await page.keyboard.press("Enter");
  await expect(overlay).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => opacity("price")).toBeCloseTo(0.28, 2);
  await expect.poll(() => opacity("overlay")).toBeCloseTo(1, 2);
  await expect(page.getByLabel("Overlay click")).toHaveText("None");
  await price.focus();
  await page.keyboard.press(" ");
  await expect(price).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => opacity("overlay")).toBeCloseTo(0.28, 2);
  await page.mouse.move(0, 0);
  await overlay.locator(".recharts-line-curve").dispatchEvent("click", { button: 0 });
  await expect(page.getByLabel("Overlay click")).toHaveText("2:click:0");
  await expect(overlay).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("overlay native callback can veto shared series activation", async ({ page }) => {
  await page.goto(`${devUrl}/?focus&overlay-focus&overlay-veto`);
  const price = page.getByRole("button", { name: "Highlight Price", exact: true });
  const overlay = page.getByRole("button", { name: "Highlight Close overlay", exact: true });
  await price.focus();
  await page.keyboard.press("Enter");
  await overlay.locator(".recharts-line-curve").dispatchEvent("click", { button: 0 });
  await expect(page.getByLabel("Overlay click")).toHaveText("2:click:0");
  await expect(price).toHaveAttribute("aria-pressed", "true");
  await expect(overlay).toHaveAttribute("aria-pressed", "false");
});

test("hidden overlay preserves native hide and leaves no series keyboard target", async ({
  page,
}) => {
  await page.goto(`${devUrl}/?focus&overlay-focus&overlay-hidden`);
  await expect(
    page.getByRole("button", { name: "Highlight Close overlay", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".recharts-line-curve")).toHaveCount(0);
  await expect(page.locator(marks)).toHaveCount(4);
});

test("another pointer cannot end the primary drag", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "History window" }).click();
  const plot = page.locator("svg.recharts-surface");
  const grid = await page.locator(".recharts-cartesian-grid").boundingBox();
  if (!grid) throw new Error("Missing plot");
  await page.mouse.move(grid.x + grid.width / 2, grid.y + 40);
  await page.mouse.down();
  await plot.dispatchEvent("pointerup", {
    pointerId: 99,
    pointerType: "touch",
    isPrimary: false,
    bubbles: true,
  });
  await page.mouse.move(grid.x + grid.width / 3, grid.y + 40);
  await page.mouse.up();
  await expect(page.getByLabel("Reason")).toHaveText("pan");
  await expect(page.getByLabel("Window")).not.toHaveText("0.5,3.5");
});

test("consumer click veto runs before controlled tap selection", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Veto click", exact: true }).click();
  await page.locator('[data-candle-part="body"]').first().click();
  await expect(page.getByLabel("Selected time")).toHaveText("None");
  await page.getByRole("button", { name: "Veto click", exact: true }).click();
  await page.locator('[data-candle-part="body"]').first().click();
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-05");
});

for (const axis of ["reversed-x", "padded-x", "reversed-x&padded-x"]) {
  test(`native ${axis} wheel zoom preserves the rendered observation anchor`, async ({ page }) => {
    await page.goto(`${url}/?${axis}`);
    await page.getByRole("button", { name: "History window" }).click();
    const frame = page.getByRole("group", { name: "Session trade OHLC", exact: true });
    await frame.focus();
    const center = (date = "2026-03-06") =>
      page
        .locator(`${marks}[aria-label^="${date}:"] [data-candle-part="wick"]`)
        .evaluate((node) => {
          const svg = node instanceof SVGElement ? node.ownerSVGElement : null;
          const matrix = svg?.getScreenCTM();
          if (!matrix) throw new Error("Missing SVG screen transform");
          const point = new DOMPoint(
            Number(node.getAttribute("x1")),
            Number(node.getAttribute("y1")),
          ).matrixTransform(matrix);
          return { x: point.x, y: point.y };
        });
    const before = await center();
    await page.mouse.move(before.x, before.y + 12);
    await page.mouse.wheel(0, -100);
    await expect(page.getByLabel("Reason")).toHaveText("zoom");
    // Native wheel events round fractional client pixels; preserve the candle within that subpixel error.
    await expect.poll(async () => Math.abs((await center()).x - before.x)).toBeLessThan(0.2);
    await page.getByRole("button", { name: "History window" }).click();
    await frame.focus();
    const reset = await center();
    const other = await center("2026-03-10");
    const delta = (other.x - reset.x) / 10;
    await page.mouse.move(reset.x, reset.y + 12);
    await page.mouse.wheel(delta, 0);
    await expect(page.getByLabel("Reason")).toHaveText("pan");
    const wheelPan = (await page.getByLabel("Window").textContent())?.split(",").map(Number);
    expect(wheelPan?.[0]).toBeCloseTo(0.7, 2);
    expect(wheelPan?.[1]).toBeCloseTo(3.7, 2);
    await page.getByRole("button", { name: "History window" }).click();
    await page.mouse.move(reset.x, reset.y + 12);
    await page.mouse.down();
    await page.mouse.move(reset.x + delta, reset.y + 12);
    await page.mouse.up();
    const dragPan = (await page.getByLabel("Window").textContent())?.split(",").map(Number);
    expect(dragPan?.[0]).toBeCloseTo(0.3, 2);
    expect(dragPan?.[1]).toBeCloseTo(3.3, 2);
  });
}

test("axis and SVG margin gestures preserve selection and the history viewport", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole("button", { name: "History window" }).click();
  await page.locator(`${marks}[aria-label^="2026-03-06:"] [data-candle-part="body"]`).click();
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-06");
  const svg = await page.locator("svg.recharts-surface").boundingBox();
  const plot = await page.locator(".recharts-cartesian-grid").boundingBox();
  const xTick = await page
    .locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")
    .first()
    .boundingBox();
  const yTick = await page
    .locator(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")
    .first()
    .boundingBox();
  if (!svg || !plot || !xTick || !yTick) throw new Error("Missing plot or axis geometry");
  const before = await page.getByLabel("Window").textContent();
  for (const point of [
    { x: xTick.x + xTick.width / 2, y: xTick.y + xTick.height / 2 },
    { x: yTick.x + yTick.width / 2, y: yTick.y + yTick.height / 2 },
    { x: svg.x + 2, y: svg.y + 2 },
  ]) {
    await page.mouse.click(point.x, point.y);
    await expect(page.getByLabel("Selected time")).toHaveText("2026-03-06");
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(plot.x + plot.width / 2, plot.y + plot.height / 3);
    await page.mouse.up();
    await expect(page.getByLabel("Window")).toHaveText(before ?? "");
    await expect(page.getByLabel("Selected time")).toHaveText("2026-03-06");
  }
  await page.getByRole("group", { name: "Session trade OHLC", exact: true }).focus();
  await page.mouse.move(xTick.x + xTick.width / 2, xTick.y + xTick.height / 2);
  await page.mouse.wheel(0, -100);
  await expect(page.getByLabel("Window")).toHaveText(before ?? "");
  await page.mouse.move(plot.x + plot.width / 2, plot.y + 40);
  await page.mouse.down();
  await page.mouse.move(plot.x - 20, plot.y + 40);
  await page.mouse.up();
  await expect(page.getByLabel("Reason")).toHaveText("pan");
  await expect(page.getByLabel("Window")).not.toHaveText(before ?? "");
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-06");
});

test("native mirrored tick labels inside the plot do not start inspection or gestures", async ({
  page,
}) => {
  await page.goto(`${url}/?mirror-x`);
  await page.getByRole("button", { name: "History window" }).click();
  await page.locator(`${marks}[aria-label^="2026-03-06:"] [data-candle-part="body"]`).click();
  const plot = await page.locator(".recharts-cartesian-grid").boundingBox();
  const tick = await page
    .locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")
    .first()
    .boundingBox();
  if (!plot || !tick) throw new Error("Missing mirrored axis geometry");
  const x = tick.x + tick.width / 2;
  const y = tick.y + tick.height / 2;
  expect(x).toBeGreaterThan(plot.x);
  expect(x).toBeLessThan(plot.x + plot.width);
  expect(y).toBeGreaterThan(plot.y);
  expect(y).toBeLessThan(plot.y + plot.height);
  const before = await page.getByLabel("Window").textContent();
  await page.mouse.click(x, y);
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-06");
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 70, y - 30);
  await page.mouse.up();
  await expect(page.getByLabel("Window")).toHaveText(before ?? "");
  await page.getByRole("group", { name: "Session trade OHLC", exact: true }).focus();
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, -100);
  await expect(page.getByLabel("Window")).toHaveText(before ?? "");
  await expect(page.getByLabel("Selected time")).toHaveText("2026-03-06");
});

test("empty uncontrolled history consumes its captured default only on the first populated load", async ({
  page,
}) => {
  await page.goto(`${url}/?initial-empty&pending-default`);
  await page.getByRole("button", { name: "Change default window", exact: true }).click();
  await page.getByRole("button", { name: "Load observations", exact: true }).click();
  await expect(page.getByLabel("Window")).toHaveText("0.5,3.5");
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await page.getByRole("button", { name: "Load observations", exact: true }).click();
  await expect(page.getByLabel("Window")).toHaveText("-0.5,4.5");
});

for (const shape of ["function", "element", "object", "false"]) {
  test(`custom Volume ${shape} retains pane and entrance clipping`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${devUrl}/?animate&custom-volume=${shape}`);
    const volume = page.locator('[data-series="volume"]');
    const drawing = volume.locator(".recharts-bar-rectangles").locator("rect,path").first();
    await expect(drawing).toBeVisible();
    const clips = await drawing.evaluate((node) => {
      const paths: string[] = [];
      for (let ancestor: Element | null = node; ancestor; ancestor = ancestor.parentElement) {
        const clip = ancestor.getAttribute("clip-path");
        if (clip) paths.push(clip);
      }
      const reveal = document.querySelector('[data-kind-ui="candlestick-reveal"]');
      return { paths, reveal: `url(#${reveal?.parentElement?.id})` };
    });
    expect(clips.paths.some((clip) => clip.endsWith("-volume)"))).toBe(true);
    expect(clips.paths).toContain(clips.reveal);
    if (shape === "function" || shape === "element") {
      await expect(volume.locator(`[data-custom-volume="${shape}"]`).first()).toHaveAttribute(
        "width",
        "900",
      );
    }
    const priceHit = await page.locator(".recharts-cartesian-grid").evaluate((grid) => {
      const bounds = grid.getBoundingClientRect();
      return document
        .elementFromPoint(bounds.x + 10, bounds.y + 10)
        ?.closest("[data-series]")
        ?.getAttribute("data-series");
    });
    expect(priceHit).not.toBe("volume");
    const reveal = page.locator('[data-kind-ui="candlestick-reveal"]');
    await expect
      .poll(() => reveal.evaluate((rect) => Number(rect.getAttribute("width"))))
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "Replace", exact: true }).click();
    await expect
      .poll(() =>
        reveal.evaluate((rect) => {
          const svg = rect instanceof SVGElement ? rect.ownerSVGElement : null;
          return Number(rect.getAttribute("width")) / (svg?.viewBox.baseVal.width ?? 1);
        }),
      )
      .toBeGreaterThan(0.7);
  });
}

test("narrow dense windows keep default volume bars visible and centered without fabricating height", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(url);
  await page.getByRole("button", { name: "Dense history", exact: true }).click();
  const frame = page.getByRole("group", { name: "Session trade OHLC", exact: true });
  await frame.focus();
  for (let step = 0; step < 16; step++) await page.keyboard.press("-");
  const volumes = page.locator('[data-kind-ui="candlestick-volume-mark"]');
  expect(await volumes.count()).toBeGreaterThan(150);
  const geometry = await volumes.evaluateAll((nodes) =>
    nodes.map((node) => ({
      x: Number(node.getAttribute("x")),
      width: Number(node.getAttribute("width")),
      height: Number(node.getAttribute("height")),
    })),
  );
  const centers = await page
    .locator('[data-candle-part="wick"]')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("x1"))));
  expect(geometry).toHaveLength(centers.length);
  for (const [index, volume] of geometry.entries()) {
    expect(volume.width).toBeGreaterThanOrEqual(1);
    expect(volume.x + volume.width / 2).toBeCloseTo(centers[index] ?? Number.NaN, 5);
    expect(volume.height).toBeGreaterThanOrEqual(0);
  }
  expect(geometry[0]?.height).toBe(0);
  await page.goto(`${url}/?subpixel-volume`);
  for (const width of await volumes.evaluateAll((nodes) =>
    nodes.map((node) => Number(node.getAttribute("width"))),
  )) {
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThanOrEqual(0.5);
  }
});
