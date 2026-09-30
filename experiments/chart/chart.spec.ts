import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { formatValue } from "./data";

test("keeps the full production fixture within its provisional JS budget", () => {
  const assets = new URL("./dist/assets/", import.meta.url);
  const bytes = readdirSync(assets)
    .filter((name) => name.endsWith(".js"))
    .reduce((sum, name) => sum + gzipSync(readFileSync(new URL(name, assets))).byteLength, 0);
  console.info(`Full fixture JavaScript: ${bytes} gzip bytes (budget: 250000)`);
  expect(bytes).toBeLessThanOrEqual(250000);
});

test("formats missing data separately from zero and rejects non-finite input", () => {
  expect(formatValue(null)).toBe("No data");
  expect(formatValue(0)).toBe("0");
  expect(formatValue(1200)).toBe("1,200");
  expect(() => formatValue(Number.NaN)).toThrow("finite numbers or null");
  expect(() => formatValue(Number.POSITIVE_INFINITY)).toThrow("finite numbers or null");
});

test("keeps table values and keyboard tooltip consistent with controlled visibility", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const chart = page.getByRole("application", { name: "Task outcomes by day" });
  await expect(chart).toBeVisible();
  await expect(page.getByRole("row", { name: "Wed No data 14" })).toBeVisible();
  await expect(page.getByRole("row", { name: "Thu 64 0" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("chart-default.png"), fullPage: true });

  const completed = page.getByRole("button", { name: "Completed" });
  await completed.focus();
  await page.keyboard.press("Space");
  await expect(completed).toBeFocused();
  await expect(completed).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("columnheader", { name: "Completed Hidden in chart" })).toBeVisible();
  await expect(page.getByRole("row", { name: "Mon 42 12" })).toBeVisible();
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  const tooltip = page.getByRole("status");
  await expect(tooltip).toContainText("Needs review:");
  await expect(tooltip).not.toContainText("Completed:");
  await expect(tooltip).toHaveAttribute("aria-live", "assertive");

  await completed.click();
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(tooltip).toContainText("Completed:");
  await page.screenshot({ path: info.outputPath("chart-tooltip.png"), fullPage: true });

  const review = page.getByRole("button", { name: "Needs review" });
  const start = performance.now();
  for (let index = 0; index < 20; index++) await review.click();
  const elapsed = performance.now() - start;
  console.info(`Twenty legend toggles: ${elapsed.toFixed(0)} ms (guard: 5000 ms)`);
  expect(elapsed).toBeLessThan(5000);
  await expect(review).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("recovers from all-hidden, empty and all-missing scenarios", async ({ page }, info) => {
  await page.goto("/");
  const completed = page.getByRole("button", { name: "Completed" });
  const review = page.getByRole("button", { name: "Needs review" });
  await completed.click();
  await review.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText(
    "All series are hidden. Select a series to show it.",
  );
  await expect(page.getByRole("row", { name: "Mon 42 12" })).toBeVisible();
  await expect(review).toBeFocused();
  await review.click();
  await expect(page.getByRole("application")).toBeVisible();

  await page.getByLabel("Data scenario").selectOption("empty");
  await expect(page.getByRole("status")).toHaveText("No task data yet.");
  await expect(page.getByRole("table")).toContainText("No task data yet.");
  await page.screenshot({ path: info.outputPath("chart-empty.png"), fullPage: true });
  await page.getByLabel("Data scenario").selectOption("missing");
  await expect(page.getByRole("status")).toHaveText("No values for the selected series.");
  await expect(page.getByRole("row", { name: "Mon No data No data" })).toBeVisible();
  await page.getByLabel("Data scenario").selectOption("sample");
  await expect(page.getByRole("application")).toBeVisible();
  await expect(completed).toHaveAttribute("aria-pressed", "false");
});

test("fits a narrow viewport without losing native controls or the table", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("application")).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Needs review" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Needs review Hidden in chart" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("chart-mobile.png"), fullPage: true });
});
