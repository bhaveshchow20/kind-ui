import { expect, type Locator, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
test.use({ baseURL: `http://127.0.0.1:${4200 + offset}` });
const families = [
  "line",
  "area",
  "bar",
  "combo",
  "scatter",
  "waterfall",
  "histogram",
  "box-plot",
  "pie",
  "radar",
  "radial-bar",
  "activity-rings",
  "heatmap",
  "sankey",
];
const motions: Record<string, string> = {
  line: "sweep",
  area: "sweep",
  bar: "sweep",
  combo: "combined",
  scatter: "emerge",
  waterfall: "sweep",
  histogram: "sweep",
  "box-plot": "sweep",
  pie: "angular",
  radar: "morph",
  "radial-bar": "angular",
  "activity-rings": "angular",
  heatmap: "wave",
  sankey: "flow",
};
const skeletonSelector = '[data-kind-ui="chart-loading-skeleton"]';
const design = (card: Locator) =>
  card.locator('[data-kind-ui="loading-design"]').evaluate((element) => {
    const copy = element.cloneNode(true) as Element;
    for (const node of copy.querySelectorAll("*")) {
      node.removeAttribute("style");
      node.removeAttribute("stroke-dasharray");
      node.removeAttribute("stroke-dashoffset");
    }
    return copy.innerHTML;
  });

test("all public families show decorative skeletons and suspend chart inspection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/loading.html");
  await expect(page.locator(skeletonSelector)).toHaveCount(14);
  for (const family of families) {
    const card = page.locator(`[data-family-card="${family}"]`);
    const skeleton = card.locator(skeletonSelector);
    await expect(skeleton).toHaveAttribute("data-family", family);
    await expect(skeleton).toHaveAttribute("data-loading-motion", motions[family] ?? "");
    await expect(skeleton).toHaveAttribute("aria-hidden", "true");
    await expect(skeleton).toBeVisible();
    await expect(card.locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(card.locator("[inert]")).toHaveCount(1);
    await expect(card.locator('[data-kind-ui="chart-loading-status"]')).toHaveText(
      "Loading chart data",
    );
    expect((await skeleton.boundingBox())?.height).toBeGreaterThan(40);
  }
  await expect(page.getByRole("application")).toHaveCount(0);
  await expect(page.locator('[data-kind-ui="tooltip-frame"]:visible')).toHaveCount(0);
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(page.locator(skeletonSelector)).toHaveCount(0);
  await expect(page.locator("[inert]")).toHaveCount(0);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator("[data-preview-status]")).toHaveText("Loaded: actual data");
  expect(errors).toEqual([]);
});

test("design stays stable through data and resize, then refreshes between pulses", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  await expect(page.locator(skeletonSelector)).toHaveCount(14);
  const pause = await page.addStyleTag({
    content: '[data-kind-ui="chart-loading-skeleton"] { animation-play-state: paused !important; }',
  });
  const cards = families
    .filter((family) => family !== "radar")
    .map((family) => page.locator(`[data-family-card="${family}"]`));
  const initial = await Promise.all(cards.map(design));
  await page.getByRole("checkbox", { name: "Empty input data" }).uncheck();
  expect(await Promise.all(cards.map(design))).toEqual(initial);
  await page.getByRole("checkbox", { name: "Wide layout" }).uncheck();
  expect(await Promise.all(cards.map(design))).toEqual(initial);
  await pause.evaluate((element) => element.parentNode?.removeChild(element));
  await expect
    .poll(() => design(page.locator('[data-family-card="line"]')))
    .not.toEqual(initial[0]);
  await expect
    .poll(async () => {
      const next = await Promise.all(cards.map(design));
      return next.every((markup, i) => markup !== initial[i]);
    })
    .toBe(true);
});

