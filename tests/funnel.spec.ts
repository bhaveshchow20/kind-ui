import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, test } from "@playwright/test";

const packed = `http://127.0.0.1:${4197 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
const stage = (chart: Locator, id: string) =>
  chart.locator(`[data-kind-ui="funnel-stage"][data-stage-id="${id}"]`);
async function polygonArea(mark: Locator) {
  return mark.evaluate((node) => {
    const pairs = (node.getAttribute("points") ?? "")
      .trim()
      .split(/\s+/)
      .map((pair) => pair.split(",").map(Number));
    return (
      Math.abs(
        pairs.reduce((sum, point, index) => {
          const next = pairs[(index + 1) % pairs.length];
          return sum + (point[0] ?? 0) * (next?.[1] ?? 0) - (next?.[0] ?? 0) * (point[1] ?? 0);
        }, 0),
      ) / 2
    );
  });
}
for (const horizontal of [false, true]) {
  test(`packed rectangles preserve actual value areas and supplied stage order ${horizontal ? "horizontal" : "vertical"}`, async ({
    page,
  }) => {
    await page.goto(`${packed}${horizontal ? "?horizontal" : ""}`);
    const chart = page.getByRole("region", { name: "Stage snapshot" });
    const marks = chart.locator('[data-kind-ui="funnel-mark"]');
    await expect(marks).toHaveCount(3);
    const areas = await Promise.all(
      ["entry", "review", "growth"].map((id) =>
        polygonArea(stage(chart, id).locator('[data-kind-ui="funnel-mark"]')),
      ),
    );
    expect(areas[0]).toBeGreaterThan(0);
    expect((areas[1] ?? 0) / (areas[0] ?? 1)).toBeCloseTo(0.5, 6);
    expect((areas[2] ?? 0) / (areas[0] ?? 1)).toBeCloseTo(0.75, 6);
    await expect(chart.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(5);
    expect(
      await chart
        .locator('[data-kind-ui="funnel-stage"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-stage-id"))),
    ).toEqual(["entry", "review", "growth", "zero", "unknown"]);
    await expect(stage(chart, "zero")).toHaveAttribute("data-value-state", "zero");
    await expect(stage(chart, "unknown")).toHaveAttribute("data-value-state", "unknown");
    await expect(stage(chart, "zero").locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
    await expect(stage(chart, "unknown").locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
    await expect(chart.getByRole("table")).toContainText("Unknown");
    await expect(chart.getByRole("table")).toContainText("50%");
    await expect(chart.getByRole("table")).toContainText("75%");
    const originalArea = await polygonArea(
      stage(chart, "entry").locator('[data-kind-ui="funnel-mark"]'),
    );
    await page.getByRole("button", { name: "Resize", exact: true }).click();
    await expect
      .poll(() => polygonArea(stage(chart, "entry").locator('[data-kind-ui="funnel-mark"]')))
      .toBeLessThan(originalArea);
    // Read paired geometry in one browser turn after the native resize has committed.
    const resizedAreas = await marks.evaluateAll((nodes) =>
      nodes.map((node) => {
        const pairs = (node.getAttribute("points") ?? "")
          .trim()
          .split(/\s+/)
          .map((pair) => pair.split(",").map(Number));
        return (
          Math.abs(
            pairs.reduce((sum, point, index) => {
              const next = pairs[(index + 1) % pairs.length];
              return sum + (point[0] ?? 0) * (next?.[1] ?? 0) - (next?.[0] ?? 0) * (point[1] ?? 0);
            }, 0),
          ) / 2
        );
      }),
    );
    const resized = resizedAreas[1] ?? 0;
    const resizedBase = resizedAreas[0] ?? 1;
    expect(resized / resizedBase).toBeCloseTo(0.5, 6);
    await page.getByRole("button", { name: "Theme", exact: true }).click();
    expect(
      await polygonArea(stage(chart, "review").locator('[data-kind-ui="funnel-mark"]')),
    ).toBeCloseTo(resized, 6);
    await expect(
      page.getByRole("region", { name: "Explicit parts" }).locator('[data-kind-ui="funnel-stage"]'),
    ).toHaveCount(0);
  });
}
test("taper encodes each boundary width without forced monotonic order or missing zero paint", async ({
  page,
}) => {
  await page.goto(`${packed}?taper`);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const mark = (id: string) => stage(chart, id).locator('[data-kind-ui="funnel-mark"]');
  const width = async (id: string, edge: "upper" | "lower") =>
    Number(await mark(id).getAttribute(`data-${edge}-width`));
  const max = await width("entry", "upper");
  expect(await width("entry", "lower")).toBeCloseTo(max * 0.5, 6);
  expect(await width("review", "upper")).toBeCloseTo(max * 0.5, 6);
  expect(await width("review", "lower")).toBeCloseTo(max * 0.75, 6);
  expect(await width("growth", "upper")).toBeCloseTo(max * 0.75, 6);
});
test("keyboard inspection, original record readouts, refs and consumer veto survive data replacement", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const first = stage(chart, "entry");
  const originalNode = await first.elementHandle();
  await expect(first).toHaveAttribute("data-consumer-ref", "attached");
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(stage(chart, "review")).toBeFocused();
  await page.keyboard.press("End");
  await expect(stage(chart, "unknown")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  await expect(first).toBeFocused();
  expect(await first.evaluate((node, original) => node === original, originalNode)).toBe(true);
  await page.keyboard.press("Home");
  await expect(chart.getByRole("tooltip")).toContainText("Entry");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  await page.keyboard.press("ArrowLeft");
  await expect(chart.getByRole("tooltip")).toContainText("Entry");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await expect(stage(chart, "review")).toBeFocused();
  await expect(chart.getByRole("tooltip")).toContainText("Review");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "Veto clicks", exact: true }).click();
  const writes = await page.getByLabel("Inspection writes").textContent();
  await first.dispatchEvent("click");
  await expect(page.getByLabel("Consumer clicks")).toHaveText("1");
  await expect(page.getByLabel("Inspection writes")).toHaveText(writes ?? "");
  await page.getByRole("button", { name: "Stale inspection", exact: true }).click();
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  const staleWrites = await page.getByLabel("Inspection writes").textContent();
  await page.getByRole("button", { name: "Replace data", exact: true }).click();
  await expect(stage(chart, "entry")).toHaveCount(0);
  await expect(page.getByLabel("Inspection writes")).toHaveText(staleWrites ?? "");
  await expect(chart).toContainText("3 days");
});
test("loading hides settled readouts and stage interaction; reduced motion settles geometry", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(chart.getByRole("table")).not.toBeVisible();
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  await expect(chart.locator('[data-kind-ui="funnel-stage"][tabindex="0"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(chart.getByRole("table")).toBeVisible();
  await expect(stage(chart, "review")).toBeVisible();
  const before = await polygonArea(stage(chart, "review").locator('[data-kind-ui="funnel-mark"]'));
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await polygonArea(stage(chart, "review").locator('[data-kind-ui="funnel-mark"]')),
  ).toBeCloseTo(before, 6);
});
test("touch inspection and narrow viewport retain accessible alternatives", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await stage(chart, "review").tap();
  await expect(chart.getByRole("tooltip")).toContainText("Review");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).include("main").analyze();
  expect(result.violations).toEqual([]);
  await context.close();
});

test("stage activation uses controlled selection and does not remove other numeric geometry", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const mark = stage(chart, "review");
  await mark.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Stage selection")).toHaveText("review");
  await expect(mark).toHaveAttribute("aria-pressed", "true");
  await expect(chart.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(3);
  await page.keyboard.press("Space");
  await expect(page.getByLabel("Stage selection")).toHaveText("none");
  await stage(chart, "zero").click();
  await expect(page.getByLabel("Stage selection")).toHaveText("zero");
  await stage(chart, "unknown").click();
  await expect(page.getByLabel("Stage selection")).toHaveText("unknown");
  await expect(chart.getByRole("tooltip")).toContainText("Unknown");
});

test("comparison panels use the explicit common scale and do not normalize to their own maximum", async ({
  page,
}) => {
  await page.goto(packed);
  const primary = page.getByRole("region", { name: "Stage snapshot" });
  const comparison = page.getByRole("region", { name: "Comparison" });
  const baseline = Number(
    await stage(primary, "entry")
      .locator('[data-kind-ui="funnel-mark"]')
      .getAttribute("data-upper-width"),
  );
  const smaller = Number(
    await stage(comparison, "small")
      .locator('[data-kind-ui="funnel-mark"]')
      .getAttribute("data-upper-width"),
  );
  expect(smaller / baseline).toBeCloseTo(0.25, 6);
  await expect(comparison.getByRole("table")).toContainText("25%");
});

test("single, all-zero and empty supplied stages retain truthful numeric alternatives", async ({
  page,
}) => {
  await page.goto(packed);
  const single = page.getByRole("region", { name: "Single stage" });
  const mark = single.locator('[data-kind-ui="funnel-mark"]');
  await expect(mark).toHaveCount(1);
  expect(await mark.getAttribute("data-upper-width")).toEqual(
    await mark.getAttribute("data-lower-width"),
  );
  await expect(single.getByRole("table")).toContainText("7.5");
  await expect(single.getByRole("table")).toContainText("100%");
  const zero = page.getByRole("region", { name: "All zero" });
  await expect(zero.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(2);
  await expect(zero.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
  await expect(zero.getByRole("table")).toContainText("First zero");
  const empty = page.getByRole("region", { name: "Empty stages" });
  await expect(empty.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(0);
  await expect(empty.getByRole("table")).toHaveCount(1);
});

test("React callback-ref cleanup runs when native stage geometry is removed", async ({ page }) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await expect(stage(chart, "entry")).toHaveAttribute("data-consumer-ref", "attached");
  await page.getByRole("button", { name: "Replace data", exact: true }).click();
  await expect(stage(chart, "entry")).toHaveCount(0);
  await page.getByRole("button", { name: "Read ref cleanup", exact: true }).click();
  expect(Number(await page.getByLabel("Ref cleanup count").textContent())).toBeGreaterThan(0);
});

test("strict LazyMotion consumers retain stage rendering and keyboard inspection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${packed}?lazy`);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await expect(chart.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(3);
  await stage(chart, "entry").focus();
  await expect(chart.getByRole("tooltip")).toContainText("Entry");
  expect(errors).toEqual([]);
});
test("unrepresentable positive screen geometry fails visibly instead of painting measured zero", async ({
  page,
}) => {
  await page.goto(`${packed}?extreme`);
  await expect(page.getByRole("alert")).toContainText(/rescal|represent/i);
  await expect(page.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
});

for (const animated of [false, true]) {
  test(`development React strict LazyMotion preserves ${animated ? "animated" : "static"} Funnel marks and inspection`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const development = `http://127.0.0.1:${4204 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
    await page.goto(`${development}?lazy${animated ? "" : "&static"}`);
    const chart = page.getByRole("region", { name: "Stage snapshot" });
    await expect(chart.locator('[data-kind-ui="funnel-mark"]')).toHaveCount(3);
    await stage(chart, "review").focus();
    await expect(chart.getByRole("tooltip")).toContainText("Review");
    await expect(chart.getByRole("tooltip")).toContainText("50%");
    await expect(chart.getByRole("table")).toContainText("75%");
    expect(errors).toEqual([]);
  });
}

test("inline accessors and denominator callbacks retain native DOM while original metadata refreshes", async ({
  page,
}) => {
  await page.goto(`${packed}?inline`);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const first = stage(chart, "entry");
  const originalNode = await first.elementHandle();
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(chart.getByRole("tooltip")).toContainText("50%");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  expect(await first.evaluate((node, original) => node === original, originalNode)).toBe(true);
  await stage(chart, "zero").click();
  await expect(page.getByLabel("Stage selection")).toHaveText("zero");
  await page.getByRole("button", { name: "Refresh metadata", exact: true }).click();
  await expect(chart).toContainText("13 days");
  expect(await first.evaluate((node, original) => node === original, originalNode)).toBe(true);
  await stage(chart, "review").focus();
  await expect(chart.getByRole("tooltip")).toContainText("50%");
  await expect(chart).toContainText("Review updated: 50; 13 days");
  await stage(chart, "review").click();
  await expect(page.getByLabel("Clicked stage days")).toHaveText("13");
});

test("a new controlled active ID reopens inspection after the owner ignores Escape null", async ({
  page,
}) => {
  await page.goto(`${packed}?ignore-null`);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await stage(chart, "entry").focus();
  await expect(chart.getByRole("tooltip")).toContainText("Entry");
  await page.keyboard.press("Escape");
  await expect(chart.getByRole("tooltip")).toHaveCount(0);
  await page.getByRole("button", { name: "External inspection", exact: true }).click();
  await expect(chart.getByRole("tooltip")).toContainText("Growth");
  await expect(chart.getByRole("tooltip")).toContainText("75%");
});

test("equivalent inline animation options preserve reveal progress during frequent parent renders", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${packed}?animation-ticks`, { waitUntil: "commit" });
  await expect(
    page
      .getByRole("region", { name: "Stage snapshot" })
      .locator('[data-kind-ui="funnel-stage-paint"]'),
  ).toHaveCount(3);
  const samples = await page.evaluate(async () => {
    const values: number[] = [];
    const start = performance.now();
    return await new Promise<number[]>((resolve) => {
      const read = () => {
        const paint = document.querySelector(
          '[aria-label="Stage snapshot"] [data-kind-ui="funnel-stage-paint"]',
        );
        if (paint) values.push(Number(getComputedStyle(paint).opacity));
        if (performance.now() - start >= 900) resolve(values);
        else requestAnimationFrame(read);
      };
      read();
    });
  });
  expect(Number(await page.getByLabel("Parent ticks").textContent())).toBeGreaterThanOrEqual(8);
  expect(samples.length).toBeGreaterThan(10);
  expect(samples.at(-1)).toBeCloseTo(1, 4);
  for (let index = 1; index < samples.length; index += 1) {
    expect((samples[index] ?? 0) + 0.03).toBeGreaterThanOrEqual(samples[index - 1] ?? 0);
  }
});

