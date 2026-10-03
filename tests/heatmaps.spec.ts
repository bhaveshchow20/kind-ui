import { expect, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
for (const packed of [false, true]) {
  test.describe(packed ? "packed heatmap" : "heatmap recipes", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(packed ? `http://127.0.0.1:${4190 + offset}` : "/heatmaps.html");
    });
    test("keyboard traverses rows/columns, skips headers, preserves zero and missing, dismisses tooltip", async ({
      page,
    }) => {
      const grid = page.getByRole("grid", { name: "Weekly latency" });
      const cells = grid.getByRole("gridcell");
      await expect(cells).toHaveCount(25);
      await expect(grid.locator('td[tabindex="0"]')).toHaveCount(1);
      await cells.first().focus();
      await expect(page.getByRole("tooltip").first()).toHaveText("Platform, US East: +12");
      await page.keyboard.press("ArrowRight");
      await expect(cells.nth(1)).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(cells.nth(2)).toHaveAttribute("aria-label", "Platform, Europe: 0");
      await expect(page.getByRole("tooltip").first()).toHaveText("Platform, Europe: 0");
      await page.keyboard.press("End");
      await expect(cells.nth(4)).toBeFocused();
      await expect(page.getByRole("tooltip").first()).toHaveText("Platform, Oceania: No sample");
      await page.keyboard.press("ArrowDown");
      await expect(cells.nth(9)).toBeFocused();
      await page.keyboard.press("Home");
      await expect(cells.nth(5)).toBeFocused();
      await page.keyboard.press("Control+End");
      await expect(cells.last()).toBeFocused();
      await page.keyboard.press("Control+Home");
      await expect(cells.first()).toBeFocused();
      await cells.first().hover();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await page.mouse.move(1, 1);
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await page.keyboard.press("Tab");
      await expect(page.getByText("View latency data table", { exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("table", { name: "Latency change (ms)" })).toBeVisible();
    });
    test("pointer tooltip, active data updates, category reorder and empty domains", async ({
      page,
    }) => {
      const grid = page.getByRole("grid", { name: "Weekly latency" });
      const cell = grid.getByRole("gridcell", { name: "Platform, US East:" });
      await cell.hover();
      await expect(page.getByRole("tooltip").first()).toHaveText("Platform, US East: +12");
      await cell.focus();
      // Invoke host updates while focus stays in the grid.
      await page
        .getByRole("button", { name: "Update values" })
        .evaluate((node: HTMLButtonElement) => node.click());
      await expect(cell).toHaveAttribute("aria-label", "Platform, US East: -12");
      await expect(page.getByRole("tooltip").first()).toHaveText("Platform, US East: -12");
      await page
        .getByRole("button", { name: "Reorder domains" })
        .evaluate((node: HTMLButtonElement) => node.click());
      await expect(cell).toBeFocused();
      await expect(grid.getByRole("gridcell").last()).toHaveAttribute(
        "aria-label",
        "Platform, US East: -12",
      );
      await page.getByRole("button", { name: "Toggle empty" }).click();
      await expect(grid.getByRole("gridcell")).toHaveCount(0);
      await expect(page.getByText("No cells in the selected domains.").first()).toBeVisible();
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    });
    test("pointer tooltip persists onto its content and Escape dismisses without grid focus", async ({
      page,
    }) => {
      const cell = page.getByRole("grid", { name: "Weekly latency" }).getByRole("gridcell").first();
      await cell.hover();
      const tooltip = page.getByRole("tooltip").first();
      await tooltip.hover();
      await expect(tooltip).toHaveText("Platform, US East: +12");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    });
    test("native container styling remains host-owned and preserves quantitative cells", async ({
      page,
    }) => {
      const grid = page.getByRole("grid", { name: "Weekly latency" });
      const capture = () =>
        grid.locator("td").evaluateAll((nodes) =>
          nodes.map((node) => {
            const css = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return [css.backgroundColor, css.opacity, rect.width, rect.height];
          }),
        );
      const plain = await capture();
      const chart = grid.locator("..").locator("..").locator("..");
      await expect(chart).toHaveClass("heatmap-card");
      await chart.evaluate((node: HTMLElement) => {
        node.style.backgroundColor = "rgb(250, 246, 240)";
        node.style.boxShadow = "0 2px 5px #17203314";
      });
      await expect(chart).toHaveCSS("background-color", "rgb(250, 246, 240)");
      expect(await capture()).toEqual(plain);
      await expect(page.getByRole("combobox", { name: "Cell material" })).toHaveValue("plain");
      await expect(page.locator('[data-kind-ui="heatmap"][data-material]')).toHaveCount(0);
    });
    test("phone layout contains overflow and reaches last activity cell", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const grid = page.getByRole("grid", { name: "Deployment activity" });
      const matrix = page.getByRole("grid", { name: "Weekly latency" });
      expect((await matrix.locator("caption").boundingBox())?.width).toBeLessThanOrEqual(
        await matrix.locator("..").evaluate((node) => node.clientWidth),
      );
      await grid.getByRole("gridcell").first().focus();
      await page.keyboard.press("Control+End");
      await expect(grid.getByRole("gridcell").last()).toBeFocused();
      await expect(page.getByRole("tooltip").last()).toHaveText("Sun, W14: Not yet observed");
      expect(await grid.locator("..").evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    });
  });
}
test("packed constant zero, missing updates, native refs and handler cancellation", async ({
  page,
}) => {
  await page.goto(`http://127.0.0.1:${4190 + offset}`);
  const grid = page.getByRole("grid", { name: "Constant and missing grid" });
  const cells = grid.getByRole("gridcell");
  await expect(cells.first()).toHaveCSS("background-color", "rgb(128, 128, 128)");
  await expect(cells.nth(1)).toHaveAttribute("data-missing", "true");
  await expect(cells.first()).toHaveAttribute("data-ref-ready", "yes");
  await cells.nth(1).click();
  await expect(page.getByLabel("Handled events")).toHaveText("1");
  await page.keyboard.press("ArrowLeft");
  await expect(cells.nth(1)).toBeFocused();
  await page
    .getByRole("button", { name: "Patch edge data" })
    .evaluate((node: HTMLButtonElement) => node.click());
  await expect(cells.nth(1)).toHaveAttribute("data-missing", "false");
  await expect(page.getByRole("tooltip").last()).toHaveText("A, Y: 0");
  await expect(page.getByRole("grid", { name: "Empty grid" }).getByRole("gridcell")).toHaveCount(0);
});
test("desktop and phone visual evidence with motion enabled and reduced-motion snap", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const sample = () => {
      const node = document.querySelector('[data-kind-ui="heatmap-cell-entrance"]');
      if (node && Number(getComputedStyle(node).opacity) < 1)
        document.documentElement.dataset.heatmapMoved = "yes";
      if (performance.now() < 1500) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto("/heatmaps.html");
  await expect(page.locator("html")).toHaveAttribute("data-heatmap-moved", "yes");
  await expect(page.getByLabel("Motion", { exact: true })).toBeChecked();
  await page.waitForTimeout(450);
  await page.getByRole("grid", { name: "Weekly latency" }).getByRole("gridcell").first().focus();
  await expect(page.locator('[data-kind-ui="heatmap-entrance"]').first()).toHaveCSS(
    "transform",
    "none",
  );
  await page.keyboard.press("Escape");
  await page.screenshot({ path: info.outputPath("heatmap-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: info.outputPath("heatmap-phone.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="heatmap-entrance"]').first()).toHaveCSS(
    "transform",
    "none",
  );
});

test("actual touch inspection opens zero and missing cells", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${4190 + offset}`);
  const grid = page.getByRole("grid", { name: "Weekly latency" });
  for (const material of ["plain", "paper", "clay", "glow"]) {
    await page.getByRole("combobox", { name: "Cell material" }).selectOption(material);
    await grid.getByRole("gridcell").nth(2).tap();
    await expect(page.getByRole("tooltip").first()).toHaveText("Platform, Europe: 0");
    await grid.getByRole("gridcell").nth(4).tap();
    await expect(page.getByRole("tooltip").first()).toHaveText("Platform, Oceania: No sample");
  }
  await context.close();
});
test("removed focused row has a valid tab reentry and custom missing foreground", async ({
  page,
}) => {
  await page.goto(`http://127.0.0.1:${4190 + offset}`);
  const grid = page.getByRole("grid", { name: "Constant and missing grid" });
  await grid.getByRole("gridcell").last().focus();
  await page
    .getByRole("button", { name: "Remove row" })
    .evaluate((node: HTMLButtonElement) => node.click());
  await expect(grid.getByRole("gridcell")).toHaveCount(2);
  await expect(grid.locator('td[tabindex="0"]')).toHaveCount(1);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByLabel("Handled events").evaluate((node) => {
    node.setAttribute("tabindex", "0");
    (node as HTMLElement).focus();
  });
  await page.keyboard.press("Tab");
  await expect(grid.getByRole("gridcell").first()).toBeFocused();
  const missing = grid.getByRole("gridcell").nth(1);
  await missing
    .locator("..")
    .locator("..")
    .locator("..")
    .locator("..")
    .locator("..")
    .evaluate((node: HTMLElement) => {
      node.style.setProperty("--heatmap-missing", "#000000");
      node.style.setProperty("--heatmap-missing-foreground", "#ffffff");
    });
  await expect(missing).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(missing.locator("span")).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("diagonal cell entrance keeps native table geometry and reduced motion snaps immediately", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/heatmaps.html", { waitUntil: "domcontentloaded" });
  const grid = page.getByRole("grid", { name: "Weekly latency" });
  const cells = grid.getByRole("gridcell");
  const bounds = await cells.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return [box.x, box.y, box.width, box.height];
    }),
  );
  await page.clock.runFor(100);
  const alpha = await cells.evaluateAll((nodes) =>
    nodes.map((node) => Number(getComputedStyle(node).opacity)),
  );
  expect(alpha[0]).toBeGreaterThan(alpha.at(-1) ?? 1);
  expect(alpha.at(-1)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      cells.evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === "1")),
    )
    .toBe(true);
  expect(
    await cells.evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return [box.x, box.y, box.width, box.height];
      }),
    ),
  ).toEqual(bounds);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.runFor(200);
  expect(
    await cells.evaluateAll((nodes) =>
      nodes.every((node) => getComputedStyle(node).opacity === "1"),
    ),
  ).toBe(true);
});

