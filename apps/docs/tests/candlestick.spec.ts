import { expect, test } from "@playwright/test";
import { isCoreVersionAvailable } from "../../../registry/catalog.mjs";
import { docRoute, publicPath } from "../lib/routing.mjs";

const marks = '[data-kind-ui="candlestick-mark"]';

test("Candlestick docs preserve original OHLC, quote metadata, live updates and release prerequisites", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`.${docRoute("/docs/components/candlestick/")}`);
  await expect(
    page.getByRole("heading", { name: "Candlestick Chart", exact: true, level: 1 }),
  ).toBeVisible();
  const asset = page.locator('[data-component="candlestick"]');
  await expect(asset.locator(marks)).toHaveCount(12);
  await expect(asset.locator('[data-kind-ui="candlestick-volume-mark"]')).toHaveCount(12);
  await expect(asset.locator('[data-candle-part="doji"]')).toHaveCount(1);
  await asset.getByRole("button", { name: "6 sessions", exact: true }).click();
  // Six visible intervals plus one explicit overscan record retain their original extrema.
  await expect(asset.locator(marks)).toHaveCount(7);
  await asset.getByRole("button", { name: "All sessions", exact: true }).click();
  await expect(asset.locator(marks)).toHaveCount(12);
  await asset.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("Home");
  await expect(asset.locator('[data-kind-ui="candlestick-content"]')).toContainText("09-21");
  await expect(asset.locator('[data-kind-ui="candlestick-content"]')).toContainText("$121.60");

  const binary = page.locator('[data-component="candlestick-binary"]');
  await expect(binary.locator(marks)).toHaveCount(6);
  await expect(binary.locator('[data-kind-ui="candlestick-volume-mark"]')).toHaveCount(0);
  await binary.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("End");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("Bid quotes");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("partial");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("$0.59");

  const updates = page.locator('[data-component="candlestick-updates"]');
  const table = updates.getByRole("table", { name: "Current observations", exact: true });
  await expect(table.locator("tbody tr")).toHaveCount(5);
  await expect(updates.locator(marks)).toHaveCount(4);
  await expect(table).toContainText("Gap");
  const volumeCells = table.locator("tbody tr td:nth-child(6)");
  await expect(volumeCells).toHaveText(["—", "—", "—", "—", "—"]);
  await updates.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(table.locator('tr[data-selected="true"]')).toContainText("$78.00");
  await updates.getByRole("button", { name: "Replace current", exact: true }).click();
  await expect(table.locator('tr[data-selected="true"]')).toContainText("$79.00");
  await expect(table.locator('tr[data-selected="true"]')).toContainText("partial replacement");
  await updates.getByRole("button", { name: "Correct older", exact: true }).click();
  await expect(table.locator("tbody tr").first()).toContainText("$70.00");
  await expect(table.locator("tbody tr").first()).toContainText("corrected");
  await updates.getByRole("button", { name: "Append", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(6);
  await expect(table.locator('tr[data-selected="true"]')).toContainText("final");
  await updates.getByRole("button", { name: "Prepend", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(7);
  await expect(table.locator('tr[data-selected="true"]')).toContainText("$79.00");
  await expect(table).toContainText("Explicit gap");

  if (!isCoreVersionAvailable("0.6.0")) {
    const notice = page.locator('[data-release-pending="0.6.0"]');
    await expect(notice).toContainText("Published Core 0.5.0 does not include these APIs");
    await expect(notice).toContainText("Public npm and registry installation require Core 0.6.0");
    await expect(
      page.getByText("npx shadcn@latest add @kind-ui/candlestick-chart", { exact: true }),
    ).toHaveCount(0);
    const manifest = await page.request.get(publicPath("/examples/candlestick/package.json"));
    expect(manifest.ok()).toBe(true);
    expect(await manifest.json()).toMatchObject({ dependencies: { "@kind-ui/charts": "^0.6.0" } });
    await asset.getByRole("button", { name: "Copy prompt", exact: true }).click();
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    expect(prompt).toContain("Published Core 0.5.0 lacks this family");
    expect(prompt).toContain("Public installation requires Core 0.6.0 or later");
    expect(prompt).toContain("https://kindui.dev/charts/docs/");
  }
  expect(errors).toEqual([]);
});
