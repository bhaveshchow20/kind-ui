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

test("Next pattern legends keep server IDs through hydration and native bars stay scoped", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.request.get("http://127.0.0.1:6901");
  const html = await response.text();
  const serverIds = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
  expect(serverIds).toHaveLength(6);
  expect(new Set(serverIds).size).toBe(6);
  await page.goto("http://127.0.0.1:6901");
  const proof = page.locator("[data-pattern-hydration]");
  const swatches = proof.locator("[data-fill-pattern] pattern");
  await expect(swatches).toHaveCount(6);
  expect(await swatches.evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(serverIds);
  const marks = proof.locator(".recharts-bar-rectangle path");
  await expect(marks).toHaveCount(12);
  const ids = await proof.locator("pattern").evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(12);
  expect(
    await marks.evaluateAll((nodes) =>
      nodes.every((node) => {
        const id = node.getAttribute("fill")?.match(/^url\(#(.+)\)$/)?.[1];
        return id && node.closest("svg")?.querySelector(`[id="${id}"]`);
      }),
    ),
  ).toBe(true);
  await proof.getByRole("button", { name: "First", exact: true }).first().click();
  await expect(marks).toHaveCount(8);
  expect(await swatches.evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(serverIds);
  expect(errors).toEqual([]);
});


test("Next color resources retain server IDs through hydration and theme changes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.request.get("http://127.0.0.1:6901");
  const html = await response.text();
  const serverIds = [...html.matchAll(/<linearGradient[^>]*id="(kind-ui-color-[^"]+)"/g)].map(
    (match) => match[1],
  );
  expect(serverIds).toHaveLength(2);
  expect(new Set(serverIds).size).toBe(2);
  await page.goto("http://127.0.0.1:6901");
  const proof = page.locator("[data-color-hydration]");
  const resources = proof.locator('[data-kind-ui="color-resources"] linearGradient');
  await expect(resources).toHaveCount(2);
  expect(await resources.evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(serverIds);
  const marks = proof.locator(".recharts-line-curve");
  await expect(marks).toHaveCount(2);
  const before = await marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  await page.getByRole("button", { name: "Color theme", exact: true }).click();
  await expect(resources.first().locator("stop").first()).toHaveCSS(
    "stop-color",
    "rgb(255, 255, 255)",
  );
  expect(await resources.evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(serverIds);
  expect(await marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")))).toEqual(
    before,
  );
  expect(errors).toEqual([]);
});