test("held Enter and Space keys do not repeatedly toggle selection or write owner callbacks", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const first = stage(chart, "entry");
  await first.focus();
  await first.press("Enter");
  await expect(page.getByLabel("Stage selection")).toHaveText("entry");
  await expect(page.getByLabel("Selection writes")).toHaveText("1");
  await first.dispatchEvent("keydown", { key: "Enter", repeat: true });
  await expect(page.getByLabel("Stage selection")).toHaveText("entry");
  await expect(page.getByLabel("Selection writes")).toHaveText("1");
  await first.press("Space");
  await expect(page.getByLabel("Stage selection")).toHaveText("none");
  await expect(page.getByLabel("Selection writes")).toHaveText("2");
  await first.dispatchEvent("keydown", { key: " ", repeat: true });
  await expect(page.getByLabel("Stage selection")).toHaveText("none");
  await expect(page.getByLabel("Selection writes")).toHaveText("2");
});

test("consumer reset veto preserves the complete Escape inspection and selection operation", async ({
  page,
}) => {
  await page.goto(`${packed}?reset-veto`);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const first = stage(chart, "entry");
  await first.focus();
  await first.press("Enter");
  await expect(page.getByLabel("Stage selection")).toHaveText("entry");
  await expect(chart.getByRole("tooltip")).toContainText("Entry");
  const activeWrites = await page.getByLabel("Inspection writes").textContent();
  const selectionWrites = await page.getByLabel("Selection writes").textContent();
  await first.press("Escape");
  await expect(chart.getByRole("tooltip")).toContainText("Entry");
  await expect(page.getByLabel("Stage selection")).toHaveText("entry");
  await expect(page.getByLabel("Inspection writes")).toHaveText(activeWrites ?? "");
  await expect(page.getByLabel("Selection writes")).toHaveText(selectionWrites ?? "");
});

