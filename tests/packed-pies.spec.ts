import { expect, type Locator, type Page, test } from "./browser";

const url = "http://127.0.0.1:4180";
const sectors = '[data-kind-ui="pie-sector"]';
const revealing = '[data-kind-ui="pie-sector"][data-reveal="on"]';

test("packed pie preserves category identity, controlled filtering, native refs and keyboard", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  const chart = page.getByRole("application", { name: "Packed pie chart" });
  await expect(chart).toHaveAttribute("data-ref-tag", "svg");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("Beta");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("40 seats");
  await expect(page.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveAttribute(
    "data-series",
    "beta",
  );
  await expect(page.locator('[data-kind-ui="tooltip-frame"]')).toHaveAttribute(
    "data-ref-tag",
    "DIV",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("Zero");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("0");
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).not.toBeVisible();
  await page.getByRole("button", { name: "Beta", exact: true }).click();
  await expect(page.getByRole("button", { name: "Beta", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await chart.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("Alpha");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("60 seats");
  await page.getByRole("button", { name: "Reorder", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("missing");
  await page.getByRole("button", { name: "Beta", exact: true }).click();
  await page.getByRole("button", { name: "Custom shape", exact: true }).click();
  await expect(page.locator("[data-host-shape]")).not.toHaveCount(0);
  const point = await page
    .locator("[data-host-shape]")
    .last()
    .evaluate((node) => {
      const path = node as SVGPathElement;
      const matrix = path.ownerSVGElement?.getScreenCTM();
      if (!matrix) throw new Error("Missing chart transform");
      const point = new DOMPoint(
        Number(path.dataset.clickX),
        Number(path.dataset.clickY),
      ).matrixTransform(matrix);
      return { x: point.x, y: point.y };
    });
  await page.mouse.click(point.x, point.y);
  await expect(page.getByLabel("Events")).not.toContainText("none");
  await page.screenshot({ path: info.outputPath("packed-pie-native.png") });
  expect(errors).toEqual([]);
});

test("empty, all-zero and missing categories remain truthful with a data alternative", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.getByRole("table")).toContainText("No data");
  await page.getByRole("button", { name: "All zero", exact: true }).click();
  await expect(page.locator(".recharts-pie-sector")).toHaveCount(0);
  await expect(page.getByRole("table")).toContainText("0");
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(page.locator(".recharts-pie-sector")).toHaveCount(0);
});

for (const action of [
  "Update",
  "Resize",
  "Donut",
  "Angles",
  "Reorder",
  "Native hide",
  "Direction",
]) {
  test(`Motion pie entrance stops on ${action} without replay`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${url}/?motion`);
    await expect(page.locator(revealing).first()).toBeAttached();
    await page
      .getByRole("button", { name: action, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(revealing)).toHaveCount(0);
    await page
      .getByRole("button", { name: action, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(revealing)).toHaveCount(0);
    const paths = await page
      .locator(sectors)
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("d")));
    expect(paths.every((d) => !d?.includes("NaN"))).toBeTruthy();
  });
}

test("Motion pie responds to runtime reduced motion, keyboard and custom content ownership", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?motion`);
  await expect(page.locator(revealing).first()).toBeAttached();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(revealing)).toHaveCount(0);
  await expect(page.locator('[data-motion="off"]')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const chart = page.getByRole("application", { name: "Packed pie chart" });
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(revealing)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Custom content", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.getByRole("button", { name: "Content count 0" })).toBeVisible();
  await page
    .getByRole("button", { name: "Content count 0" })
    .evaluate((node) => (node as HTMLButtonElement).click());
  for (const action of ["Animate", "Default animation", "Update", "Donut"]) {
    await page
      .getByRole("button", { name: action, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.getByRole("button", { name: "Content count 1" })).toBeAttached();
  }
});

test("pie and donut recipes use public controls and expose the zero category", async ({
  page,
}, info) => {
  await page.goto("/pies.html");
  await expect(page.getByRole("application")).toHaveCount(2);
  await expect(page.getByRole("table")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Unplanned", exact: true })).toHaveCount(2);
  const first = page.locator("article").first();
  await first.getByRole("button", { name: "Delivery", exact: true }).click();
  await expect(first.getByRole("status")).toContainText("40 visible hours");
  await expect(page.locator("article").last().getByRole("status")).toContainText(
    "88 visible hours",
  );
  await page.screenshot({ path: info.outputPath("pie-donut-recipes.png"), fullPage: true });
});

test("continuous angular entrance preserves native paths, finishes, and repeated category toggles do not revive it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?motion`);
  const sector = page.locator(sectors).first();
  const firstPath = await sector.getAttribute("d");
  const windows = page.locator('[data-kind-ui="pie-entrance-window"]');
  const initialProgress = Number(await windows.first().getAttribute("data-progress"));
  await expect
    .poll(async () => Number(await windows.first().getAttribute("data-progress")))
    .toBeGreaterThan(initialProgress);
  const progress = await windows.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-progress")),
  );
  expect(new Set(progress).size).toBe(1);
  expect(await sector.getAttribute("d")).toBe(firstPath);
  await expect(page.locator(revealing)).toHaveCount(0);
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Beta", exact: true }).click();
    await page.getByRole("button", { name: "Beta", exact: true }).click();
    await expect(page.locator(revealing)).toHaveCount(0);
  }
  const chart = page.getByRole("application", { name: "Packed pie chart" });
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("Beta");
  await expect
    .poll(async () => {
      const tooltip = await page.locator('[data-kind-ui="tooltip-frame"]').boundingBox();
      const bounds = await chart.boundingBox();
      return Boolean(
        tooltip &&
          bounds &&
          tooltip.x >= bounds.x - 1 &&
          tooltip.y >= bounds.y - 1 &&
          tooltip.x + tooltip.width <= bounds.x + bounds.width + 1 &&
          tooltip.y + tooltip.height <= bounds.y + bounds.height + 1,
      );
    })
    .toBe(true);
});

test("native chart data, function keys, variable radius, multiple rings and click selection compose", async ({
  page,
}) => {
  await page.goto(`${url}/?multi`);
  const chart = page.getByRole("application", { name: "Native rings" });
  await expect(chart).toBeVisible();
  const outer = chart.locator('[data-ring="outer"]').first();
  const bounds = await chart.boundingBox();
  if (!bounds) throw new Error("Missing native ring bounds");
  // Alpha spans 90 to -126 degrees. Click its interior, rather than its hollow bounding-box center.
  await page.mouse.click(
    bounds.x + 180 + 100 * Math.cos(Math.PI / 10),
    bounds.y + 150 + 100 * Math.sin(Math.PI / 10),
  );
  await expect(page.locator('[data-kind-ui="chart-tooltip"]').last()).toContainText("Alpha");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]').last()).toContainText("60 seats");
  expect(await outer.getAttribute("d")).not.toBe(
    await chart.locator('[data-ring="inner"]').first().getAttribute("d"),
  );
});

