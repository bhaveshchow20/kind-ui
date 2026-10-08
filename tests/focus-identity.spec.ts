import { expect, test } from "@playwright/test";

const geometry = '[data-kind-ui="series-interaction"] path';
for (const family of ["line", "area", "bar", "combo", "radar"]) {
  test(`${family}: repeated and interrupted focus retains series geometry and identity`, async ({
    page,
  }) => {
    await page.goto("/");
    const plot = page.locator(`#${family}`);
    await expect(plot.locator(geometry)).not.toHaveCount(0);
    await page.waitForTimeout(900);
    const snapshot = () =>
      plot.locator('[data-kind-ui="series-interaction"]').evaluateAll((nodes) =>
        nodes.map((node) => ({
          key: node.getAttribute("data-series"),
          paths: [...node.querySelectorAll("path")].map((path) => path.getAttribute("d")),
        })),
      );
    const baseline = await snapshot();
    await plot.locator(geometry).evaluateAll((nodes) =>
      nodes.forEach((node, index) => {
        node.setAttribute("data-lifetime", String(index));
      }),
    );
    const lifetime = () =>
      plot
        .locator(geometry)
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-lifetime")));
    const before = await lifetime();
    for (let repeat = 0; repeat < 3; repeat++) {
      for (const key of ["first", "second"]) {
        const legend = plot.locator(`[data-legend-key="${key}"]`);
        await legend.hover();
        expect(await snapshot()).toEqual(baseline);
        await legend.click();
        await page.mouse.move(0, 0);
        await expect(legend).toHaveAttribute("aria-pressed", "true");
        await expect(
          plot.locator(
            `[data-series="${key === "first" ? "second" : "first"}"] > [data-kind-ui="series-interaction-paint"]`,
          ),
        ).toHaveCSS("opacity", "0.28");
        expect(await snapshot()).toEqual(baseline);
        // Retarget while pointer and persistent focus overlap.
        await plot
          .locator(`[data-kind-ui="series-interaction"][data-series="${key}"] path`)
          .first()
          .dispatchEvent("pointerenter", { pointerType: "mouse" });
        await plot
          .locator(`[data-kind-ui="series-interaction"][data-series="${key}"] path`)
          .first()
          .click({ force: true });
        await page.keyboard.press("Escape");
        expect(await snapshot()).toEqual(baseline);
      }
    }
    expect(await lifetime()).toEqual(before);
    await plot.getByRole("button", { name: "Reorder", exact: true }).click();
    expect((await snapshot()).sort((a, b) => String(a.key).localeCompare(String(b.key)))).toEqual(
      baseline,
    );
  });
}
for (const family of ["line", "area", "combo"]) {
  test(`${family}: explicit hide/show and interrupted show preserve surviving data and pointer payload`, async ({
    page,
  }) => {
    await page.goto("/");
    const plot = page.locator(`#${family}`);
    await expect(plot.locator(geometry)).not.toHaveCount(0);
    await page.waitForTimeout(900);
    const ownPaths = (key: string) =>
      plot
        .locator(`[data-kind-ui="series-interaction"][data-series="${key}"] path`)
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    const first = await ownPaths("first");
    const second = await ownPaths("second");
    const hide = plot.getByRole("button", { name: "External hide", exact: true });
    for (let repeat = 0; repeat < 3; repeat++) {
      await hide.click();
      await page.waitForTimeout(repeat === 0 ? 250 : 30);
      expect(await ownPaths("second")).toEqual(second);
      await hide.click();
      await expect.poll(() => ownPaths("first")).toEqual(first);
      expect(await ownPaths("second")).toEqual(second);
    }
    const surface = plot.locator(".recharts-surface");
    const box = await surface.boundingBox();
    if (!box) throw new Error("Missing SVG bounds");
    await page.mouse.move(box.x + 65, box.y + 100);
    await expect(
      plot.locator(
        '[data-kind-ui="chart-tooltip-item"][data-series="first"] [data-kind-ui="tooltip-number-final"]',
      ),
    ).toContainText("15");
    await expect(
      plot.locator(
        '[data-kind-ui="chart-tooltip-item"][data-series="second"] [data-kind-ui="tooltip-number-final"]',
      ),
    ).toContainText("80");
    const payload = JSON.parse(
      (await plot.locator("[data-native-payload]").getAttribute("data-native-payload")) ?? "[]",
    );
    expect(
      payload.map(({ series, row, value }: { series: string; row: string; value: number }) => ({
        series,
        row,
        value,
      })),
    ).toEqual([
      { series: "first", row: "A", value: 15 },
      { series: "second", row: "A", value: 80 },
    ]);
    const survivor = payload.find((entry: { series: string }) => entry.series === "second");
    await hide.click();
    await page.waitForTimeout(250);
    await page.mouse.move(box.x + 65, box.y + 100);
    await expect(
      plot.locator(
        '[data-kind-ui="chart-tooltip-item"][data-series="first"] [data-kind-ui="tooltip-number-final"]',
      ),
    ).toHaveCount(0);
    await expect(
      plot.locator(
        '[data-kind-ui="chart-tooltip-item"][data-series="second"] [data-kind-ui="tooltip-number-final"]',
      ),
    ).toContainText("80");
    expect(
      JSON.parse(
        (await plot.locator("[data-native-payload]").getAttribute("data-native-payload")) ?? "[]",
      ),
    ).toEqual([survivor]);
  });
}
const marks = {
  area: ".recharts-area-area",
  bar: ".recharts-bar-rectangle",
  "box-plot": ".recharts-bar-rectangle",
  combo: ".recharts-bar-rectangle,.recharts-line-curve,.recharts-area-area",
  histogram: ".recharts-bar-rectangle",
  line: ".recharts-line-curve",
  pie: ".recharts-pie-sector",
  radar: ".recharts-radar-polygon",
  "radial-activity": ".recharts-radial-bar-sector",
  scatter: ".recharts-scatter-symbol",
  sankey: ".recharts-sankey-nodes > g,.recharts-sankey-links > g",
  waterfall: ".recharts-bar-rectangle",
};
for (const [family, selector] of Object.entries(marks)) {
  test(`${family} docs: legend focus preserves all plotted geometry`, async ({ page }) => {
    await page.goto("/");
    const card = page.locator(`#docs-${family}`);
    await expect(card.locator(selector)).not.toHaveCount(0);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    const shape = () =>
      card
        .locator(`${selector}`)
        .evaluateAll((nodes) =>
          nodes.map((node) =>
            ["d", "x", "y", "width", "height", "cx", "cy"].map((key) => node.getAttribute(key)),
          ),
        );
    const baseline = await shape();
    const buttons = card.locator('[data-kind-ui="chart-legend"] button');
    if (family === "histogram" || family === "waterfall") {
      await expect(buttons).toHaveCount(0);
      const mark = card.locator(`${selector} path`).first();
      await mark.hover({ force: true });
      expect(await shape()).toEqual(baseline);
      await mark.click({ force: true });
      expect(await shape()).toEqual(baseline);
      return;
    }
    await expect(buttons).not.toHaveCount(0);
    for (let repeat = 0; repeat < 2; repeat++) {
      for (let i = 0; i < (await buttons.count()); i++) {
        await buttons.nth(i).hover();
        expect(await shape()).toEqual(baseline);
        await buttons.nth(i).click();
        await page.mouse.move(0, 0);
        expect(await shape()).toEqual(baseline);
        await buttons.nth(i).focus();
        await page.keyboard.press("Escape");
        expect(await shape()).toEqual(baseline);
      }
    }
  });
}
test("configured line default focuses; quantitative Heatmap legend stays static", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator(".kind-ui-configured-line-root").last();
  await expect(card.locator(".recharts-line-curve")).toHaveCount(2);
  const baseline = await card
    .locator(".recharts-line-curve")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")));
  await card.locator('[data-legend-key="first"]').click();
  expect(
    await card
      .locator(".recharts-line-curve")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d"))),
  ).toEqual(baseline);
  await expect(page.locator('#docs-heatmap [data-kind-ui="heatmap-legend"] button')).toHaveCount(0);
});