test("long categories preserve equal rows and skewed signed legend stays readable", async ({
  page,
}) => {
  await page.goto(`http://127.0.0.1:${4190 + offset}`);
  await page.setViewportSize({ width: 390, height: 844 });
  const grid = page.getByRole("grid", { name: "Long category grid" });
  const heights = await grid
    .getByRole("gridcell")
    .evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().height));
  expect(heights[0]).toBe(heights[1]);
  const legend = page
    .locator('[data-kind-ui="heatmap-legend"]')
    .filter({ has: page.getByText("Skewed signed scale", { exact: true }) });
  const zero = await legend.locator('[data-kind-ui="heatmap-zero-label"]').boundingBox();
  const endpoint = await legend
    .locator('[data-kind-ui="heatmap-ticks"] span')
    .first()
    .boundingBox();
  expect(zero?.y).toBeGreaterThanOrEqual((endpoint?.y ?? 0) + (endpoint?.height ?? 0));
  const marker = await legend.locator('[data-kind-ui="heatmap-zero-marker"]').boundingBox();
  const ramp = await legend.locator('[data-kind-ui="heatmap-ramp"]').boundingBox();
  expect((marker?.x ?? 0) - (ramp?.x ?? 0)).toBeCloseTo((ramp?.width ?? 0) / 101, 0);
});