test("Cell-derived updates cancel entrance while unchanged recreated Cells keep it running", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?cells`);
  const proof = page.getByRole("region", { name: "Cell data proof" });
  await expect(proof.locator(revealing).first()).toBeAttached();
  await proof
    .getByRole("button", { name: "Unchanged Cells 0" })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(proof.locator(revealing).first()).toBeAttached();
  await proof
    .getByRole("button", { name: "Cell update", exact: true })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(proof.locator(revealing)).toHaveCount(0);
  await proof.getByRole("application", { name: "Cell data chart" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(proof.locator('[data-kind-ui="chart-tooltip"]')).toContainText("20 seats");
});

test("custom sector ownership can switch repeatedly without corrupting the Motion boundary", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?motion`);
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Custom shape", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator("[data-host-shape]")).not.toHaveCount(0);
    await page
      .getByRole("button", { name: "Custom shape", exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator(sectors)).not.toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("pie and donut recipes fit a phone viewport and retain the data alternatives", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pies.html");
  await expect(page.getByRole("application")).toHaveCount(2);
  await expect(page.getByRole("table")).toHaveCount(2);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: info.outputPath("pie-donut-recipes-phone.png"), fullPage: true });
});

async function paint(chart: Locator) {
  return chart.locator(".recharts-pie-sector path").evaluateAll((nodes) =>
    nodes.map((node) => ({
      d: node.getAttribute("d"),
      stroke: node.getAttribute("stroke"),
      fill: node.getAttribute("fill"),
    })),
  );
}
async function assertNativePixels(page: Page, kind: Buffer, native: Buffer) {
  const difference = await page.evaluate(
    async (pngs) => {
      const pixels = await Promise.all(
        pngs.map(async (png) => {
          const image = new Image();
          image.src = `data:image/png;base64,${png}`;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Missing pixel context");
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, canvas.width, canvas.height).data;
        }),
      );
      const [actual, expected] = pixels;
      if (!actual || !expected || actual.length !== expected.length)
        throw new Error("Oracle pixel dimensions differ");
      let max = 0;
      for (let i = 0; i < actual.length; i++)
        max = Math.max(max, Math.abs((actual[i] ?? 0) - (expected[i] ?? 0)));
      return max;
    },
    [kind.toString("base64"), native.toString("base64")],
  );
  // Chromium quantizes identical sector edges differently across paint layers (up to 47).
  // A white separator against these opaque fills exceeds 64; retain exact path/stroke checks too.
  expect(difference).toBeLessThanOrEqual(64);
}
test("continuous defaults match a gap-free native oracle including zero, tiny, visibility, rings and hover", async ({
  page,
}, info) => {
  await page.goto(`${url}/?oracle`);
  const proof = page.getByRole("region", { name: "Continuity proof" });
  const kind = proof.getByRole("application", { name: "Kind continuity", includeHidden: true });
  const native = proof.getByRole("application", { name: "Native oracle", includeHidden: true });
  for (const scenario of ["normal", "zero", "tiny", "single", "empty", "allZero"]) {
    await proof.getByRole("button", { name: `Scenario ${scenario}`, exact: true }).click();
    await expect(proof.getByLabel("Oracle state")).toContainText(`${scenario}/`);
    await expect
      .poll(async () => JSON.stringify(await paint(kind)) === JSON.stringify(await paint(native)))
      .toBeTruthy();
    if (
      scenario === "normal" ||
      scenario === "zero" ||
      scenario === "tiny" ||
      scenario === "single"
    ) {
      await page.mouse.move(0, 0);
      const kindPixels = await kind.screenshot({
        path: info.outputPath(`oracle-${scenario}-kind.png`),
      });
      await kind.evaluate((node) => {
        node.style.visibility = "hidden";
      });
      await native.evaluate((node) => {
        (node.parentElement as HTMLElement).style.visibility = "visible";
      });
      const nativePixels = await native.screenshot({
        path: info.outputPath(`oracle-${scenario}-native.png`),
      });
      await native.evaluate((node) => {
        (node.parentElement as HTMLElement).style.visibility = "hidden";
      });
      await kind.evaluate((node) => {
        node.style.visibility = "visible";
      });
      await assertNativePixels(page, kindPixels, nativePixels);
      if (scenario === "single") {
        await kind.screenshot({ path: info.outputPath("continuous-single-pie.png") });
        await proof.getByRole("button", { name: "Oracle donut", exact: true }).click();
        const donutPixels = await kind.screenshot();
        await kind.evaluate((node) => {
          node.style.visibility = "hidden";
        });
        await native.evaluate((node) => {
          (node.parentElement as HTMLElement).style.visibility = "visible";
        });
        await assertNativePixels(page, donutPixels, await native.screenshot());
        await native.evaluate((node) => {
          (node.parentElement as HTMLElement).style.visibility = "hidden";
        });
        await kind.evaluate((node) => {
          node.style.visibility = "visible";
        });
        await kind.screenshot({ path: info.outputPath("continuous-single-donut.png") });
        await proof.getByRole("button", { name: "Oracle donut", exact: true }).click();
      }
      await expect(kind.locator(".recharts-pie-sector path").first()).toHaveAttribute(
        "stroke",
        "none",
      );
    }
  }
  await proof.getByRole("button", { name: "Scenario normal", exact: true }).click();
  for (const control of [
    "Oracle donut",
    "Oracle rings",
    "Oracle visibility",
    "Oracle visibility",
  ]) {
    await proof.getByRole("button", { name: control, exact: true }).click();
    await expect
      .poll(async () => JSON.stringify(await paint(kind)) === JSON.stringify(await paint(native)))
      .toBeTruthy();
  }
  await kind.focus();
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => JSON.stringify(await paint(kind)) === JSON.stringify(await paint(native)))
    .toBeTruthy();
  await page.mouse.move(0, 0);
  await kind.screenshot({ path: info.outputPath("continuous-multiple-rings.png") });
  await proof.getByRole("button", { name: "Explicit gaps", exact: true }).click();
  await expect(kind.locator(".recharts-pie-sector path").first()).toHaveAttribute("stroke", "#fff");
  await expect
    .poll(async () => JSON.stringify(await paint(kind)) === JSON.stringify(await paint(native)))
    .toBeTruthy();
});