test("disabled mark activation retains inspection without pressed state or toggle instructions", async ({
  page,
}) => {
  await page.goto(`${packed}?none`);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const first = stage(chart, "entry");
  await first.focus();
  await expect(chart.getByRole("tooltip")).toContainText("Entry");
  expect(await first.getAttribute("aria-pressed")).toBeNull();
  await first.press("Enter");
  await first.press("Space");
  await expect(page.getByLabel("Stage selection")).toHaveText("none");
  await expect(page.getByLabel("Selection writes")).toHaveText("0");
  await expect(chart).not.toContainText("highlights a stage");
});

test("color-only legend configuration uses original stage labels and keeps explicit overrides", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Legend labels" });
  const legend = chart.locator('[data-kind-ui="chart-legend"]');
  await expect(legend.getByRole("button", { name: "Reached payment", exact: true })).toHaveCount(1);
  await expect(legend.getByRole("button", { name: "Display address", exact: true })).toHaveCount(1);
});

for (const [region, ratio] of [
  ["Previous unavailable", "Share of previous"],
  ["Callback unavailable", "Share of baseline"],
] as const) {
  test(`an explicit denominator policy keeps stable unavailable table columns: ${region}`, async ({
    page,
  }) => {
    await page.goto(packed);
    const table = page.getByRole("region", { name: region }).getByRole("table");
    await expect(table.getByRole("columnheader", { name: "Denominator", exact: true })).toHaveCount(
      1,
    );
    await expect(table.getByRole("columnheader", { name: ratio, exact: true })).toHaveCount(1);
    await expect(table.locator("tbody tr td").filter({ hasText: "Unknown" })).toHaveCount(2);
  });
}