for (const family of ["line", "area", "bar", "combo", "radar"]) {
  test(`${family}: dim and hide fade bidirectionally without geometry replay`, async ({ page }) => {
    await page.goto("/");
    const plot = page.locator(`#${family}`);
    const paint = plot.locator('[data-series="first"] > [data-kind-ui="series-interaction-paint"]');
    await expect(paint).toHaveCSS("opacity", "1");
    await page.waitForTimeout(700);
    const paths = () =>
      plot.locator(geometry).evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")));
    const baseline = await paths();
    const value = () => paint.evaluate((n) => Number(getComputedStyle(n).opacity));
    const click = async (selector: string) =>
      plot.locator(selector).evaluate((n: HTMLElement) => n.click());
    await click('[data-legend-key="second"]');
    await expect.poll(value).toBeLessThan(0.98);
    const dimming = await value();
    expect(dimming).toBeGreaterThan(0.28);
    await click('[data-legend-key="second"]');
    await expect.poll(value).toBeGreaterThan(dimming);
    await expect(paint).toHaveCSS("opacity", "1");
    expect(await paths()).toEqual(baseline);
    await plot
      .getByRole("button", { name: "External hide", exact: true })
      .evaluate((n: HTMLElement) => n.click());
    await expect(
      plot.locator('[data-kind-ui="series-interaction"][data-series="first"]'),
    ).toHaveAttribute("aria-hidden", "true");
    await expect(
      plot.locator('[data-kind-ui="series-interaction"][data-series="first"]'),
    ).toHaveAttribute("pointer-events", "none");
    await expect.poll(value).toBeLessThan(0.98);
    const hiding = await value();
    expect(hiding).toBeGreaterThan(0);
    await plot
      .getByRole("button", { name: "External hide", exact: true })
      .evaluate((n: HTMLElement) => n.click());
    await expect.poll(value).toBeGreaterThan(hiding);
    await expect(paint).toHaveCSS("opacity", "1");
    expect(await paths()).toEqual(baseline);
    await plot
      .getByRole("button", { name: "External hide", exact: true })
      .evaluate((n: HTMLElement) => n.click());
    await expect(paint).toHaveCSS("opacity", "0");
    expect(await paths()).toEqual(baseline);
  });
  for (const control of ["reduce", "static"]) {
    test(`${family}: ${control} skips interaction fades`, async ({ page }) => {
      if (control === "reduce") await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(control === "static" ? "/?static" : "/");
      const plot = page.locator(`#${family}`);
      const paint = plot.locator(
        '[data-series="first"] > [data-kind-ui="series-interaction-paint"]',
      );
      await expect(paint).toHaveCSS("opacity", "1");
      await plot.locator('[data-legend-key="second"]').evaluate((n: HTMLElement) => n.click());
      expect(await paint.evaluate((n) => Number(getComputedStyle(n).opacity))).toBe(0.28);
      await plot
        .getByRole("button", { name: "External hide", exact: true })
        .evaluate((n: HTMLElement) => n.click());
      expect(await paint.evaluate((n) => Number(getComputedStyle(n).opacity))).toBe(0);
    });
  }
}
test("hide and dim retain an active legend/data identity through keyboard and eligibility changes", async ({
  page,
}) => {
  await page.goto("/");
  for (const mode of ["focus", "visibility"]) {
    const plot = page.locator(`#guard-${mode}`);
    const first = plot.locator('[data-legend-key="first"]');
    const second = plot.locator('[data-legend-key="second"]');
    const active = () =>
      plot
        .locator('[data-kind-ui="series-interaction-paint"]')
        .evaluateAll((nodes) => nodes.map((n) => Number(getComputedStyle(n).opacity)));
    for (let repeat = 0; repeat < 3; repeat++) {
      await first.focus();
      await page.keyboard.press("Enter");
      await second.focus();
      await page.keyboard.press("Space");
      await page.mouse.move(0, 0);
      await expect.poll(async () => (await active()).some((n) => n === 1)).toBe(true);
      await expect(
        plot.locator('[data-kind-ui="chart-legend-button"]:not([data-inactive="true"])'),
      ).not.toHaveCount(0);
    }
    await plot.getByRole("button", { name: "Limit eligible" }).click();
    await second.focus();
    await page.keyboard.press("Enter");
    await second.focus();
    await page.keyboard.press("Space");
    await expect.poll(async () => (await active()).some((n) => n === 1)).toBe(true);
    await expect(
      plot.locator('[data-kind-ui="chart-legend-button"]:not([data-inactive="true"])'),
    ).not.toHaveCount(0);
    // A consumer intentionally supplying an empty visible array is a separate contract.
    await plot.getByRole("button", { name: "Consumer empty" }).click();
    await expect(plot.locator("output")).toHaveAttribute("data-visible", "[]");
  }
});