test("recipes remain continuous before hover, after selection, filter/unhide and Motion settles", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/pies.html");
  const charts = page.getByRole("application");
  await expect(charts).toHaveCount(2);
  for (const chart of await charts.all()) {
    await expect(chart.locator(".recharts-pie-sector path").first()).toHaveAttribute(
      "stroke",
      "none",
    );
    const before = await paint(chart);
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => paint(chart)).toEqual(before);
    await page.keyboard.press("Escape");
  }
  const first = page.locator("article").first();
  await page.goto("/pies.html");
  const finalPaint = await paint(charts.first());
  await first.getByRole("checkbox", { name: "Animate", exact: true }).check();
  await expect(first.locator(revealing).first()).toBeAttached();
  await expect(first.locator(revealing)).toHaveCount(0);
  await expect.poll(() => paint(charts.first())).toEqual(finalPaint);
  await charts.first().locator(".recharts-pie-sector path").first().hover();
  await expect.poll(() => paint(charts.first())).toEqual(finalPaint);
  await page.getByRole("heading", { name: "Pie & donut", exact: true }).click();
  await first.getByRole("button", { name: "Delivery", exact: true }).click();
  await expect(first.getByRole("status")).toContainText("40 visible hours");
  await first.getByRole("button", { name: "Delivery", exact: true }).click();
  await expect(first.getByRole("status")).toContainText("88 visible hours");
  await page.mouse.move(0, 0);
  await charts.first().screenshot({ path: info.outputPath("continuous-pie-closeup.png") });
  await charts.last().screenshot({ path: info.outputPath("continuous-donut-closeup.png") });
  await page.screenshot({
    path: info.outputPath("continuous-recipes-desktop.png"),
    fullPage: true,
  });
});