for (const change of ["resize", "data", "domains"] as const) {
  test(`heatmap diagonal reveal settles on ${change} and does not replay`, async ({ page }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/heatmaps.html");
    const cells = page.getByRole("grid", { name: "Weekly latency" }).getByRole("gridcell");
    await page.clock.runFor(100);
    expect(
      await cells.evaluateAll((nodes) =>
        nodes.some((node) => Number(getComputedStyle(node).opacity) < 1),
      ),
    ).toBe(true);
    if (change === "resize") await page.setViewportSize({ width: 390, height: 844 });
    else
      await page
        .getByRole("button", {
          name: change === "data" ? "Update values" : "Reorder domains",
          exact: true,
        })
        .evaluate((node) => (node as HTMLButtonElement).click());
    await page.clock.runFor(50);
    await expect
      .poll(() =>
        cells.evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === "1")),
      )
      .toBe(true);
    if (change === "resize") await page.setViewportSize({ width: 1000, height: 900 });
    else
      await page
        .getByRole("button", {
          name: change === "data" ? "Update values" : "Reorder domains",
          exact: true,
        })
        .evaluate((node) => (node as HTMLButtonElement).click());
    await page.clock.runFor(150);
    expect(
      await cells.evaluateAll((nodes) =>
        nodes.every((node) => getComputedStyle(node).opacity === "1"),
      ),
    ).toBe(true);
  });
}

test("heatmap interruption preserves a consumer opacity change during entrance", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`http://127.0.0.1:${4190 + offset}`);
  const cells = page.getByRole("grid", { name: "Weekly latency" }).getByRole("gridcell");
  await page.clock.runFor(100);
  await page
    .getByRole("button", { name: "Consumer opacity", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect
    .poll(() =>
      cells.evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).opacity === "0.4")),
    )
    .toBe(true);
  await page.clock.runFor(1000);
  expect(
    await cells.evaluateAll((nodes) =>
      nodes.every((node) => getComputedStyle(node).opacity === "0.4"),
    ),
  ).toBe(true);
});