test("release, repeated interruptions and empty results preserve layout and consumer ownership", async ({
  page,
}) => {
  await page.goto("/loading.html");
  const card = page.locator('[data-family-card="bar"]');
  const chart = card.locator(".recharts-wrapper");
  await expect(chart).toHaveCount(1);
  const box = await chart.boundingBox();
  expect(box?.height).toBe(260);
  await chart.evaluate((element) => element.setAttribute("data-preserved", "yes"));
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(chart).toHaveAttribute("data-preserved", "yes");
  expect(await chart.boundingBox()).toEqual(box);
  await chart.click({ position: { x: 150, y: 100 } });
  await expect(card.locator("output")).toHaveText("1");
  const legend = card.locator('[data-kind-ui="chart-legend-button"]').first();
  await legend.click();
  await expect(legend).toHaveAttribute("aria-pressed", "false");
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Replay loading" }).click();
    await expect(page.locator(skeletonSelector)).toHaveCount(14);
    await expect(legend).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Load data" }).click();
    await expect(page.locator(skeletonSelector)).toHaveCount(0);
  }
  await page.getByRole("checkbox", { name: "Empty input data" }).check();
  await expect(page.locator("article .empty-note")).toHaveCount(14);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Replay loading" }).click();
  await expect(page.locator(skeletonSelector)).toHaveCount(14);
  await expect(chart).toHaveAttribute("data-preserved", "yes");
  await page.getByRole("checkbox", { name: "Wide layout" }).uncheck();
  await expect.poll(async () => (await chart.boundingBox())?.width).toBeLessThan(box?.width ?? 0);
  expect((await chart.boundingBox())?.height).toBe(260);
});

test("line empty-to-data release starts the real entrance and loading interrupts it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const card = page.locator('[data-family-card="line"]');
  const reveal = card.locator('clipPath[id$="-reveal"] rect');
  await expect(card.locator(skeletonSelector)).toBeVisible();
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(reveal).toHaveCount(1);
  const width = await reveal.getAttribute("width");
  expect(Number.parseFloat(width ?? "100")).toBeLessThan(100);
  await page.getByRole("button", { name: "Replay loading" }).click();
  await expect(reveal).toHaveCount(0);
  await expect(card.locator(skeletonSelector)).toBeVisible();
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(reveal).toHaveCount(1);
});

test("live reduced motion makes every skeleton static and skips real entrance", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const sweeps = page.locator(skeletonSelector);
  await expect(sweeps).toHaveCount(14);
  for (const sweep of await sweeps.all())
    await expect(sweep).toHaveCSS(
      "animation-name",
      (await sweep.getAttribute("data-family")) === "radar" ? "none" : "kind-ui-loading-pulse",
    );
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const sweep of await sweeps.all()) await expect(sweep).toHaveCSS("animation-name", "none");
  const staticDesigns = await Promise.all(
    families.map((family) => design(page.locator(`[data-family-card="${family}"]`))),
  );
  await page.waitForTimeout(1900);
  expect(
    await Promise.all(
      families.map((family) => design(page.locator(`[data-family-card="${family}"]`))),
    ),
  ).toEqual(staticDesigns);
  await page.getByRole("button", { name: "Load data" }).click();
  await expect(page.locator('clipPath[id$="-reveal"]')).toHaveCount(0);
  await expect(page.locator(skeletonSelector)).toHaveCount(0);
});

test("optional loading updates preserve native engine identity and active tooltips are concealed", async ({
  page,
}) => {
  await page.goto("/loading.html");
  await page.getByRole("button", { name: "Load data" }).click();
  const card = page.locator('[data-family-card="line"]');
  const chart = card.locator(".recharts-wrapper");
  const bounds = await chart.boundingBox();
  await chart.evaluate((element) => element.setAttribute("data-preserved", "yes"));
  await chart.hover({ position: { x: 180, y: 100 } });
  await expect(card.locator('[data-kind-ui="tooltip-frame"]:visible')).toHaveCount(1);
  await page.getByRole("button", { name: "Replay loading" }).click();
  await expect(card.locator('[data-kind-ui="tooltip-frame"]:visible')).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Enable loading prop" }).uncheck();
  await expect(chart).toHaveAttribute("data-preserved", "yes");
  expect(await chart.boundingBox()).toEqual(bounds);
  await page.getByRole("checkbox", { name: "Enable loading prop" }).check();
  await expect(card.locator(skeletonSelector)).toBeVisible();
  await expect(chart).toHaveAttribute("data-preserved", "yes");
  expect(await chart.boundingBox()).toEqual(bounds);
});

