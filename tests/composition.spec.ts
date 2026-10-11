import { expect, test } from "@playwright/test";
import { expectHiddenPaint } from "./interaction-paint";

test("named and namespace single-package compositions retain native geometry, defaults and interactions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const family of ["line", "radar", "scatter", "pie"]) {
    const native = page.locator(`[data-import="native"] [data-family="${family}"]`);
    const geometry = (scope: typeof native) =>
      scope.locator("svg").evaluateAll((svgs) =>
        svgs.flatMap((svg) =>
          Array.from(svg.querySelectorAll("path, polygon, line, circle, text"))
            .filter((node) => !node.closest("defs"))
            .map((node) => ({
              tag: node.tagName,
              attrs: [
                "d",
                "points",
                "x",
                "y",
                "x1",
                "x2",
                "y1",
                "y2",
                "cx",
                "cy",
                "r",
                "stroke",
                "fill",
                "stroke-width",
              ].map((name) => node.getAttribute(name)),
              text: node.tagName === "text" ? node.textContent : null,
            })),
        ),
      );
    await expect(native.locator("svg")).toBeVisible();
    for (const kind of ["named", "namespace"]) {
      const scope = page.locator(`[data-import="${kind}"] [data-family="${family}"]`);
      await expect(scope.locator("svg")).toBeVisible();
      await expect.poll(() => geometry(scope)).toEqual(await geometry(native));
    }
  }
  for (const kind of ["named", "namespace", "native"]) {
    const scope = page.locator(`[data-import="${kind}"]`);
    await expect(scope.locator('[data-composition-ref="attached"]')).toHaveCount(1);
    await scope.locator('[data-family="line"] .recharts-xAxis-tick-labels text').first().click();
    await expect(scope.locator("[data-clicks]")).toHaveText("1");
    await scope.locator('[data-family="scatter"] .recharts-symbols').first().click();
    await expect(scope.locator("[data-clicks]")).toHaveText("2");
    const sector = scope.locator('[data-family="pie"] .recharts-sector').first();
    await sector.scrollIntoViewIfNeeded();
    // Donut sectors have holes and labels; click actual paint rather than their box center.
    const position = await sector.evaluate((node) => {
      const box = node.getBoundingClientRect();
      for (const x of [0.5, 0.25, 0.75])
        for (const y of [0.5, 0.25, 0.75]) {
          const point = { x: box.width * x, y: box.height * y };
          if (document.elementFromPoint(box.x + point.x, box.y + point.y) === node) return point;
        }
      throw new Error("Pie sector has no unobstructed painted click point");
    });
    await sector.click({ position });
    await expect(scope.locator("[data-clicks]")).toHaveText("3");
    const line = scope.locator('[data-family="line"] svg');
    await line.focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      scope.locator('[data-family="line"] [data-kind-ui="tooltip-frame"]'),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    const brush = scope.locator('[data-family="line"] .recharts-brush-traveller').first();
    const box = await brush.boundingBox();
    if (!box) throw new Error("Brush traveller missing");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(scope.locator("[data-range]")).not.toBeEmpty();
    await scope.getByRole("button", { name: "Resize" }).click();
    await expect.poll(() => line.getAttribute("width")).toBe("360");
  }
  expect(errors).toEqual([]);
});

