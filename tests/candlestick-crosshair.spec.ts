import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4204 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const crosshair = '[data-kind-ui="candlestick-crosshair"]';
async function pointerCoordinates(page: import("@playwright/test").Page) {
  return page
    .locator('[data-kind-ui="candlestick-mark"]')
    .first()
    .evaluate((node) => {
      if (!(node instanceof SVGElement)) throw new Error("Expected an SVG candle");
      const svg = node.ownerSVGElement;
      const matrix = svg?.getScreenCTM();
      const wick = node.querySelector('[data-candle-part="wick"]');
      if (!matrix || !wick) throw new Error("Missing chart coordinates");
      const x = Number(wick.getAttribute("x1"));
      const y = Number(wick.getAttribute("y1")) + 30;
      const cursor = new DOMPoint(x + 8, y).matrixTransform(matrix);
      return { x: cursor.x, y: cursor.y };
    });
}
async function intersection(page: import("@playwright/test").Page) {
  return page.locator(crosshair).evaluate((node) => {
    if (!(node instanceof SVGElement)) throw new Error("Expected an SVG crosshair");
    const lines = node.querySelectorAll("line");
    const matrix = node.ownerSVGElement?.getScreenCTM();
    const vertical = lines[0];
    const horizontal = lines[1];
    if (!matrix || !vertical || !horizontal) throw new Error("Missing crosshair lines");
    const point = new DOMPoint(
      Number(vertical.getAttribute("x1")),
      Number(horizontal.getAttribute("y1")),
    ).matrixTransform(matrix);
    return { x: point.x, y: point.y };
  });
}

test("free pointer crosshair moves in both dimensions while nearest OHLC inspection stays stable", async ({
  page,
}) => {
  await page.goto(`${url}/?selection-contract&crosshair-contract`);
  const pointer = await pointerCoordinates(page);
  await page.mouse.move(pointer.x, pointer.y);
  await expect(page.locator(crosshair)).toBeVisible();
  await expect
    .poll(async () => {
      const at = await intersection(page);
      return Math.hypot(at.x - pointer.x, at.y - pointer.y);
    })
    .toBeLessThan(1);
  const content = page.locator("[data-content-render]");
  await expect(content).toContainText("Inspected 1000");
  const renders = await content.getAttribute("data-content-render");
  await page.mouse.move(pointer.x + 4, pointer.y + 20);
  await expect
    .poll(async () => {
      const at = await intersection(page);
      return Math.hypot(at.x - pointer.x - 4, at.y - pointer.y - 20);
    })
    .toBeLessThan(1);
  await expect(content).toContainText("Inspected 1000");
  await expect(content).toHaveAttribute("data-content-render", renders ?? "");
  await expect(page.locator('[data-kind-ui="candlestick-crosshair-price"]')).toBeVisible();
  await expect(page.locator('[data-kind-ui="candlestick-crosshair-time"]')).toHaveText("1000");
  await page.locator('[data-kind-ui="chart"]').first().focus();
  await page.keyboard.press("Home");
  await expect(content).toContainText("Inspected 1000");
  await expect.poll(async () => (await intersection(page)).x).not.toBe(pointer.x + 4);
  await page.keyboard.press("Escape");
  await expect(page.locator(crosshair)).toBeHidden();
});

test("explicit snap mode keeps candle time and close anchors", async ({ page }) => {
  await page.goto(`${url}/?selection-contract&crosshair-contract&snap`);
  const pointer = await pointerCoordinates(page);
  await page.mouse.move(pointer.x, pointer.y);
  await expect(page.locator(crosshair)).toBeVisible();
  const first = await intersection(page);
  await page.mouse.move(pointer.x + 4, pointer.y + 20);
  await expect.poll(() => intersection(page)).toEqual(first);
});

test("free crosshair retains local coordinates with elapsed reversed padded logarithmic scales", async ({
  page,
}) => {
  await page.goto(`${url}/?selection-contract&crosshair-contract&elapsed&reversed&padding&log`);
  const pointer = await pointerCoordinates(page);
  await page.mouse.move(pointer.x, pointer.y);
  await expect
    .poll(async () => {
      const at = await intersection(page);
      return Math.hypot(at.x - pointer.x, at.y - pointer.y);
    })
    .toBeLessThan(1);
  const price = Number(
    await page.locator('[data-kind-ui="candlestick-crosshair-price"]').textContent(),
  );
  expect(price).toBeGreaterThan(0);
  const time = Number(
    await page.locator('[data-kind-ui="candlestick-crosshair-time"]').textContent(),
  );
  expect(time).not.toBe(1000);
  await page.getByRole("button", { name: "Toggle loading", exact: true }).click();
  await expect(page.locator(crosshair)).toBeHidden();
  await page.getByRole("button", { name: "Toggle loading", exact: true }).click();
  await expect(page.locator(crosshair)).toBeHidden();
  await page.mouse.move(pointer.x, pointer.y + 5);
  await expect(page.locator(crosshair)).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page.locator(crosshair)).toBeHidden();
});