test("Sankey and short Heatmap retain native bounds through loading and replay", async ({
  page,
}) => {
  await page.goto("/loading.html");
  await page.getByRole("checkbox", { name: "Short heatmap" }).check();
  const sankey = page.locator('[data-family-card="sankey"] [data-kind-ui="sankey"]');
  const flow = sankey.locator(".recharts-wrapper");
  const heatmap = page.locator('[data-family-card="heatmap"] [data-kind-ui="heatmap-grid"]');
  const heatSkeleton = page.locator('[data-family-card="heatmap"]').locator(skeletonSelector);
  await expect(flow).toHaveCount(1);
  const flowBounds = await flow.boundingBox();
  const hostBounds = await sankey.boundingBox();
  const gridBounds = await heatmap.boundingBox();
  const placeholderBounds = await heatSkeleton.boundingBox();
  expect(flowBounds?.height).toBe(260);
  expect(hostBounds?.height).toBe(flowBounds?.height);
  expect(placeholderBounds?.height).toBeLessThanOrEqual(gridBounds?.height ?? 0);
  await page.getByRole("button", { name: "Load data" }).click();
  expect(await flow.boundingBox()).toEqual(flowBounds);
  expect(await sankey.boundingBox()).toEqual(hostBounds);
  expect(await heatmap.boundingBox()).toEqual(gridBounds);
  await page.getByRole("button", { name: "Replay loading" }).click();
  expect(await flow.boundingBox()).toEqual(flowBounds);
  expect(await sankey.boundingBox()).toEqual(hostBounds);
  expect(await heatmap.boundingBox()).toEqual(gridBounds);
  expect(await heatSkeleton.boundingBox()).toEqual(placeholderBounds);
});