test("native accessible description IDs preserve every consumer token alongside chart instructions", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const svg = chart.locator("svg.recharts-surface");
  await expect(svg).toHaveCount(1);
  const ids = ((await svg.getAttribute("aria-describedby")) ?? "").trim().split(/\s+/);
  expect(ids).toContain("p-2");
  expect(ids).toContain("p-4");
  expect(ids).toHaveLength(3);
  const generated = ids.find((id) => id !== "p-2" && id !== "p-4");
  expect(generated).toBeTruthy();
  const descriptions = await page.evaluate(
    (tokens) => tokens.map((id) => document.getElementById(id)?.textContent ?? null),
    ids,
  );
  expect(descriptions[0]).toContain("Inventory measured");
  expect(descriptions[1]).toContain("independent workflow stage snapshots");
  expect(descriptions[2]).toContain("Use arrow keys");
});

async function effectiveOpacity(mark: Locator) {
  return mark.evaluate((node) => {
    let value = 1;
    let element: Element | null = node;
    while (element && element.tagName.toLowerCase() !== "svg") {
      value *= Number(getComputedStyle(element).opacity);
      element = element.parentElement;
    }
    return value;
  });
}

test("a background loading refresh restores the focused stage identity without writing inspection again", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await stage(chart, "review").focus();
  await expect(stage(chart, "review")).toBeFocused();
  const writes = await page.getByLabel("Inspection writes").textContent();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("funnel-background-loading", { detail: true })),
  );
  await expect(chart.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(0);
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("funnel-background-loading", { detail: false })),
  );
  await expect(stage(chart, "review")).toBeFocused();
  await expect(chart.getByRole("tooltip")).toContainText("Review");
  await expect(page.getByLabel("Inspection writes")).toHaveText(writes ?? "");
});

