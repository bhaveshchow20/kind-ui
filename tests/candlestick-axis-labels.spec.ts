import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4204 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const ticks = ".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value";
const price = '[data-current-price-part="label"]';
async function overlaps(page: import("@playwright/test").Page, marker: string) {
  return page.locator(marker).evaluate((pill, selector) => {
    const label = pill.getBoundingClientRect();
    return Array.from(document.querySelectorAll(selector))
      .filter((tick) => {
        if (getComputedStyle(tick).visibility === "hidden") return false;
        const at = tick.getBoundingClientRect();
        return (
          at.left < label.right &&
          at.right > label.left &&
          at.top < label.bottom &&
          at.bottom > label.top
        );
      })
      .map((tick) => tick.textContent);
  }, ticks);
}

test("current price reserves its axis pill without covering native price ticks", async ({
  page,
}) => {
  await page.goto(`${url}/?performance`);
  await expect(page.locator(price)).toBeVisible();
  await expect.poll(() => overlaps(page, price)).toEqual([]);
  await expect(page.locator(ticks).filter({ hasText: "2380.00" })).toBeVisible();
});

test("free crosshair price pill reserves and releases overlapping native ticks", async ({
  page,
}) => {
  await page.goto(`${url}/?performance`);
  await page.evaluate(() => {
    document.body.style.paddingTop = "500px";
    window.scrollTo(0, 450);
  });
  const tick = page.locator(ticks).filter({ hasText: "2380.00" });
  const label = await tick.boundingBox();
  const plot = await page.locator('[data-kind-ui="candlestick-mark"]').first().boundingBox();
  if (!label || !plot) throw new Error("Expected native axis and plot bounds");
  await page.mouse.move(plot.x + plot.width / 2, label.y + label.height / 2);
  const pill = '[data-kind-ui="candlestick-crosshair-price"]';
  await expect(page.locator(pill)).toBeVisible();
  await expect.poll(() => overlaps(page, pill)).toEqual([]);
  await expect(tick).toBeHidden();
  await page.mouse.move(0, 0);
  await expect(tick).toBeVisible();
});

for (const side of ["right", "left"]) {
  test(`styled ${side} price ticks retain their consumer styling and avoid current price`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: side === "right" ? "dark" : "light" });
    await page.goto(`${url}/?performance&styled-tick${side === "left" ? "&axis-left" : ""}`);
    await expect(page.locator(price)).toBeVisible();
    await expect.poll(() => overlaps(page, price)).toEqual([]);
    const native = page.locator(ticks).filter({ hasText: "2380.00" });
    await expect(native).toBeVisible();
    await expect(native).toHaveAttribute("font-size", "18");
    await expect(native).toHaveClass(/styled-price-tick/);
  });
}

test("custom tick renderer remains consumer controlled and hidden price labels release native ticks", async ({
  page,
}) => {
  await page.goto(`${url}/?performance&custom-tick`);
  const custom = page.locator("[data-custom-axis-tick]");
  await expect(custom.first()).toBeVisible();
  expect(
    await custom.evaluateAll((nodes) => nodes.every((node) => node.style.visibility === "")),
  ).toBe(true);
  await page.goto(`${url}/?performance&no-price-label&no-crosshair-labels`);
  await expect(page.locator(price)).toHaveCount(0);
  await expect(page.locator(ticks).filter({ hasText: "2400.00" })).toBeVisible();
});

test("crosshair takes overlapping price pill space temporarily while current price line stays independent", async ({
  page,
}) => {
  await page.goto(`${url}/?performance`);
  const pill = await page.locator(price).boundingBox();
  const candle = await page.locator('[data-kind-ui="candlestick-mark"]').first().boundingBox();
  if (!pill || !candle) throw new Error("Expected current marker and plotted candle");
  await page.mouse.move(candle.x + candle.width / 2, pill.y + pill.height / 2);
  await expect(page.locator('[data-kind-ui="candlestick-crosshair-price"]')).toBeVisible();
  await expect(page.locator(price)).toBeHidden();
  await expect(page.locator('[data-current-price-part="line"]')).toHaveCSS("visibility", "visible");
  await page.mouse.move(0, 0);
  await expect(page.locator(price)).toBeVisible();
});

test("consumer-hidden current price label does not reserve native tick space", async ({ page }) => {
  await page.goto(`${url}/?performance&consumer-hidden-label`);
  await expect(page.locator(price)).toHaveCSS("visibility", "hidden");
  await expect(page.locator(ticks).filter({ hasText: "2400.00" })).toBeVisible();
});
