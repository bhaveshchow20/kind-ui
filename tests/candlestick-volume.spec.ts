import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4205 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;

for (const shape of ["function", "element", "object", "false", "default"]) {
  test(`Volume ${shape} uses the candle center with native Bar grouping`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}/?${shape === "default" ? "" : `centered-volume=${shape}`}&padded-x`);
    const wick = page.locator('[data-candle-part="wick"]').first();
    const drawing = page
      .locator(
        shape === "default"
          ? '[data-series="volume"] [data-kind-ui="candlestick-volume-mark"]'
          : '[data-series="volume"] .recharts-bar-rectangles rect,path',
      )
      .first();
    await expect(drawing).toBeVisible();
    const checkCenter = async () => {
      await expect
        .poll(async () => {
          const candle = await wick.boundingBox();
          const volume = await drawing.boundingBox();
          if (!candle || !volume) return Infinity;
          return Math.abs(candle.x + candle.width / 2 - volume.x - volume.width / 2);
        })
        .toBeLessThan(0.1);
    };
    await checkCenter();
    await page.getByRole("button", { name: "Spacing", exact: true }).click();
    await checkCenter();
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await checkCenter();
    expect(errors).toEqual([]);
  });
}
