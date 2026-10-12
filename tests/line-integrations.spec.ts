import { expect, test } from "@playwright/test";
import { expectHiddenPaint } from "./interaction-paint";
import { expectLastVisibleGuard } from "./last-visible";

test("Tailwind v4 utilities override Kind defaults and named Lucide icons use the existing decorative slot", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const svg = page.getByRole("application", { name: "Monthly icon totals" });
  await expect(svg).toHaveAttribute("height", "320");
  const root = page.locator('[data-kind-ui="chart"]').filter({ has: svg });
  const legend = root.locator('[data-kind-ui="chart-legend"]');
  await expect(legend).toHaveCSS("gap", "24px");
  await expect(legend).toHaveCSS("padding", "16px");
  const icon = legend.locator('[data-kind-ui="chart-icon"]');
  await expect(icon).toHaveAttribute("aria-hidden", "true");
  await expect(icon.locator("svg.lucide-trending-up")).toHaveCount(1);
  await expect(legend.getByRole("button", { name: "Total", exact: true })).toBeVisible();
  await expect(
    root.locator(".recharts-cartesian-grid-horizontal line").first(),
  ).not.toHaveAttribute("stroke", "#d1d5db");
  const gridStroke = await root
    .locator(".recharts-cartesian-grid-horizontal line")
    .first()
    .evaluate((line) => getComputedStyle(line).stroke);
  expect(gridStroke).toContain("oklch");
  await expectLastVisibleGuard(
    legend.getByRole("button", { name: "Total", exact: true }),
    root.locator(".recharts-line-curve"),
  );
  expect(errors).toEqual([]);
});

test("Next App Router package client boundary hydrates serializable server props and client callbacks/icons", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(String(testInfo.project.metadata.nextURL));
  await expect(page.getByRole("application", { name: "Server boundary totals" })).toBeVisible();
  const chart = page.getByRole("application", { name: "Monthly icon totals" });
  await expect(chart).toBeVisible();
  const root = page.locator('[data-kind-ui="chart"]').filter({ has: chart });
  await expect(root.locator("svg.lucide-trending-up")).toHaveCount(1);
  await expectLastVisibleGuard(
    root.getByRole("button", { name: "Total", exact: true }),
    root.locator(".recharts-line-curve"),
  );
  expect(errors).toEqual([]);
});

test("Next pattern resources hydrate from responsive shells and native bars stay scoped", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.request.get(String(testInfo.project.metadata.nextURL));
  const html = await response.text();
  const serverIds = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
  expect(serverIds).toHaveLength(0);
  await page.goto(String(testInfo.project.metadata.nextURL));
  const proof = page.locator("[data-pattern-hydration]");
  const swatches = proof.locator("[data-fill-pattern] pattern");
  await expect(swatches).toHaveCount(6);
  const swatchIds = await swatches.evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(swatchIds).size).toBe(6);
  const plotPatterns = proof.locator("svg.recharts-surface pattern");
  await expect(plotPatterns).toHaveCount(6);
  const plotIds = await plotPatterns.evaluateAll((nodes) => nodes.map((node) => node.id));
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
  await expect(marks).toHaveCount(12);
  await expectHiddenPaint(proof.locator('[data-series="first"] .recharts-bar-rectangle path'));
  expect(await swatches.evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(swatchIds);
  expect(await plotPatterns.evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(plotIds);
  expect(errors).toEqual([]);
});

test("Next color resources retain server IDs through hydration and theme changes", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.request.get(String(testInfo.project.metadata.nextURL));
  const html = await response.text();
  const serverIds = [...html.matchAll(/<linearGradient[^>]*id="(kind-ui-color-[^"]+)"/g)].map(
    (match) => match[1],
  );
  expect(serverIds).toHaveLength(2);
  expect(new Set(serverIds).size).toBe(2);
  await page.goto(String(testInfo.project.metadata.nextURL));
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