test("crosshair axis pills use available gutters and volume scale; cancellation clears pending pointer paint", async ({
  page,
}) => {
  await page.goto(`${url}/?selection-contract&crosshair-contract&axis-markers`);
  const pointer = await pointerCoordinates(page);
  await page.mouse.move(pointer.x, pointer.y);
  await expect(page.locator(crosshair)).toBeVisible();
  const positions = await page.locator(crosshair).evaluate((node) => {
    const price = node
      .querySelector('[data-kind-ui="candlestick-crosshair-price"]')
      ?.getBoundingClientRect();
    const time = node
      .querySelector('[data-kind-ui="candlestick-crosshair-time"]')
      ?.getBoundingClientRect();
    const lines = node.querySelectorAll("line");
    return {
      price: price?.left ?? 0,
      time: time?.top ?? 0,
      right: lines[1]?.getBoundingClientRect().right ?? 0,
      bottom: lines[0]?.getBoundingClientRect().bottom ?? 0,
    };
  });
  expect(positions.price).toBeGreaterThan(positions.right);
  expect(positions.time).toBeGreaterThan(positions.bottom);
  const volumePointer = await page.locator(crosshair).evaluate((node) => {
    if (!(node instanceof SVGElement)) throw new Error("Expected SVG cursor");
    const vertical = node.querySelector("line");
    const matrix = node.ownerSVGElement?.getScreenCTM();
    if (!vertical || !matrix) throw new Error("Missing SVG coordinates");
    const point = new DOMPoint(
      Number(vertical.getAttribute("x1")),
      Number(vertical.getAttribute("y2")) - 25,
    ).matrixTransform(matrix);
    return { x: point.x, y: point.y };
  });
  await page.mouse.move(volumePointer.x, volumePointer.y);
  await expect(page.locator('[data-kind-ui="candlestick-crosshair-price"]')).toHaveAttribute(
    "data-axis",
    "volume",
  );
  const volume = Number(
    await page.locator('[data-kind-ui="candlestick-crosshair-price"]').textContent(),
  );
  expect(volume).toBeGreaterThanOrEqual(0);
  expect(volume).toBeLessThanOrEqual(6);
  await page.mouse.down();
  await page
    .locator('[data-kind-ui="chart"]')
    .first()
    .dispatchEvent("pointercancel", { pointerId: 1, isPrimary: true });
  await page.mouse.up();
  await expect(page.locator(crosshair)).toBeHidden();
});

for (const objectRef of [false, true]) {
  test(`crosshair labels preserve ${objectRef ? "object" : "callback cleanup"} consumer refs`, async ({
    page,
  }) => {
    await page.goto(
      `${url}/?selection-contract&crosshair-contract&label-ref${objectRef ? "&object-ref" : ""}`,
    );
    const pointer = await pointerCoordinates(page);
    await page.mouse.move(pointer.x, pointer.y);
    const time = page.locator('[data-kind-ui="candlestick-crosshair-time"]');
    const price = page.locator('[data-kind-ui="candlestick-crosshair-price"]');
    await expect(time).toHaveText("1000");
    await expect(price).toHaveText(/\d/);
    if (objectRef) {
      await page.getByRole("button", { name: "Read label ref", exact: true }).click();
      await expect(page.getByLabel("Consumer label ref")).toHaveText(/\d/);
      await page.getByRole("button", { name: "Toggle crosshair labels", exact: true }).click();
      await page.getByRole("button", { name: "Read label ref", exact: true }).click();
      await expect(page.getByLabel("Consumer label ref")).toHaveText("None");
    } else {
      await expect(time).toHaveAttribute("data-consumer-ref", "attached");
      await expect(price).toHaveAttribute("data-consumer-ref", "attached");
      const timeNode = await time.elementHandle();
      const priceNode = await price.elementHandle();
      await page.getByRole("button", { name: "Toggle crosshair labels", exact: true }).click();
      expect(await timeNode?.getAttribute("data-consumer-cleaned")).toBe("true");
      expect(await priceNode?.getAttribute("data-consumer-cleaned")).toBe("true");
    }
  });
}