for (const direction of ["clockwise", "anticlockwise"] as const) {
  for (const span of ["", "&positive", "&partial", "&partial&positive"]) {
    test(`packed pie sweeps ${direction} continuously (${span || "native full"}) without changing geometry`, async ({
      page,
    }, info) => {
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(
        `${url}/?motion${direction === "anticlockwise" ? "&anticlockwise" : ""}${span}`,
      );
      await page.clock.runFor(100);
      const windows = page.locator('[data-kind-ui="pie-entrance-window"]');
      await expect(windows.first()).toHaveAttribute("data-direction", direction);
      const nativePaths = await page
        .locator(sectors)
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
      const window = windows.first();
      const first = await window.getAttribute("d");
      await page.clock.runFor(100);
      expect(await window.getAttribute("d")).not.toBe(first);
      const d = await window.getAttribute("d");
      const arc = d
        ?.split("A")[1]
        ?.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)
        ?.map(Number);
      // SVG positive sweep flag is physically clockwise (screen Y points down).
      expect(arc?.[4]).toBe(direction === "clockwise" ? 1 : 0);
      if (span.includes("partial")) {
        const start = d
          ?.split("A")[0]
          ?.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)
          ?.map(Number);
        expect(start).toHaveLength(2);
        expect(start?.[1]).toBeCloseTo(150, 3);
        if (direction === "clockwise") expect(start?.[0]).toBeLessThan(240);
        else expect(start?.[0]).toBeGreaterThan(240);
      }
      await page.screenshot({ path: info.outputPath(`pie-${direction}-entrance.png`) });
      expect(
        await page
          .locator(sectors)
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
      ).toEqual(nativePaths);
      await page.clock.runFor(1000);
      await expect(windows).toHaveCount(0);
      expect(
        await page
          .locator(sectors)
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
      ).toEqual(nativePaths);
      await page.screenshot({ path: info.outputPath(`pie-${direction}-settled.png`) });
    });
  }
}

