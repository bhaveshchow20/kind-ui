import { expect, test } from "@playwright/test";

test("public components share configuration and preserve missing, zero and hidden values", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const chart = page.getByRole("application", { name: "Task outcomes by day" });
  await expect(chart).toBeVisible();
  await expect(page.getByRole("row", { name: "Thu 64 tasks 0 tasks" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("chart-default.png"), fullPage: true });
  const completed = page.getByRole("button", { name: "Completed", exact: true });
  await completed.focus();
  await page.keyboard.press("Space");
  await expect(completed).toBeFocused();
  await expect(completed).toHaveAttribute("aria-pressed", "false");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  const status = page.getByRole("status");
  await expect(status).toContainText("Needs review");
  await expect(status).not.toContainText("Completed");
  await expect(status).toHaveAttribute("aria-live", "assertive");
  await completed.click();
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(status).toContainText("No data");
  await page.screenshot({ path: info.outputPath("chart-tooltip.png"), fullPage: true });
  await page.keyboard.press("Escape");
  await expect(status).not.toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(status).toContainText("0 tasks");
  await completed.focus();
  await expect(status).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("legend keyboard toggles retain focus through all-hidden and empty recovery", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  const review = page.getByRole("button", { name: "Needs review", exact: true });
  await review.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Select a series to show it.");
  await expect(review).toBeFocused();
  await expect(page.getByRole("row", { name: "Mon 42 tasks 12 tasks" })).toBeVisible();
  await review.click();
  await expect(page.getByRole("application")).toBeVisible();
  await page.getByLabel("Empty data").check();
  await expect(page.getByRole("status")).toHaveText("No data yet.");
  await page.screenshot({ path: info.outputPath("chart-empty.png"), fullPage: true });
  await page.getByLabel("Empty data").uncheck();
  await expect(page.getByRole("application")).toBeVisible();
  for (let i = 0; i < 10; i++) await review.click();
  await expect(review).toHaveAttribute("aria-pressed", "true");
});

test("controlled state stays authoritative and native props/refs reach the DOM", async ({
  page,
}) => {
  await page.goto("/contracts.html");
  const a = page.getByRole("region", { name: "A", exact: true });
  const button = a.getByRole("button", { name: "A tasks" });
  await button.click();
  await expect(page.getByRole("status", { name: "A request" })).toHaveText("count");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(a.locator('[data-owner="A"]')).toHaveAttribute("data-forwarded", "container");
  await expect(a.getByRole("list")).toHaveAttribute("data-forwarded", "legend");
  await expect(a.getByRole("list")).toHaveAttribute("data-clicked", "yes");
  await a.getByLabel("Hold A changes").uncheck();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await a.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(a.getByRole("status", { name: "A tooltip" })).toHaveAttribute(
    "data-forwarded",
    "tooltip",
  );
});

test("two independent containers isolate metadata, keyboard tooltips and resizing", async ({
  page,
}) => {
  await page.goto("/contracts.html");
  const a = page.getByRole("region", { name: "A", exact: true });
  const b = page.getByRole("region", { name: "B", exact: true });
  for (const [scope, name] of [
    [a, "A"],
    [b, "B"],
  ] as const) {
    await scope.getByLabel(`Hold ${name} changes`).uncheck();
    await scope.getByRole("button").click();
  }
  await a.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(a.getByRole("status", { name: "A tooltip" })).toContainText("A tasks");
  await b.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(a.getByRole("status", { name: "A tooltip" })).not.toBeVisible();
  await expect(b.getByRole("status", { name: "B tooltip" })).toContainText("B tasks");
  await expect(b.getByRole("status", { name: "B tooltip" })).not.toContainText("A tasks");
  await a.getByRole("button").click();
  await expect(b.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  const before = await b.getByRole("application").boundingBox();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect
    .poll(async () => (await b.getByRole("application").boundingBox())?.width ?? 0)
    .toBeLessThan(before?.width ?? 0);
});

test("compact example fits mobile and retains the data alternative", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Needs review" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Needs review Hidden" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath("chart-mobile.png"), fullPage: true });
});