test("loading completion keeps focus on a newly chosen external control", async ({ page }) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  await stage(chart, "entry").focus();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("funnel-background-loading", { detail: true })),
  );
  await expect(chart.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(0);
  const external = page.getByRole("button", { name: "External inspection", exact: true });
  await external.focus();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("funnel-background-loading", { detail: false })),
  );
  await expect(chart.locator('[data-kind-ui="funnel-stage"]')).toHaveCount(5);
  await expect(external).toBeFocused();
});

test("legend pointer and keyboard emphasis dim other stage paint without changing proportions", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Legend labels" });
  const payment = stage(chart, "payment").locator('[data-kind-ui="funnel-mark"]');
  const address = stage(chart, "address").locator('[data-kind-ui="funnel-mark"]');
  const geometry = await payment.getAttribute("points");
  const paymentLegend = chart
    .locator('[data-kind-ui="chart-legend"]')
    .getByRole("button", { name: "Reached payment", exact: true });
  const addressLegend = chart
    .locator('[data-kind-ui="chart-legend"]')
    .getByRole("button", { name: "Display address", exact: true });
  await paymentLegend.hover();
  await expect.poll(() => effectiveOpacity(address)).toBeCloseTo(0.28, 4);
  await expect.poll(() => effectiveOpacity(payment)).toBeCloseTo(1, 4);
  await page.mouse.move(0, 0);
  await expect.poll(() => effectiveOpacity(address)).toBeCloseTo(1, 4);
  await addressLegend.focus();
  await expect.poll(() => effectiveOpacity(payment)).toBeCloseTo(0.28, 4);
  await expect.poll(() => effectiveOpacity(address)).toBeCloseTo(1, 4);
  await expect(payment).toHaveAttribute("points", geometry ?? "");
});

