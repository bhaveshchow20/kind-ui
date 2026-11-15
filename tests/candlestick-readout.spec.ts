import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4204 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?selection-contract&default-readout&crosshair-contract`;

test("Readout follows inspection then latest while selection and latest price remain independent", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const readout = page.getByTestId("default-readout");
  await expect(readout).toContainText("3000");
  await expect(page.locator("[data-consumer-slot]")).toHaveText("Consumer summary");
  const frame = page.locator('[data-kind-ui="chart"]').first();
  await frame.focus();
  await page.keyboard.press("Home");
  await expect(readout).toContainText("1000");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Selection callbacks")).toHaveText("[1000]");
  await page
    .getByRole("button", { name: "Update latest", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await expect(readout).toContainText("1000");
  await expect(page.locator('[data-current-price-part="label"]')).toContainText("12");
  await page.getByRole("button", { name: "Update latest", exact: true }).focus();
  await expect(readout).toContainText("3000");
  await expect(page.getByLabel("Selection callbacks")).toHaveText("[1000]");
  expect(errors).toEqual([]);
});

test("Readout shares animated digits, reduced motion and series dimming without a floating tooltip", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}&omit-tooltip`);
  const readout = page.getByTestId("default-readout");
  await expect(readout.locator('[data-kind-ui="tooltip-number"]')).not.toHaveCount(0);
  await expect(page.getByTestId("financial-tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "Highlight Observed price", exact: true }).click();
  await expect(readout.locator('[data-series="volume"]')).toHaveAttribute("data-inactive", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(readout.locator('[data-kind-ui="tooltip-number"]')).toHaveCount(0);
});

test("loading suppresses readout, values and composition slot; ready restores them", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByTestId("default-readout")).toBeVisible();
  await page.getByRole("button", { name: "Toggle loading", exact: true }).click();
  await expect(page.getByTestId("default-readout")).toHaveCount(0);
  await expect(page.locator("[data-consumer-slot]")).toBeHidden();
  await expect(page.locator('[data-kind-ui="chart-loading-skeleton"]')).toBeVisible();
  await page.getByRole("button", { name: "Toggle loading", exact: true }).click();
  await expect(page.getByTestId("default-readout")).toContainText("3000");
});

test("optional tooltip follows the cursor while inspection remains on the same candle", async ({
  page,
}) => {
  await page.goto(url);
  const wick = await page.locator('[data-candle-part="wick"]').first().boundingBox();
  if (!wick) throw new Error("Missing candle wick");
  await page.mouse.move(wick.x, wick.y + wick.height / 2);
  const tooltip = page.getByTestId("financial-tooltip");
  await expect(tooltip).toBeVisible();
  const initial = await tooltip.boundingBox();
  await page.mouse.move(wick.x + 15, wick.y + wick.height / 2 + 15);
  await expect
    .poll(async () => (await tooltip.boundingBox())?.x ?? 0)
    .toBeGreaterThan((initial?.x ?? 0) + 5);
  await expect(page.getByTestId("default-readout")).toContainText("1000");
});