test("stylesheet transformed native sectors retain paint and handler ownership during entrance", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?motion&css-transform`);
  await expect(page.locator(sectors)).not.toHaveCount(0);
  await expect(page.locator('[data-kind-ui="pie-entrance-window"]')).toHaveCount(0);
  expect(
    await page
      .locator(sectors)
      .first()
      .evaluate((node) => getComputedStyle(node).transform),
  ).not.toBe("none");
  const chart = page.getByRole("application", { name: "Packed pie chart" });
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-kind-ui="chart-tooltip"]')).toContainText("Beta");
});

test("initial category survives reorder, clears on removal and only remount restores it", async ({
  page,
}) => {
  await page.goto(`${url}/?pinned`);
  const tooltip = page.locator('[data-kind-ui="chart-tooltip"]');
  await expect(tooltip).toContainText("Beta");
  await expect(tooltip).toContainText("40 seats");
  await expect(tooltip).toHaveCount(1);
  await page.getByRole("button", { name: "Reorder pin", exact: true }).click();
  await expect(tooltip).toContainText("Beta");
  await page.getByRole("button", { name: "Remove pin", exact: true }).click();
  await expect(tooltip).not.toBeVisible();
  await page.getByRole("button", { name: "Restore pin", exact: true }).click();
  await expect(tooltip).not.toBeVisible();
  await page.getByRole("button", { name: "Remount pin", exact: true }).click();
  await expect(tooltip).toContainText("Beta");
  await page.getByRole("button", { name: "Native override", exact: true }).click();
  await expect(tooltip).not.toBeVisible();
});

test("initial Pie pin hands focus and pointer inspection to native dismissal", async ({ page }) => {
  await page.goto(`${url}/?pinned`);
  const tooltip = page.locator('[data-kind-ui="chart-tooltip"]');
  const chart = page.getByRole("application", { name: "Initial pinned pie" });
  await expect(tooltip).toContainText("Beta");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();
  await page.keyboard.press("Tab");
  await expect(chart.locator(".recharts-pie")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "After chart", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Reorder pin", exact: true }).click();
  await expect(tooltip).not.toBeVisible();
  await page.getByRole("button", { name: "Remount pin", exact: true }).click();
  await expect(tooltip).toContainText("Beta");
  await page.locator('[data-kind-ui="pie-sector"][name="alpha"]').hover();
  await expect(tooltip).toContainText("Alpha");
  await page.mouse.move(0, 0, { steps: 10 });
  await expect(tooltip).not.toBeVisible();
});

test("initial Pie pin respects visibility, ambiguous identity and native defaultIndex", async ({
  page,
}) => {
  await page.goto(`${url}/?pinned`);
  const tooltip = page.locator('[data-kind-ui="chart-tooltip"]');
  await expect(tooltip).toContainText("Beta");
  await page.getByRole("button", { name: "Native index", exact: true }).click();
  await expect(tooltip).toContainText("Alpha");
  await page.getByRole("button", { name: "Native index", exact: true }).click();
  await expect(tooltip).toContainText("Beta");
  await page.getByRole("button", { name: "Filter pin", exact: true }).click();
  await expect(tooltip).not.toBeVisible();
  await page.getByRole("button", { name: "Show pin", exact: true }).click();
  await expect(tooltip).not.toBeVisible();
  await page.getByRole("button", { name: "Remount pin", exact: true }).click();
  await expect(tooltip).toContainText("Beta");
  await page.getByRole("button", { name: "Duplicate pin", exact: true }).click();
  await expect(tooltip).not.toBeVisible();
  await page.getByRole("button", { name: "Restore pin", exact: true }).click();
  await expect(tooltip).not.toBeVisible();
});

for (const category of ["zero", "unknown"]) {
  test(`initial accessor Pie pin handles ${category} identity`, async ({ page }) => {
    await page.goto(`${url}/?pinned&accessor&category=${category}`);
    const tooltip = page.locator('[data-kind-ui="chart-tooltip"]');
    if (category === "zero") {
      await expect(tooltip).toContainText("Zero");
      await expect(tooltip.locator('[data-kind-ui="chart-tooltip-value"]')).toHaveText("0");
    } else {
      await expect(tooltip).not.toBeVisible();
    }
  });
}
