import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4205 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const currentPrice = '[data-kind-ui="candlestick-current-price"]';
const latestBody = '[data-kind-ui="candlestick-mark"] [data-candle-part="body"]';

test("current price follows latest movement and native right/log scale independently of inspection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}/?current-price`);
  const marker = page.locator(currentPrice);
  await expect(marker).toHaveAttribute("data-direction", "rising");
  await page.locator(latestBody).first().hover();
  await expect(marker.locator("text")).toContainText("112");
  expect(
    await marker
      .locator('[data-current-price-part="line"]')
      .evaluate((node) => node.closest("[clip-path]")?.getAttribute("clip-path")),
  ).toMatch(/-price\)/);
  const axis = await page.locator(".recharts-yAxis").first().boundingBox();
  const pill = await marker.locator('[data-current-price-part="label"]').boundingBox();
  if (!axis || !pill) throw new Error("Missing right price axis");
  expect(pill.x).toBeGreaterThanOrEqual(axis.x - 1);
  const aligned = async () => {
    const candle = page.locator('[data-kind-ui="candlestick-mark"]').last();
    const body = await candle
      .locator('[data-candle-part="body"],[data-candle-part="doji"]')
      .evaluate((node) => ({
        y: Number(node.getAttribute("y") ?? node.getAttribute("y1")),
        height: Number(node.getAttribute("height") ?? 0),
      }));
    const line = await marker
      .locator('[data-current-price-part="line"]')
      .evaluate((node) =>
        Number(node.parentElement?.getAttribute("transform")?.match(/translate\(0 ([^)]+)\)/)?.[1]),
      );
    const direction = await candle.getAttribute("data-direction");
    const close = direction === "falling" ? body.y + body.height : body.y;
    expect(Math.abs(line - close)).toBeLessThan(0.01);
  };
  await aligned();
  await page.getByRole("button", { name: "Latest Down", exact: true }).click();
  await expect(marker).toHaveAttribute("data-direction", "falling");
  await expect(marker.locator("text")).toContainText("100");
  await aligned();
  await page.getByRole("button", { name: "Log scale", exact: true }).click();
  await aligned();
  await page.getByRole("button", { name: "Resize", exact: true }).click();
  await aligned();
  await page.getByRole("button", { name: "Append", exact: true }).click();
  await expect(marker.locator("text")).toContainText("119");
  await expect(marker).toHaveAttribute("data-direction", "rising");
  await page.getByRole("button", { name: "Latest Neutral", exact: true }).click();
  await expect(marker).toHaveAttribute("data-direction", "falling");
  await page.getByRole("button", { name: "Latest Neutral", exact: true }).click();
  await expect(marker).toHaveAttribute("data-direction", "unchanged");
  await page.getByRole("button", { name: "Latest Up", exact: true }).click();
  await page.getByRole("button", { name: "Fixed domain", exact: true }).click();
  await expect(marker).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("volume direction colors match candles and consumer paint overrides remain authoritative", async ({
  page,
}) => {
  await page.goto(`${url}/?current-price`);
  const volumes = page.locator('[data-kind-ui="candlestick-volume-mark"]');
  await expect(volumes.first()).toHaveAttribute("fill", "#15803d");
  await expect(volumes.nth(1)).toHaveAttribute("fill", "#be123c");
  await expect(volumes.first()).toHaveAttribute("fill-opacity", "0.35");
  await expect(page.locator('[data-kind-ui="candlestick-mark"]').first()).toHaveAttribute(
    "color",
    "#15803d",
  );
  await page.getByRole("button", { name: "Latest Neutral", exact: true }).click();
  await expect(volumes.last()).toHaveAttribute("fill", "#64748b");
  await page.goto(`${url}/?current-price&volume-paint`);
  await expect(volumes.first()).toHaveAttribute("fill", "purple");
  await expect(volumes.first()).toHaveAttribute("fill-opacity", "0.7");
});

for (const reduced of [false, true]) {
  test(`latest geometry ${reduced ? "snaps with reduced motion" : "moves smoothly inside strict LazyMotion"}`, async ({
    page,
  }) => {
    // Capture the same RAF clock as Motion before the package imports.
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
    await page.goto(`${url}/?current-price&animate`);
    await expect(page.locator(currentPrice)).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let frame = 0; frame < 3; frame++) await new Promise(requestAnimationFrame);
    });
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 1000)));
    await page.evaluate(() => {
      const samples: { price: string | null; candle: string | null; historical: string | null }[] =
        [];
      const capture = () => {
        const bodies = document.querySelectorAll(
          '[data-kind-ui="candlestick-mark"] [data-candle-part="body"]',
        );
        samples.push({
          price:
            document
              .querySelector('[data-current-price-part="line"]')
              ?.parentElement?.getAttribute("transform") ?? null,
          candle: bodies[bodies.length - 1]?.getAttribute("y") ?? null,
          historical: bodies[0]?.getAttribute("y") ?? null,
        });
        if (samples.length < 30) requestAnimationFrame(capture);
      };
      Object.assign(window, { latestPriceSamples: samples });
      document.querySelectorAll("button").forEach((button) => {
        if (button.textContent === "Latest Down")
          button.addEventListener("click", capture, { once: true });
      });
    });
    await page.getByRole("button", { name: "Latest Down", exact: true }).dispatchEvent("click");
    await page.clock.runFor(512);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { latestPriceSamples: unknown[] }).latestPriceSamples.length,
        ),
      )
      .toBeGreaterThan(20);
    const samples = await page.evaluate(
      () =>
        (
          window as unknown as {
            latestPriceSamples: {
              price: string | null;
              candle: string | null;
              historical: string | null;
            }[];
          }
        ).latestPriceSamples,
    );
    const prices = new Set(samples.map((sample) => sample.price));
    const candles = new Set(samples.map((sample) => sample.candle));
    if (reduced) {
      expect(prices.size).toBeLessThanOrEqual(2);
      expect(candles.size).toBeLessThanOrEqual(2);
    } else {
      expect(prices.size).toBeGreaterThan(3);
      expect(candles.size).toBeGreaterThan(3);
    }
    expect(new Set(samples.map((sample) => sample.historical)).size).toBe(1);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}
