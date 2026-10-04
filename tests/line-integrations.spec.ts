import { expect, test } from "@playwright/test";

test("Tailwind v4 utilities override Kind defaults and named Lucide icons use the existing decorative slot", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const svg = page.getByRole("application", { name: "Monthly icon totals" });
  await expect(svg).toHaveAttribute("height", "320");
  const legend = page.locator('[data-kind-ui="chart-legend"]');
  await expect(legend).toHaveCSS("gap", "24px");
  await expect(legend).toHaveCSS("padding", "16px");
  const icon = legend.locator('[data-kind-ui="chart-icon"]');
  await expect(icon).toHaveAttribute("aria-hidden", "true");
  await expect(icon.locator("svg.lucide-trending-up")).toHaveCount(1);
  await expect(legend.getByRole("button", { name: "Total" })).toBeVisible();
  await expect(
    page.locator(".recharts-cartesian-grid-horizontal line").first(),
  ).not.toHaveAttribute("stroke", "#d1d5db");
  const gridStroke = await page
    .locator(".recharts-cartesian-grid-horizontal line")
    .first()
    .evaluate((line) => getComputedStyle(line).stroke);
  expect(gridStroke).toContain("oklch");
  await legend.getByRole("button", { name: "Total" }).click();
  await expect(legend.getByRole("button", { name: "Total" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(errors).toEqual([]);
});

test("Next App Router package client boundary hydrates serializable server props and client callbacks/icons", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("http://127.0.0.1:6901");
  await expect(page.getByRole("application", { name: "Server boundary totals" })).toBeVisible();
  const chart = page.getByRole("application", { name: "Monthly icon totals" });
  await expect(chart).toBeVisible();
  const root = page.locator('[data-kind-ui="chart"]').filter({ has: chart });
  await expect(root.locator("svg.lucide-trending-up")).toHaveCount(1);
  await root.getByRole("button", { name: "Total" }).click();
  await expect(root.getByRole("button", { name: "Total" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(errors).toEqual([]);
});