test("three normal-speed pulses give pulse-based families visibly distinct geometry at invisible boundaries", async ({
  page,
}) => {
  test.setTimeout(25000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  await expect(page.locator(skeletonSelector)).toHaveCount(14);
  await page.locator(skeletonSelector).evaluateAll((elements) => {
    for (const surface of elements) {
      if (surface.getAttribute("data-family") === "radar") continue;
      const design = surface.querySelector('[data-kind-ui="loading-design"]');
      if (!design) throw new Error("Missing family design");
      const geometry = () => {
        const clone = design.cloneNode(true) as Element;
        for (const node of clone.querySelectorAll("*")) {
          node.removeAttribute("style");
          node.removeAttribute("stroke-dasharray");
          node.removeAttribute("stroke-dashoffset");
        }
        return clone.innerHTML;
      };
      const metric = () => {
        const family = surface.getAttribute("data-family");
        if (family === "heatmap")
          return Array.from(design.querySelectorAll("rect"), (node) =>
            Number(node.getAttribute("opacity")),
          );
        if (family === "scatter")
          return Array.from(design.querySelectorAll("circle"), (node) =>
            Number(node.getAttribute("cy")),
          );
        if (family === "radial-bar" || family === "activity-rings")
          return Array.from(design.querySelectorAll("path"), (node) => node.getTotalLength());
        if (family === "radar")
          return (
            (design.querySelector("polygon:last-child")?.getAttribute("points") ?? "")
              .match(/-?\d+(?:\.\d+)?/g)
              ?.map(Number) ?? []
          );
        if (["bar", "combo", "histogram", "box-plot", "waterfall", "sankey"].includes(family ?? ""))
          return Array.from(design.querySelectorAll("rect"), (node) => [
            Number(node.getAttribute("y")),
            Number(node.getAttribute("height")),
          ]).flat();
        return Array.from(
          design.querySelectorAll("path"),
          (node) => (node.getAttribute("d") ?? "").match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [],
        ).flat();
      };
      let prior = geometry();
      const samples = [
        { geometry: prior, metric: metric(), opacity: Number(getComputedStyle(surface).opacity) },
      ];
      surface.setAttribute("data-pulse-samples", JSON.stringify(samples));
      const observer = new MutationObserver(() => {
        const current = geometry();
        if (current === prior) return;
        prior = current;
        samples.push({
          geometry: current,
          metric: metric(),
          opacity: Number(getComputedStyle(surface).opacity),
        });
        surface.setAttribute("data-pulse-samples", JSON.stringify(samples));
        if (samples.length >= 4) observer.disconnect();
      });
      observer.observe(design, { subtree: true, childList: true, attributes: true });
    }
  });
  await expect
    .poll(
      async () =>
        page
          .locator(skeletonSelector)
          .evaluateAll((elements) =>
            elements
              .filter((element) => element.getAttribute("data-family") !== "radar")
              .every(
                (element) =>
                  JSON.parse(element.getAttribute("data-pulse-samples") ?? "[]").length >= 4,
              ),
          ),
      { timeout: 15000 },
    )
    .toBe(true);
  const observations = await page.locator(skeletonSelector).evaluateAll((elements) =>
    elements
      .filter((element) => element.getAttribute("data-family") !== "radar")
      .map((element) => ({
        family: element.getAttribute("data-family"),
        samples: JSON.parse(element.getAttribute("data-pulse-samples") ?? "[]") as {
          geometry: string;
          metric: number[];
          opacity: number;
        }[],
      })),
  );
  for (const { family, samples } of observations) {
    expect(new Set(samples.map((sample) => sample.geometry)).size, family ?? "").toBe(4);
    for (let index = 1; index < samples.length; index++) {
      const previous = samples[index - 1];
      const current = samples[index];
      if (!previous || !current) throw new Error("Incomplete pulse observations");
      expect(current.opacity, `${family} swaps invisibly`).toBeLessThanOrEqual(0.001);
      if (current.metric.length !== previous.metric.length) continue;
      const rms = Math.sqrt(
        current.metric.reduce(
          (sum, value, slot) => sum + (value - (previous.metric[slot] ?? value)) ** 2,
          0,
        ) / current.metric.length,
      );
      expect(rms, `${family} profile is more than small jitter`).toBeGreaterThan(
        family === "heatmap" ? 0.12 : 10,
      );
    }
  }
});

test("native motion uses moving soft windows and reduced motion removes recurring movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const line = page.locator('[data-family-card="line"]').locator(skeletonSelector);
  const window = line.locator('[data-kind-ui="loading-leading-window"]').first();
  await expect(window).toHaveCount(1);
  const before = Number(await window.getAttribute("x"));
  await expect
    .poll(async () => Number(await window.getAttribute("x")))
    .toBeGreaterThan(before + 80);
  const stops = await line.locator('linearGradient[id$="-soft-x"] stop').evaluateAll((elements) =>
    elements.map((element) => ({
      offset: element.getAttribute("offset"),
      opacity: element.getAttribute("stop-opacity"),
    })),
  );
  expect(stops).toEqual([
    { offset: "0", opacity: "0" },
    { offset: "0.35", opacity: null },
    { offset: "0.75", opacity: null },
    { offset: "1", opacity: "0" },
  ]);
  // The bounded gradient moves as a whole: the trailing position becomes transparent
  // while the leading edge advances, rather than accumulating already revealed marks.
  const live = await window.evaluate((element) => ({
    x: Number(element.getAttribute("x")),
    width: Number(element.getAttribute("width")),
  }));
  expect(live.width).toBe(320);
  expect(live.x).toBeGreaterThan(before);
  const trail = await window.evaluate(
    (element) =>
      new Promise<{ leadAdvance: number; beforeAlpha: number; afterAlpha: number }>(
        (resolve, reject) => {
          const started = performance.now();
          let leading: { x: number; alpha: number } | null = null;
          const tick = () => {
            const x = Number(element.getAttribute("x"));
            const t = (320 - x) / 320;
            const alpha =
              t <= 0 || t >= 1 ? 0 : t < 0.35 ? t / 0.35 : t > 0.75 ? (1 - t) / 0.25 : 1;
            if (x >= 100 && x <= 220 && alpha > 0.9) leading = { x, alpha };
            if (leading && x >= 300 && x < 500) {
              resolve({
                leadAdvance: x - leading.x,
                beforeAlpha: leading.alpha,
                afterAlpha: alpha,
              });
              return;
            }
            if (leading && x < leading.x) leading = null;
            if (performance.now() - started > 5000) {
              reject(new Error("No moving trail observed"));
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },
      ),
  );
  expect(trail.leadAdvance).toBeGreaterThan(80);
  expect(trail.beforeAlpha).toBeGreaterThan(0.9);
  expect(trail.afterAlpha).toBeLessThan(0.25);
  const duration = await line.getAttribute("data-reveal-duration");
  expect(duration).toBe("1100");
  const barMask = await page
    .locator('[data-family-card="bar"] [data-kind-ui="loading-design"]')
    .getAttribute("mask");
  expect(barMask).toMatch(/-horizontal\)$/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('[data-kind-ui="loading-leading-window"]')).toHaveCount(0);
  for (const surface of await page.locator(skeletonSelector).all())
    await expect(surface).toHaveCSS("animation-name", "none");
  const marks = page.locator('[data-kind-ui="loading-mark"]');
  for (const mark of await marks.all()) await expect(mark).toHaveCSS("opacity", "1");
});

test("Combo resolves all native mask resources and Sankey paths advance then erase", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const combo = page.locator('[data-family-card="combo"]').locator(skeletonSelector);
  for (const [part, suffix] of [
    ["grow", "vertical"],
    ["area-reveal", "area"],
    ["reveal", "horizontal"],
  ] as const) {
    const mask = await combo.locator(`[data-loading-motion="${part}"]`).evaluate((element) => {
      const css = getComputedStyle(element);
      const resource = css.maskImage.match(/#([^"')]+)/)?.[1];
      const target = resource ? document.getElementById(resource) : null;
      return {
        image: css.maskImage,
        clip: css.clipPath,
        type: target?.tagName,
        id: target?.id,
        window: target?.querySelector("rect")?.tagName,
      };
    });
    expect(mask.type, `${part} resolves a mask, not an invalid clipPath`).toBe("mask");
    expect(mask.id).toMatch(new RegExp(`-${suffix}$`));
    expect(mask.window).toBe("rect");
    expect(mask.clip).toBe("none");
  }
  await page.getByRole("button", { name: "Load data" }).click();
  await page.getByRole("button", { name: "Replay loading" }).click();
  const flow = page
    .locator('[data-family-card="sankey"] [data-kind-ui="loading-flow-window"]')
    .first();
  const observed = await flow.evaluate(
    (element) =>
      new Promise<{ peak: number; final: number; offset: number }>((resolve, reject) => {
        const start = performance.now();
        let peak = 0;
        const tick = () => {
          const dash = Number((element.getAttribute("stroke-dasharray") ?? "0").split(/[ ,]/)[0]);
          const offset = Number(element.getAttribute("stroke-dashoffset"));
          peak = Math.max(peak, dash);
          if (peak > 0.7 && dash < 0.15 && offset < -0.8) {
            resolve({ peak, final: dash, offset });
            return;
          }
          if (performance.now() - start > 4000) {
            reject(
              new Error(`No path advance/erase: peak=${peak}, dash=${dash}, offset=${offset}`),
            );
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  expect(observed.peak).toBeGreaterThan(0.7);
  expect(observed.final).toBeLessThan(0.15);
  expect(observed.offset).toBeLessThan(-0.8);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(flow).toHaveAttribute("stroke-dasharray", "1 1");
  await expect(flow).toHaveAttribute("stroke-dashoffset", "0");
  await expect(page.locator('[data-kind-ui="loading-leading-window"]')).toHaveCount(0);
});

test.describe("normal-speed visual recording", () => {
  test("records all family pulses and the real loading exit", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: 1600, height: 2200 },
      reducedMotion: "no-preference",
      recordVideo: { dir: testInfo.outputPath("video"), size: { width: 1600, height: 2200 } },
    });
    const page = await context.newPage();
    test.setTimeout(30000);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`http://127.0.0.1:${4200 + offset}/loading.html`);
    await expect(page.locator(skeletonSelector)).toHaveCount(14);
    await page.addStyleTag({
      content:
        ".charts { grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: 1520px !important; } main { max-width: 1520px; margin: 8px auto; } article { padding: 12px; } h1 { font-size: 30px; margin: 6px 0; } nav { margin: 8px 0; } .family-note { margin-bottom: 3px; }",
    });
    await page
      .locator("main")
      .evaluate((element) => element.setAttribute("data-recording-session", "persistent"));
    await page.waitForTimeout(620);
    await page.screenshot({ path: testInfo.outputPath("all-family-pulse-1.png"), fullPage: true });
    await page.waitForTimeout(2400);
    await page.screenshot({ path: testInfo.outputPath("all-family-pulse-2.png"), fullPage: true });
    await page.waitForTimeout(2400);
    await page.screenshot({ path: testInfo.outputPath("all-family-pulse-3.png"), fullPage: true });
    await page.waitForTimeout(10580);
    await expect(page.locator("main")).toHaveAttribute("data-recording-session", "persistent");
    await expect(page.getByRole("heading", { name: "A chart-shaped pause." })).toBeVisible();
    expect(
      await page
        .locator(".charts")
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length),
    ).toBe(4);
    await page.screenshot({ path: testInfo.outputPath("all-family-loading.png"), fullPage: true });
    await page.getByRole("button", { name: "Load data" }).click();
    await expect(page.locator(skeletonSelector)).toHaveCount(0);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: testInfo.outputPath("all-family-loaded.png"), fullPage: true });
    await context.close();
    const video = page.video();
    if (video)
      await testInfo.attach("normal-speed-all-family-loading", {
        path: await video.path(),
        contentType: "video/webm",
      });
  });
});

