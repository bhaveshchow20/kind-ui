import { expect, type Locator, test } from "./browser";

const url = "http://127.0.0.1:4179/gallery.html";
const radarModes = [
  "default",
  "dots",
  "lines-only",
  "label-custom",
  "grid-custom",
  "grid-none",
  "grid-circle",
  "grid-circle-no-lines",
  "grid-circle-fill",
  "grid-fill",
  "multiple",
  "legend",
];
const radialModes = ["simple", "label", "grid", "text", "shape", "stacked"];
const labels = '[data-kind-ui="radial-label"][data-fit="yes"]';
async function validPaths(scope: Locator) {
  const paths = await scope
    .locator("path")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d") ?? ""));
  expect(paths.join()).not.toMatch(/NaN|Infinity/);
}
async function labelsFit(scope: Locator) {
  const results = await scope.locator(labels).evaluateAll((nodes) =>
    nodes.map((node) => {
      const text = node as SVGTextElement;
      const cx = Number(text.dataset.cx),
        cy = Number(text.dataset.cy);
      const inner = Number(text.dataset.innerRadius),
        outer = Number(text.dataset.outerRadius);
      const start = Number(text.dataset.startAngle),
        end = Number(text.dataset.endAngle);
      const sign = Math.sign(end - start),
        delta = Math.abs(end - start);
      const points = Array.from({ length: text.getNumberOfChars() }, (_, index) => {
        const box = text.getExtentOfChar(index);
        return [box.x, box.x + box.width].every((x) =>
          [box.y, box.y + box.height].every((y) => {
            const radius = Math.hypot(x - cx, y - cy);
            const angle = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
            const along = (((sign * (angle - start)) % 360) + 360) % 360;
            return radius >= inner - 1 && radius <= outer + 1 && along <= delta + 1;
          }),
        );
      });
      const href = text.querySelector("textPath")?.getAttribute("href");
      return {
        fits: points.every(Boolean),
        debug: { text: text.textContent, inner, outer, start, end, html: text.outerHTML, points },
        room: text.getComputedTextLength() <= Number(text.dataset.arcLength),
        href,
        fill: getComputedStyle(text).fill,
        size: Number.parseFloat(getComputedStyle(text).fontSize),
      };
    }),
  );
  expect(results.length).toBeGreaterThan(0);
  for (const result of results) {
    expect(result.fits, JSON.stringify(result.debug)).toBe(true);
    expect(result.room).toBe(true);
    expect(result.href).toMatch(/^#/);
    expect(result.size).toBeGreaterThanOrEqual(9);
  }
}

test("all twelve official radar composition paths run through packed public exports", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const host = page.locator('[data-gallery="radar"]');
  for (const mode of radarModes) {
    await host.getByRole("combobox").selectOption(mode);
    await expect(host).toHaveAttribute("data-variant", mode);
    await expect(host.locator(".recharts-radar")).toHaveCount(
      ["lines-only", "label-custom", "multiple", "legend"].includes(mode) ? 2 : 1,
    );
    if (mode === "dots") await expect(host.locator(".recharts-radar-dot")).toHaveCount(5);
    if (mode === "label-custom") await expect(host.locator("[data-gallery-tick]")).toHaveCount(5);
    if (mode === "grid-none") await expect(host.locator(".recharts-polar-grid")).toHaveCount(0);
    else {
      const concentric = host.locator(".recharts-polar-grid-concentric");
      if (mode === "grid-custom") await expect(concentric.locator("path")).toHaveCount(1);
      if (mode.startsWith("grid-circle"))
        expect(await concentric.locator("circle").count()).toBeGreaterThan(0);
      if (["lines-only", "grid-custom", "grid-circle-no-lines"].includes(mode))
        await expect(host.locator(".recharts-polar-grid-angle")).toHaveCount(0);
      if (mode === "grid-fill" || mode === "grid-circle-fill")
        await expect(concentric.locator("circle,path").first()).toHaveAttribute(
          "fill-opacity",
          "0.08",
        );
    }
    await validPaths(host);
    await host.locator('svg[role="application"]').focus();
    await page.keyboard.press("ArrowRight");
    const tooltip = host.locator('[data-kind-ui="chart-tooltip"]');
    if (!(await tooltip.isVisible())) await page.keyboard.press("Enter");
    await expect(tooltip).toBeVisible();
  }
  await host.getByRole("button", { name: "Actual", exact: true }).click();
  await expect(host.locator(".recharts-radar")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("all six official radial paths compose native grids, center summaries, stacks and bounded text", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const host = page.locator('[data-gallery="radial"]');
  for (const mode of radialModes) {
    await host.getByRole("combobox").selectOption(mode);
    await expect(host).toHaveAttribute("data-variant", mode);
    expect(await host.locator(".recharts-radial-bar-sector").count()).toBeGreaterThan(0);
    if (["grid", "text", "shape"].includes(mode))
      expect(await host.locator(".recharts-polar-grid").count()).toBeGreaterThan(0);
    if (["text", "shape", "stacked"].includes(mode)) {
      await expect(host.locator("[data-gallery-summary]")).toHaveCount(1);
      await host.getByRole("checkbox", { name: "Center summary" }).uncheck();
      await expect(host.locator("[data-gallery-summary]")).toHaveCount(0);
      await host.getByRole("checkbox", { name: "Center summary" }).check();
    }
    await validPaths(host);
    await expect(host.locator(labels).first()).toBeVisible();
    await labelsFit(host);
    await host.locator('svg[role="application"]').focus();
    await page.keyboard.press("ArrowRight");
    const tooltip = host.locator('[data-kind-ui="chart-tooltip"]');
    if (!(await tooltip.isVisible())) await page.keyboard.press("Enter");
    await expect(tooltip).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("ring text visibility is independent from tooltip metadata, zero/empty data and phone layout", async ({
  page,
}) => {
  await page.goto(url);
  await page.setViewportSize({ width: 390, height: 844 });
  const host = page.locator('[data-gallery="radial"]');
  await expect(host.locator(labels).first()).toBeVisible();
  await labelsFit(host);
  const before = await host
    .locator(".recharts-radial-bar-sector")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  await page.getByRole("checkbox", { name: "Ring text", exact: true }).uncheck();
  await expect(host.locator('[data-kind-ui="radial-label"]')).toHaveCount(0);
  expect(
    await host
      .locator(".recharts-radial-bar-sector")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
  ).toEqual(before);
  await host.locator('svg[role="application"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(host.locator('[data-kind-ui="chart-tooltip"]')).toContainText("points");
  await page.getByRole("checkbox", { name: "Tooltips", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Ring text", exact: true }).check();
  await expect(host.locator(labels).first()).toBeVisible();
  await host.locator('svg[role="application"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(host.locator('[data-kind-ui="chart-tooltip"]')).not.toBeVisible();
  await page.getByRole("button", { name: "Zero", exact: true }).click();
  await expect(host.locator('[data-kind-ui="radial-label"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Zero", exact: true }).click();
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(host.locator('[data-kind-ui="radial-label"]')).toHaveCount(0);
  await expect(host.locator(".recharts-radial-bar-sector")).toHaveCount(0);
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(host.locator(labels).first()).toBeVisible();
  await labelsFit(host);
});

test("public band label SVG ref attaches and React cleanup runs independently of tooltip state", async ({
  page,
}) => {
  await page.goto(url);
  const probe = page.locator("[data-ref-probe]");
  await expect(probe.locator("output")).toHaveText("1/0");
  await expect(probe.locator('[data-kind-ui="radial-label"]')).toHaveAttribute("data-fit", "yes");
  await page.getByRole("checkbox", { name: "Ring text", exact: true }).uncheck();
  await expect(probe.locator("output")).toHaveText("1/1");
  await expect(probe.locator("text")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Ring text", exact: true }).check();
  await expect(probe.locator("output")).toHaveText("2/1");
  await expect(probe.locator('[data-kind-ui="radial-label"]')).toHaveAttribute("data-fit", "yes");
});
