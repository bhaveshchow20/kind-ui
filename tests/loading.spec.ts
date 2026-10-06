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
  bar: "grow",
  combo: "combined",
  scatter: "emerge",
  waterfall: "grow",
  histogram: "grow",
  "box-plot": "grow",
  pie: "angular",
  radar: "radial",
  "radial-bar": "angular",
  "activity-rings": "angular",
  heatmap: "wave",
  sankey: "flow",
};
const skeletonSelector = '[data-kind-ui="chart-loading-skeleton"]';
const design = (card: Locator) =>
  card.locator('[data-kind-ui="loading-design"]').evaluate((element) => element.innerHTML);

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
  await page.goto("/loading.html");
  await expect(page.locator(skeletonSelector)).toHaveCount(14);
  const pause = await page.addStyleTag({
    content: '[data-kind-ui="chart-loading-skeleton"] { animation-play-state: paused !important; }',
  });
  const cards = families.map((family) => page.locator(`[data-family-card="${family}"]`));
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
    await expect(sweep).toHaveCSS("animation-name", "kind-ui-loading-pulse");
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

test("pulse geometry swaps at zero opacity and family motion becomes static under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/loading.html");
  const skeleton = page.locator('[data-family-card="line"]').locator(skeletonSelector);
  await expect(skeleton).toHaveCount(1);
  await skeleton.evaluate((element) => {
    const design = element.querySelector('[data-kind-ui="loading-design"]');
    if (!design) throw new Error("Missing design");
    const observer = new MutationObserver(() => {
      element.setAttribute("data-observed-swap-opacity", getComputedStyle(element).opacity);
      observer.disconnect();
    });
    observer.observe(design, { subtree: true, childList: true, attributes: true });
  });
  await expect(skeleton).toHaveAttribute("data-observed-swap-opacity", "0", { timeout: 4000 });
  const targets = [
    ['[data-family-card="bar"] [data-loading-motion="grow"]', "kind-ui-loading-grow"],
    ['[data-family-card="pie"] [data-kind-ui="loading-angular"]', "kind-ui-loading-angular"],
    ['[data-family-card="radar"] [data-kind-ui="loading-radar-motion"]', "kind-ui-loading-radar"],
    ['[data-family-card="heatmap"] [data-motion="heatmap-cell"]', "kind-ui-loading-cell-wave"],
    ['[data-family-card="sankey"] [data-motion="sankey-flow"]', "kind-ui-loading-flow"],
  ] as const;
  for (const [selector, animation] of targets)
    await expect(page.locator(selector).first()).toHaveCSS("animation-name", animation);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [selector] of targets) {
    await expect(page.locator(selector).first()).toHaveCSS("animation-name", "none");
    await expect(page.locator(selector).first()).toHaveCSS("transform", "none");
  }
});