test("bar-shaped families reveal left to right and fade behind the advancing front", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  for (const family of ["bar", "waterfall", "histogram", "box-plot"]) {
    const surface = page.locator(`[data-family-card="${family}"]`).locator(skeletonSelector);
    await expect(surface.locator('[data-kind-ui="loading-design"]')).toHaveAttribute(
      "mask",
      /-horizontal\)$/,
    );
    for (const group of await surface.locator('[data-loading-motion="grow"]').all())
      await expect(group).toHaveCSS("mask-image", "none");
  }
  const observations = await page.locator(skeletonSelector).evaluateAll((elements) =>
    Promise.all(
      elements
        .filter((el) =>
          ["bar", "waterfall", "histogram", "box-plot"].includes(
            el.getAttribute("data-family") ?? "",
          ),
        )
        .map(
          (surface) =>
            new Promise<{
              family: string | null;
              advance: number;
              beforeAlpha: number;
              afterAlpha: number;
            }>((resolve, reject) => {
              const id = surface
                .querySelector('[data-kind-ui="loading-design"]')
                ?.getAttribute("mask")
                ?.match(/#([^)]*)/)?.[1];
              const window = id ? document.getElementById(id)?.querySelector("rect") : null;
              const started = performance.now();
              let leading: { x: number; alpha: number } | null = null;
              const tick = () => {
                const x = Number(window?.getAttribute("x"));
                const t = (320 - x) / 320;
                const alpha =
                  t <= 0 || t >= 1 ? 0 : t < 0.35 ? t / 0.35 : t > 0.75 ? (1 - t) / 0.25 : 1;
                if (x >= 100 && x <= 220 && alpha > 0.9) leading = { x, alpha };
                if (leading && x >= 300 && x < 500) {
                  resolve({
                    family: surface.getAttribute("data-family"),
                    advance: x - leading.x,
                    beforeAlpha: leading.alpha,
                    afterAlpha: alpha,
                  });
                  return;
                }
                if (leading && x < leading.x) leading = null;
                if (performance.now() - started > 6000) {
                  reject(new Error("Missing horizontal trail"));
                  return;
                }
                requestAnimationFrame(tick);
              };
              requestAnimationFrame(tick);
            }),
        ),
    ),
  );
  for (const sample of observations) {
    expect(sample.advance, sample.family ?? "").toBeGreaterThan(80);
    expect(sample.beforeAlpha).toBeGreaterThan(0.9);
    expect(sample.afterAlpha).toBeLessThan(0.25);
  }
});