test("compound families render through wrappers and keep HTML, geometry and state consumer-controlled", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?compound");
  const suite = page.locator("[data-compound-suite]");
  const family = (name: string) => suite.locator(`[data-compound="${name}"]`);
  for (const name of [
    "line",
    "area",
    "bar",
    "combo",
    "pie",
    "radar",
    "radial",
    "scatter",
    "waterfall",
    "histogram",
    "box",
    "activity",
    "sankey",
  ]) {
    const chart = family(name);
    await expect(chart.locator(".recharts-surface").first()).toBeVisible();
    await expect(chart.locator('[data-kind-ui="chart"]')).toHaveCount(1);
    const legend = chart.locator('[data-kind-ui="chart-legend"], [data-kind-ui="sankey-legend"]');
    await expect(legend).toBeVisible();
    expect(await legend.evaluate((node) => !node.closest("svg, .recharts-wrapper"))).toBe(true);
  }
  const heatmap = family("heatmap");
  await expect(heatmap.getByRole("grid", { name: "Compound cells" })).toBeVisible();
  await expect(heatmap.getByRole("table", { name: "Cell values" })).toBeVisible();
  await expect(heatmap.locator('[data-kind-ui="heatmap-legend"]')).toBeVisible();
  const partsBeforePlot = () =>
    heatmap.evaluate((node) => {
      const slot = node.querySelector('[data-kind-ui="chart-parts"]');
      const plot = node.querySelector('[data-kind-ui="heatmap"]');
      return Boolean(
        slot && plot && slot.compareDocumentPosition(plot) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
  expect(await partsBeforePlot()).toBe(true);
  await expect(
    heatmap.locator('[data-kind-ui="chart-parts"] [data-kind-ui="heatmap-legend"]'),
  ).toHaveCount(1);
  await suite.getByRole("button", { name: "Compound legend position", exact: true }).click();
  expect(await partsBeforePlot()).toBe(false);
  await expect(heatmap.locator('[data-kind-ui="heatmap-legend"]')).toContainText("Cell scale");
  await heatmap.locator("td[data-cell-key]").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(heatmap.locator("td[data-cell-key]").nth(1)).toBeFocused();
  await expect(family("sankey").getByRole("table", { name: "Flow values" })).toBeVisible();
  await expect(family("activity").locator("dl")).toHaveText("Value70Other40");
  await expect(family("histogram").locator(".recharts-bar-rectangle")).toHaveCount(2);
  await expect(family("box").locator('[data-kind-ui="box-plot-mark"]')).toHaveCount(1);
  const line = family("line");
  const path = line.locator(".recharts-line-curve");
  await expect(path).toHaveCount(1); // Two metadata entries still produce only the explicit series.
  await expect(line.locator('[data-compound-chart-ref="attached"]')).toHaveCount(1);
  await expect(line.locator('[data-compound-ref="legend"]')).toHaveCount(1);
  await line.locator(".recharts-surface").focus();
  await page.keyboard.press("ArrowRight");
  await expect(line.locator('[data-kind-ui="tooltip-frame"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await suite.getByRole("button", { name: "Compound resize", exact: true }).click();
  await expect(line.locator(".recharts-surface")).toHaveAttribute("width", "360");
  await suite.getByRole("button", { name: "Compound theme", exact: true }).click();
  await expect(path).toHaveCSS("stroke", "rgb(220, 38, 38)");
  const value = line.getByRole("button", { name: "Value", exact: true });
  await value.focus();
  await page.keyboard.press("Space");
  await expect(value).toHaveAttribute("aria-pressed", "false");
  await expectHiddenPaint(path);
  await page.keyboard.press("Space");
  await expect(value).toHaveAttribute("aria-pressed", "true");
  await suite.getByRole("button", { name: "Compound omit", exact: true }).click();
  await expect(path).toHaveCount(0);
  await expect(line.locator('[data-kind-ui="chart-legend"]')).toBeVisible();
  await suite.getByRole("button", { name: "Compound omit", exact: true }).click();
  await expect(path).toHaveCount(1);
  await suite.getByRole("button", { name: "Compound loading", exact: true }).click();
  await expect(line.locator('[data-kind-ui="chart-loading-skeleton"]')).toBeVisible();
  await suite.getByRole("button", { name: "Compound loading", exact: true }).click();
  await expect(path).toBeVisible();
  const flowMarks = family("sankey").locator('[data-kind-ui="sankey-focus-mark"]');
  await expect(flowMarks).toHaveCount(3);
  await suite.getByRole("button", { name: "Compound flow nodes", exact: true }).click();
  await expect(flowMarks).toHaveCount(1);
  await suite.getByRole("button", { name: "Compound flow links", exact: true }).click();
  await expect(flowMarks).toHaveCount(0);
  await suite.getByRole("button", { name: "Compound flow links", exact: true }).click();
  await expect(flowMarks).toHaveCount(1);
  await suite.getByRole("button", { name: "Compound flow nodes", exact: true }).click();
  await expect(flowMarks).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("compound pie initial tooltip resolves mounted wrapped parts and dismisses on interaction", async ({
  page,
}) => {
  await page.goto("/?compound");
  const pie = page.locator('[data-compound="pie"]');
  const tooltip = pie.locator('[data-kind-ui="tooltip-frame"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("B");
  await pie.locator(".recharts-surface").focus();
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();
});

test("Kind motion preferences share one subscription, react to changes and clean up on unmount", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    const active = new Set<EventListenerOrEventListenerObject>();
    const state = {
      get active() {
        return active.size;
      },
    };
    Object.defineProperty(window, "compoundMedia", { value: state });
    window.matchMedia = (query) => {
      const media = original(query);
      if (query !== "(prefers-reduced-motion: reduce)") return media;
      const add = media.addEventListener.bind(media);
      const remove = media.removeEventListener.bind(media);
      media.addEventListener = (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
      ) => {
        if (type === "change") active.add(listener);
        add(type, listener, options);
      };
      media.removeEventListener = (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
      ) => {
        if (type === "change") active.delete(listener);
        remove(type, listener, options);
      };
      return media;
    };
  });
  await page.goto("/?motion");
  const count = () => page.evaluate(() => Reflect.get(window, "compoundMedia").active);
  await expect.poll(count).toBe(1);
  await expect(page.locator('[data-kind-ui="tooltip-number"]')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator('[data-kind-ui="tooltip-number"]')).toHaveCount(8);
  await expect.poll(count).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="tooltip-number"]')).toHaveCount(0);
  await expect.poll(count).toBe(1);
  await page.getByRole("button", { name: "Preference mount", exact: true }).click();
  await expect.poll(count).toBe(0);
  await page.getByRole("button", { name: "Preference mount", exact: true }).click();
  await expect.poll(count).toBe(1);
});