for (const host of ["vite", "next"] as const) {
  test(`${host}: semantic themes inherit, locally scoped themes apply and utility/inline overrides remain predictable`, async ({
    page,
  }, testInfo) => {
    await page.goto(host === "next" ? String(testInfo.project.metadata.nextURL) : "/");
    const proof = page.locator("[data-theme-proof]");
    const semantic = proof.locator('[data-theme-case="semantic"]');
    const tokens = proof.locator('[data-theme-case="tokens"]');
    const utilities = proof.locator('[data-theme-case="utilities"]');
    const box = (root: ReturnType<typeof page.locator>) =>
      root.locator('[data-kind-ui="chart-tooltip"]');
    await expect(semantic).toHaveCSS("color", "rgb(30, 40, 50)");
    await expect(box(semantic)).toHaveCSS("background-color", "rgb(250, 245, 240)");
    await expect(box(semantic)).toHaveCSS("border-color", "rgb(160, 170, 180)");
    await expect(box(semantic)).toHaveCSS("border-radius", "10px");
    await expect(semantic.locator('[data-kind-ui="chart-indicator"]').first()).toHaveCSS(
      "background-color",
      "rgb(30, 120, 90)",
    );
    await expect(tokens).toHaveCSS("color", "rgb(100, 40, 150)");
    await expect(tokens).toHaveCSS("font-family", "monospace");
    await expect(box(tokens)).toHaveCSS("background-color", "rgb(240, 220, 250)");
    await expect(box(tokens)).toHaveCSS("border-color", "rgb(120, 60, 180)");
    await expect(box(tokens)).toHaveCSS("border-radius", "14px");
    await expect(utilities).toHaveCSS("width", "288px");
    await expect(utilities.locator('[data-kind-ui="chart-legend"]')).toHaveCSS("gap", "24px");
    await expect(box(utilities)).toHaveCSS("padding-top", "20px");
    await expect(box(utilities)).toHaveCSS("padding-bottom", "7px");
    await expect(box(utilities)).toHaveCSS("border-radius", "0px");
    expect(await box(utilities).evaluate((el) => getComputedStyle(el).backgroundColor)).toContain(
      "oklch",
    );
    const properties = proof.locator('[data-theme-case="properties"]');
    await expect(properties).toHaveCSS("width", "240px");
    await expect(properties).toHaveCSS("color", "rgb(70, 80, 90)");
    await expect(box(properties)).toHaveCSS("padding", "24px");
    await expect(box(properties)).toHaveCSS("color", "rgb(20, 30, 40)");
    const heatmap = proof.locator('[data-theme-case="heatmap-overrides"]');
    await expect(heatmap.locator('[data-kind-ui="heatmap-grid"]')).toHaveCSS(
      "border-spacing",
      "24px",
    );
    await expect(heatmap.locator("td")).toHaveCSS("background-image", "none");
    const plot = proof.locator('[title="Semantic plot"]');
    await expect(plot.locator(".recharts-cartesian-grid line").first()).toHaveCSS(
      "stroke",
      "rgb(160, 170, 180)",
    );
    await expect(plot.locator(".recharts-cartesian-axis-tick-value").first()).toHaveCSS(
      "fill",
      "rgb(90, 100, 110)",
    );
    await proof.getByRole("button", { name: "Toggle semantic theme" }).click();
    await expect(semantic).toHaveCSS("color", "rgb(230, 235, 240)");
    await expect(box(semantic)).toHaveCSS("background-color", "rgb(20, 25, 30)");
    await expect(box(semantic)).toHaveCSS("color", "rgb(220, 225, 230)");
    await expect(semantic.locator('[data-kind-ui="chart-indicator"]').first()).toHaveCSS(
      "background-color",
      "rgb(90, 200, 150)",
    );
    await expect(plot.locator(".recharts-cartesian-axis-tick-value").first()).toHaveCSS(
      "fill",
      "rgb(190, 195, 200)",
    );
    await expect(box(tokens)).toHaveCSS("background-color", "rgb(240, 220, 250)");
  });
}

test("candlestick public compound hydrates at both pinned peer combinations", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(String(info.project.metadata.nextURL));
  const host = page.locator("[data-candlestick-hydration]");
  await expect(host.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(2);
  await expect(host.getByRole("table")).toContainText("55.0 probability points");
  await host.getByRole("button", { name: "Correct candle" }).click();
  await expect(host.getByRole("table")).toContainText("65.0 probability points");
  await host.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("Home");
  await expect(host.locator('[data-kind-ui="candlestick-content"]')).toContainText(
    "65.0 probability points",
  );
  expect(errors).toEqual([]);
});
