import { expect, type Locator, type Page, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const url = `http://127.0.0.1:${4190 + offset}`;
const chart = (page: Page, name = "First") =>
  page.getByRole("grid", { name: `${name} dismissal grid` });
const tooltip = (grid: Locator) =>
  grid.locator("xpath=../..").locator('[data-kind-ui="heatmap-tooltip"]');
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener(
      "pointermove",
      (event) => {
        document.documentElement.dataset.pointerX = String(event.clientX);
        document.documentElement.dataset.pointerY = String(event.clientY);
      },
      true,
    );
  });
});
async function position(cell: Locator) {
  return cell.evaluate(() => ({
    x: Number(document.documentElement.dataset.pointerX),
    y: Number(document.documentElement.dataset.pointerY),
  }));
}
async function passiveBoundary(cell: Locator, point: { x: number; y: number }) {
  await cell.evaluate((node, p) => {
    const options = {
      bubbles: true,
      clientX: p.x,
      clientY: p.y,
      pointerId: 1,
      pointerType: "mouse",
    };
    node.dispatchEvent(new PointerEvent("pointerout", options));
    node.dispatchEvent(new PointerEvent("pointerover", options));
    node.dispatchEvent(new PointerEvent("pointermove", options));
  }, point);
}
async function staysDismissed(tip: Locator) {
  // Hold the contract for a full second: boundary events may arrive after a frame/scroll change.
  await expect.poll(async () => tip.evaluate((node) => (node as HTMLElement).hidden)).toBe(true);
  const observations = await tip.evaluate(async (node) => {
    const values: boolean[] = [];
    const observer = new MutationObserver((records) => {
      records.forEach((record, index) => {
        const next = records.slice(index + 1).find((item) => item.attributeName === "hidden");
        const newValue = next ? next.oldValue : node.getAttribute("hidden");
        if (record.attributeName === "hidden" && newValue === null) values.push(false);
      });
    });
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["hidden"],
      attributeOldValue: true,
    });
    const start = performance.now();
    while (performance.now() - start < 1000) {
      values.push((node as HTMLElement).hidden);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    observer.disconnect();
    return values;
  });
  expect(observations.length).toBeGreaterThan(0);
  expect(observations.every(Boolean)).toBe(true);
}
for (const width of [375, 1000]) {
  test(`packed dismissal ignores stationary boundaries at ${width}px and preserves callbacks`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    const grid = chart(page);
    const cell = grid.getByRole("gridcell").first();
    const tip = tooltip(grid);
    await cell.hover();
    const point = await position(cell);
    await expect(tip).toBeVisible();
    await page.keyboard.press("Escape"); // Document Escape, without moving focus to the grid.
    await passiveBoundary(cell, point);
    await staysDismissed(tip);
    const callbacks = JSON.parse(await page.getByLabel("Dismissal callbacks").innerText());
    expect(callbacks["First-enter"]).toBeGreaterThanOrEqual(2);
    expect(callbacks["First-cell-move"]).toBeGreaterThan(0);
    const bounds = await cell.boundingBox();
    if (!bounds) throw new Error("Missing cell bounds");
    await page.mouse.move(bounds.x + 4, bounds.y + 4); // Already entered: real movement needs no new boundary.
    await expect(tip).toBeVisible();
    await page.keyboard.press("Escape");
    await cell.click({ position: { x: 4, y: 4 } });
    await expect(tip).toBeVisible();
    const pressed = JSON.parse(await page.getByLabel("Dismissal callbacks").innerText());
    expect(pressed["First-down"]).toBeGreaterThan(0);
    expect(pressed["First-press"]).toBeGreaterThan(0);
  });
}

test("packed focused Escape stays dismissed through native scroll, layout/data changes and compact boundaries", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(url);
  const grid = chart(page);
  const cells = grid.getByRole("gridcell");
  await cells.first().hover();
  const point = await position(cells.first());
  await cells.first().focus();
  await page.keyboard.press("Control+End");
  await expect(cells.last()).toBeFocused();
  expect(await grid.locator("..").evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await passiveBoundary(cells.nth(4), point);
  await staysDismissed(tooltip(grid));
  for (const name of ["Change dismissal layout", "Change dismissal data"]) {
    await page.getByRole("button", { name }).evaluate((node: HTMLButtonElement) => node.click());
    await passiveBoundary(cells.first(), point);
    await staysDismissed(tooltip(grid));
  }
  await expect(cells.first()).toHaveCSS("width", "12px");
  await page.keyboard.press("Control+Home");
  await expect(cells.first()).toBeFocused();
  await expect(tooltip(grid)).toHaveText("Mon, 1: 2");
});

test("packed dismissal permits intentional leave/re-entry and independent Heatmaps", async ({
  page,
}) => {
  await page.goto(url);
  const first = chart(page);
  const second = chart(page, "Second");
  await first.getByRole("gridcell").first().hover();
  await page.keyboard.press("Escape");
  await page.mouse.move(1, 1);
  await first.getByRole("gridcell").first().hover();
  await expect(tooltip(first)).toBeVisible();
  await page.keyboard.press("Escape");
  await second.getByRole("gridcell").first().hover();
  await expect(tooltip(second)).toBeVisible();
  await expect(tooltip(first)).toBeHidden();
  await second.getByRole("gridcell").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(second.getByRole("gridcell").nth(1)).toBeFocused();
  await expect(tooltip(second)).toHaveText("Mon, 2: Missing");
});

test("packed Escape blocked by a consumer does not falsely dismiss", async ({ page }) => {
  await page.goto(url);
  await page.getByLabel("Block dismissal Escape").check();
  const grid = chart(page);
  await grid.getByRole("gridcell").first().hover();
  await grid.getByRole("gridcell").first().focus();
  await page.keyboard.press("Escape");
  await expect(tooltip(grid)).toBeVisible();
});

test("packed touch press can reactivate at the dismissed position", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 375, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(url);
  const grid = chart(page);
  const first = grid.getByRole("gridcell").first();
  await first.tap();
  await expect(tooltip(grid)).toHaveText("Mon, 1: 1");
  await page.keyboard.press("Escape");
  await expect(tooltip(grid)).toBeHidden();
  await first.tap();
  await expect(tooltip(grid)).toHaveText("Mon, 1: 1");
  await grid.getByRole("gridcell").nth(1).tap();
  await expect(tooltip(grid)).toHaveText("Mon, 2: Missing");
  await context.close();
});

test("packed consumer capture prevention owns Escape without stopping propagation", async ({
  page,
}) => {
  await page.goto(url);
  await page.getByLabel("Prevent dismissal Escape").check();
  const grid = chart(page);
  await grid.getByRole("gridcell").first().focus();
  await page.keyboard.press("Escape");
  await expect(tooltip(grid)).toBeVisible();
  const callbacks = JSON.parse(await page.getByLabel("Dismissal callbacks").innerText());
  expect(callbacks["First-key"]).toBeGreaterThan(0);
});

test("packed Escape baseline includes pointer movement while tooltip is idle", async ({ page }) => {
  await page.goto(url);
  const grid = chart(page);
  const cell = grid.getByRole("gridcell").first();
  await cell.hover();
  await page.mouse.move(1, 1);
  const parked = { x: 1, y: 1 };
  await cell.focus();
  await page.keyboard.press("Escape");
  await passiveBoundary(cell, parked);
  await staysDismissed(tooltip(grid));
  await page.keyboard.press("Home"); // Clamped navigation is still a deliberate activation.
  await expect(tooltip(grid)).toBeVisible();
});