test("both Radar polygons morph continuously through wrap, resize and interruptions, and stop for reduced motion", async ({
  page,
}) => {
  test.setTimeout(25000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const radar = page.locator('[data-family-card="radar"]').locator(skeletonSelector);
  const polygons = radar.locator('[data-kind-ui="loading-radar-polygon"]');
  await expect(polygons).toHaveCount(2);
  await expect(radar).toHaveCSS("animation-name", "none");
  expect(await radar.locator('[data-kind-ui="loading-design"]').getAttribute("mask")).toBeNull();
  const observation = polygons.evaluateAll(
    (nodes) =>
      new Promise<{ changes: number[]; maxSpeed: number; minOpacity: number; valid: boolean }>(
        (resolve) => {
          const started = performance.now();
          const initial = nodes.map(
            (node) =>
              (node.getAttribute("points") ?? "").match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [],
          );
          let last = initial;
          let lastTime = started;
          const changes = [0, 0];
          let maxSpeed = 0;
          let minOpacity = 1;
          let valid = true;
          const tick = () => {
            const now = performance.now();
            const current = nodes.map(
              (node) =>
                (node.getAttribute("points") ?? "").match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [],
            );
            minOpacity = Math.min(
              minOpacity,
              Number(getComputedStyle(nodes[0]?.closest("svg") as SVGElement).opacity),
            );
            current.forEach((points, index) => {
              valid &&=
                points.length === 12 &&
                points.every((value, slot) =>
                  slot % 2 === 0 ? value >= 200 && value <= 440 : value >= 0 && value <= 240,
                );
              const drift = Math.max(
                ...points.map((value, slot) => Math.abs(value - (initial[index]?.[slot] ?? value))),
              );
              changes[index] = Math.max(changes[index] ?? 0, drift);
              if (now - lastTime > 0 && now - lastTime < 60)
                maxSpeed = Math.max(
                  maxSpeed,
                  ...points.map(
                    (value, slot) =>
                      (Math.abs(value - (last[index]?.[slot] ?? value)) / (now - lastTime)) * 1000,
                  ),
                );
            });
            last = current;
            lastTime = now;
            if (now - started > 8500) {
              resolve({ changes, maxSpeed, minOpacity, valid });
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },
      ),
  );
  await page.waitForTimeout(600);
  await page.getByRole("checkbox", { name: "Empty input data" }).uncheck();
  await page.waitForTimeout(600);
  await page.getByRole("checkbox", { name: "Wide layout" }).uncheck();
  const sample = await observation;
  expect(sample.valid).toBe(true);
  expect(sample.changes.every((value) => value > 35)).toBe(true);
  expect(sample.minOpacity).toBe(1);
  expect(sample.maxSpeed).toBeLessThan(150);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  const still = await polygons.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("points")),
  );
  await page.waitForTimeout(1000);
  expect(
    await polygons.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("points"))),
  ).toEqual(still);
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Load data" }).click();
    await expect(polygons).toHaveCount(0);
    await page.getByRole("button", { name: "Replay loading" }).click();
    await expect(polygons).toHaveCount(2);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(() => polygons.first().getAttribute("points"))
    .not.toEqual(await polygons.first().getAttribute("points"));
});

