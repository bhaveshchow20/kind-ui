import { expect, test } from "@playwright/test";

const port = 4198 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
test("theme stops switch in place across chart paints and swatches", async ({
  page,
  baseURL,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(
    testInfo.project.name === "series-colors-focused"
      ? `${baseURL}?theme`
      : `http://127.0.0.1:${port}/?theme`,
  );
  const roots = page.locator('[data-kind-ui="chart"]');
  const gradients = page.locator('[data-kind-ui="color-resources"] linearGradient');
  await expect(gradients).toHaveCount(2);
  const allGradients = page.locator("linearGradient");
  await expect(allGradients).toHaveCount(10);
  const allIds = await allGradients.evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(allIds).size).toBe(10);
  const ids = await gradients.evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(2);
  const stops = gradients.first().locator("stop");
  await expect(stops.nth(0)).toHaveCSS("stop-color", "rgb(255, 0, 0)");
  await expect(stops.nth(2)).toHaveCSS("stop-color", "rgb(0, 0, 255)");
  const marks = roots
    .first()
    .locator(
      ".recharts-line-curve, .recharts-area-area, .recharts-bar-rectangle path, path.recharts-sector",
    );
  await expect(marks).toHaveCount(6);
  const before = await marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  await roots.first().evaluate((node) => {
    node.setAttribute("data-retained", "yes");
  });
  for (const selector of [
    ".recharts-line-curve",
    ".recharts-area-area",
    ".recharts-bar-rectangle path",
    "path.recharts-sector",
  ]) {
    const attribute = selector.includes("line") ? "stroke" : "fill";
    const mark = roots.first().locator(selector).first();
    const resource = await mark.evaluate(
      (node) => node.closest("svg")?.querySelector("linearGradient")?.id,
    );
    await expect(mark).toHaveAttribute(attribute, `url(#${resource})`);
  }
  const legend = roots
    .first()
    .locator('[data-kind-ui="chart-legend"] [data-kind-ui="chart-indicator"]')
    .first();
  const tooltip = roots
    .first()
    .locator('[data-kind-ui="chart-tooltip"] [data-kind-ui="chart-indicator"]');
  expect(await legend.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain(
    "linear-gradient",
  );
  expect(await tooltip.evaluate((node) => getComputedStyle(node).backgroundImage)).toEqual(
    await legend.evaluate((node) => getComputedStyle(node).backgroundImage),
  );
  const bar = roots.first().locator(".recharts-bar-rectangle path").first();
  const box = await bar.boundingBox();
  if (!box) throw new Error("Missing rendered bar");
  const pixels = await page.evaluate(
    async ({ png, box }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Missing canvas context");
      context.drawImage(img, 0, 0);
      return [0.15, 0.85].map((fraction) =>
        Array.from(
          context.getImageData(
            Math.round(box.x + box.width * fraction),
            Math.round(box.y + box.height / 2),
            1,
            1,
          ).data,
        ),
      );
    },
    { png: (await page.screenshot()).toString("base64"), box },
  );
  expect(pixels[0]![0]! - pixels[1]![0]!).toBeGreaterThan(20);
  expect(pixels[1]![2]! - pixels[0]![2]!).toBeGreaterThan(20);
  await page.screenshot({ path: testInfo.outputPath("light.png"), fullPage: true });
  await page.getByRole("button", { name: "Theme", exact: true }).click();
  await expect(stops.nth(0)).toHaveCSS("stop-color", "rgb(255, 255, 255)");
  await expect(stops.nth(1)).toHaveCSS("stop-color", "rgb(128, 128, 128)");
  await expect(stops.nth(2)).toHaveCSS("stop-color", "rgb(0, 0, 0)");
  await page.screenshot({ path: testInfo.outputPath("dark.png"), fullPage: true });
  expect(await gradients.evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(ids);
  await expect(roots.first()).toHaveAttribute("data-retained", "yes");
  expect(await marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")))).toEqual(
    before,
  );
  await page.getByRole("button", { name: "Override", exact: true }).click();
  for (const selector of [
    ".recharts-line-curve",
    ".recharts-area-area",
    ".recharts-bar-rectangle path",
    "path.recharts-sector",
  ]) {
    await expect(roots.first().locator(selector).first()).toHaveAttribute(
      selector.includes("line") ? "stroke" : "fill",
      "#00ff00",
    );
  }
  await page.getByRole("button", { name: "Override", exact: true }).click();
  await page.getByRole("button", { name: "Pattern", exact: true }).click();
  await expect(roots.first().locator(".recharts-bar-rectangle path").first()).toHaveAttribute(
    "fill",
    /kind-ui-pattern/,
  );
  await expect(roots.first().locator("pattern rect").first()).toHaveAttribute(
    "fill",
    "var(--color-value)",
  );
  await expect(roots.first().locator("pattern rect").first()).toHaveCSS(
    "fill",
    "rgb(255, 255, 255)",
  );
  await page.screenshot({ path: testInfo.outputPath("pattern.png"), fullPage: true });
  const symbolLegend = roots.first().getByTestId("symbols");
  const symbol = symbolLegend.locator('[data-legend-shape="square"]');
  expect(await symbol.evaluate((node) => getComputedStyle(node).fill)).toContain(ids[0]);
  await symbolLegend.getByRole("button", { name: "Value", exact: true }).click();
  const hiddenColor = await symbol.evaluate((node) => getComputedStyle(node).color);
  await expect(symbol).toHaveCSS("fill", hiddenColor);
  await symbolLegend.getByRole("button", { name: "Value", exact: true }).click();
  await page.getByRole("button", { name: "Solid", exact: true }).click();
  await expect(allGradients).toHaveCount(0);
  await expect(roots.first().locator(".recharts-line-curve")).toHaveAttribute(
    "stroke",
    "var(--color-value)",
  );
  await page.getByRole("button", { name: "Solid", exact: true }).click();
  await expect(allGradients).toHaveCount(10);
  expect(await allGradients.evaluateAll((nodes) => nodes.map((node) => node.id))).toEqual(allIds);
  expect(errors).toEqual([]);
});