test("disabled transient emphasis keeps legend hover and keyboard paint at baseline", async ({
  page,
}) => {
  await page.goto(`${packed}?emphasis-none`);
  const chart = page.getByRole("region", { name: "Legend labels" });
  const payment = stage(chart, "payment").locator('[data-kind-ui="funnel-mark"]');
  const address = stage(chart, "address").locator('[data-kind-ui="funnel-mark"]');
  const legend = chart
    .locator('[data-kind-ui="chart-legend"]')
    .getByRole("button", { name: "Reached payment", exact: true });
  await legend.hover();
  expect(await effectiveOpacity(address)).toBeCloseTo(1, 4);
  await page.mouse.move(0, 0);
  await legend.focus();
  expect(await effectiveOpacity(address)).toBeCloseTo(1, 4);
  expect(await effectiveOpacity(payment)).toBeCloseTo(1, 4);
});

test("persistent selection retains priority and transient legend emphasis resumes when cleared", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Legend labels" });
  const payment = stage(chart, "payment").locator('[data-kind-ui="funnel-mark"]');
  const address = stage(chart, "address").locator('[data-kind-ui="funnel-mark"]');
  const legend = chart.locator('[data-kind-ui="chart-legend"]');
  await legend.getByRole("button", { name: "Reached payment", exact: true }).click();
  await page.getByRole("button", { name: "External inspection", exact: true }).focus();
  await page.mouse.move(0, 0);
  await expect(stage(chart, "payment")).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => effectiveOpacity(address)).toBeCloseTo(0.4, 4);
  await legend.getByRole("button", { name: "Display address", exact: true }).hover();
  await expect.poll(() => effectiveOpacity(payment)).toBeCloseTo(1, 4);
  await expect.poll(() => effectiveOpacity(address)).toBeCloseTo(0.4, 4);
  await page.mouse.move(0, 0);
  await expect.poll(() => effectiveOpacity(payment)).toBeCloseTo(1, 4);
  await expect.poll(() => effectiveOpacity(address)).toBeCloseTo(0.4, 4);
  await legend.getByRole("button", { name: "Reached payment", exact: true }).click();
  await expect(stage(chart, "payment")).toHaveAttribute("aria-pressed", "false");
  await legend.getByRole("button", { name: "Display address", exact: true }).hover();
  await expect.poll(() => effectiveOpacity(payment)).toBeCloseTo(0.28, 4);
  await expect.poll(() => effectiveOpacity(address)).toBeCloseTo(1, 4);
});

test("stage descriptions retain consumer IDs and join the active tooltip description", async ({
  page,
}) => {
  await page.goto(packed);
  const chart = page.getByRole("region", { name: "Stage snapshot" });
  const first = stage(chart, "entry");
  expect(((await first.getAttribute("aria-describedby")) ?? "").trim().split(/\s+/)).toEqual([
    "p-2",
    "p-4",
  ]);
  await first.focus();
  const tooltip = chart.getByRole("tooltip");
  await expect(tooltip).toContainText("Entry");
  const tooltipId = await tooltip.getAttribute("id");
  expect(tooltipId).toBeTruthy();
  expect(((await first.getAttribute("aria-describedby")) ?? "").trim().split(/\s+/)).toEqual([
    "p-2",
    "p-4",
    tooltipId,
  ]);
});