test("RadialBar keeps angular velocity through closing across multiple real-speed cycles", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const band = page
    .locator('[data-family-card="radial-bar"] [data-kind-ui="loading-angular"]')
    .first();
  await band.scrollIntoViewIfNeeded();
  const sample = await band.evaluate(
    (element) =>
      new Promise<{ seams: number; minSpeed: number; maxSpeed: number }>((resolve) => {
        const started = performance.now();
        let previous: { progress: number; time: number } | null = null;
        let seams = 0;
        let minSpeed = Infinity;
        let maxSpeed = 0;
        const tick = () => {
          const now = performance.now();
          const progress = -Number(element.getAttribute("stroke-dashoffset")) / 100;
          if (
            previous &&
            progress >= 0.9 &&
            progress <= 1.15 &&
            progress >= previous.progress &&
            now - previous.time < 60
          ) {
            const speed = ((progress - previous.progress) / (now - previous.time)) * 1000;
            minSpeed = Math.min(minSpeed, speed);
            maxSpeed = Math.max(maxSpeed, speed);
            if (previous.progress < 1 && progress >= 1) seams++;
          }
          previous = { progress, time: now };
          if (now - started > 7200) {
            resolve({ seams, minSpeed, maxSpeed });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  expect(sample.seams).toBeGreaterThanOrEqual(2);
  expect(sample.minSpeed).toBeGreaterThan(0.65);
  expect(sample.maxSpeed).toBeLessThan(1.2);
});
