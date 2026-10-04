import { expect, type Locator, test } from "./browser";

test.use({ hasTouch: true });

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const route = `http://127.0.0.1:${4195 + offset}/`;
const final = '[data-kind-ui="tooltip-number-final"]';
const visual = '[data-kind-ui="tooltip-number-visual"]';
const reels = '[data-kind-ui="tooltip-digit-reel"]';
const valueRow = (root: Locator, key: string) => root.locator(`[data-series="${key}"]`);

test("rolling digits reserve the full text line height", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  await page.getByLabel("Shuffle values").check();
  const digit = valueRow(page.locator('[data-direct="true"]'), "count")
    .locator('[data-kind-ui="tooltip-digit"]')
    .first();
  const dimensions = await digit.evaluate((node) => {
    const row = node.querySelector('[data-kind-ui="tooltip-digit-reel"] > span');
    if (!row) throw new Error("Missing digit reel row");
    return {
      slot: node.getBoundingClientRect().height,
      row: row.getBoundingClientRect().height,
      line: Number.parseFloat(getComputedStyle(node).lineHeight),
    };
  });
  expect(Math.abs(dimensions.slot - dimensions.line)).toBeLessThan(1);
  expect(Math.abs(dimensions.row - dimensions.line)).toBeLessThan(1);
});

test("supported ASCII digits retain their formatted order in an RTL container", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${route}?rtl`);
  await page.getByLabel("Shuffle values").check();
  const row = valueRow(page.locator('[data-direct="true"]'), "count");
  await expect(row.locator(final)).toHaveText("13 commits");
  const positions = await row
    .locator('[data-kind-ui="tooltip-digit"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().x));
  expect(positions[0]).toBeLessThan(positions[1] ?? 0);
});

test("default rendering stays static and opt-in preserves formatter, missing and custom-node ownership", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  const direct = page.locator('[data-direct="true"]');
  await expect(direct.locator(reels)).toHaveCount(0);
  await expect(valueRow(direct, "count")).toHaveText("Commits13 commits");
  await page.getByRole("button", { name: "Value 0", exact: true }).click();
  await expect(valueRow(direct, "count")).toHaveText("Commits0 commits");
  await page.getByLabel("Shuffle values").check();
  await expect(valueRow(direct, "count").locator(final)).toHaveText("0 commits");
  await expect(valueRow(direct, "money").locator(final)).toHaveText("$-12.50");
  await expect(valueRow(direct, "rate").locator(final)).toHaveText("12.5%");
  for (const key of ["missing", "nan", "infinity", "range", "string"])
    await expect(valueRow(direct, key).locator(reels)).toHaveCount(0);
  await expect(valueRow(direct, "suppressed")).toHaveCount(0);
  await expect(valueRow(direct, "missing")).toHaveText("MissingNo data");
  await page.getByRole("button", { name: "Rich formatter" }).click();
  await expect(valueRow(direct, "rich").locator("em")).toHaveText("Seven");
  await expect(valueRow(direct, "rich").locator(reels)).toHaveCount(0);
  await page.getByRole("button", { name: "Arabic formatter" }).click();
  await expect(valueRow(direct, "locale")).toHaveText("Locale١٢٫٥٪");
  await expect(valueRow(direct, "locale").locator(reels)).toHaveCount(0);
  const aria = await direct.ariaSnapshot();
  expect(aria).toContain("$-12.50");
  expect(aria).toContain("12.5%");
  expect(aria).not.toContain("0123456789");
  await page.getByLabel("Shuffle values").uncheck();
  await expect(direct.locator(reels)).toHaveCount(0);
  await expect(direct).not.toHaveAttribute("valueAnimation");
});

test("rapid updates retarget rolling digits, retain exact accessible final values and stable widths", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  await page.getByLabel("Shuffle values").check();
  const direct = page.locator('[data-direct="true"]');
  const row = valueRow(direct, "count");
  await expect(row.locator(final)).toHaveText("13 commits");
  await expect.poll(() => row.locator(reels).first().getAttribute("style")).toContain("-11lh");
  const widthBefore = await row
    .locator('[data-kind-ui="tooltip-number"]')
    .evaluate((node) => node.getBoundingClientRect().width);
  await page.getByRole("button", { name: "Value 4", exact: true }).click();
  await expect(row.locator(final)).toHaveText("4 commits");
  await expect(row.locator(visual)).toHaveAttribute("aria-hidden", "true");
  const frames = await row.locator(reels).evaluate(async (node) => {
    const samples: string[] = [];
    for (let i = 0; i < 5; i++) {
      samples.push((node as HTMLElement).style.transform);
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return samples;
  });
  expect(new Set(frames).size).toBeGreaterThan(1);
  const widthAfter = await row
    .locator('[data-kind-ui="tooltip-number"]')
    .evaluate((node) => node.getBoundingClientRect().width);
  expect(Math.abs(widthAfter - widthBefore)).toBeLessThan(1);
  await page.evaluate(async () => {
    for (const target of [8, 0, 13, -12.5, 4]) {
      const button = [...document.querySelectorAll("button")].find(
        (node) => node.textContent === `Value ${target}`,
      );
      button?.click();
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  });
  await expect(row.locator(final)).toHaveText("4 commits");
  await expect.poll(() => row.locator(reels).getAttribute("style")).toContain("-14lh");
  await page.getByRole("button", { name: "Value -12.5", exact: true }).click();
  await expect(row.locator(final)).toHaveText("-12.5 commits");
  await page.getByRole("button", { name: "Value 123456.75", exact: true }).click();
  await expect(row.locator(final)).toHaveText("123456.75 commits");
  const number = row.locator('[data-kind-ui="tooltip-number"]');
  await expect
    .poll(() =>
      number.evaluate((node) =>
        Math.abs(
          node.getBoundingClientRect().width -
            (node.querySelector('[data-kind-ui="tooltip-number-final"]')?.getBoundingClientRect()
              .width ?? 0),
        ),
      ),
    )
    .toBeLessThan(1);
  const wide = await number.evaluate((node) => node.getBoundingClientRect().width);
  expect(wide).toBeGreaterThan(widthBefore + 20);
  await page.getByRole("button", { name: "Value 4", exact: true }).click();
  await expect(row.locator(final)).toHaveText("4 commits");
  expect(
    await number.evaluate((node) => node.getBoundingClientRect().width),
  ).toBeGreaterThanOrEqual(wide - 1);
  await page.getByRole("button", { name: "Active", exact: true }).click();
  await expect(direct).toHaveCount(0);
  await page.getByRole("button", { name: "Value 8", exact: true }).click();
  await page.getByRole("button", { name: "Active", exact: true }).click();
  await expect(valueRow(page.locator('[data-direct="true"]'), "count").locator(final)).toHaveText(
    "8 commits",
  );
  await page.screenshot({
    path: info.outputPath("optional-shuffle-formatting.png"),
    fullPage: true,
  });
});

test("reduced motion initially and during a run snaps to plain accurate values", async ({
  page,
}) => {
  await page.goto(route);
  await page.getByLabel("Shuffle values").check();
  const direct = page.locator('[data-direct="true"]');
  await expect(direct.locator(reels)).toHaveCount(0);
  await page.getByRole("button", { name: "Value 4", exact: true }).click();
  await expect(valueRow(direct, "count")).toHaveText("Commits4 commits");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(direct.locator(reels).first()).toBeVisible();
  await page.getByRole("button", { name: "Value 8", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(direct.locator(reels)).toHaveCount(0);
  await expect(valueRow(direct, "count")).toHaveText("Commits8 commits");
});

test("shared and Scatter tooltip forwarding respects keyboard selection and custom content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  await page.getByLabel("Shuffle values").check();
  const line = page.getByRole("application", { name: "Shuffle line" });
  await line.focus();
  const lineTip = page
    .getByRole("region", { name: "Line preview" })
    .locator('[data-kind-ui="chart-tooltip"]');
  await expect(lineTip.locator(final)).toHaveText("13 commits");
  await page.keyboard.press("ArrowRight");
  await expect(lineTip.locator(final)).toHaveText("8 commits");
  await page.keyboard.press("Escape");
  await expect(lineTip).not.toBeVisible();
  await page.getByLabel("Custom content").check();
  await line.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-custom="owned"]')).toBeVisible();
  await expect(page.locator('[data-custom="owned"]').locator(reels)).toHaveCount(0);
  await page
    .getByRole("button", { name: "Custom 0" })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await line.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Custom 1" })).toBeVisible();
  const scatter = page.getByRole("application", { name: "Shuffle scatter" });
  await scatter.focus();
  const scatterTip = page
    .getByRole("region", { name: "Scatter preview" })
    .locator('[data-kind-ui="chart-tooltip"]');
  await expect(scatterTip.locator(final)).toHaveText(["0", "13"]);
  await page.keyboard.press("ArrowRight");
  await expect(scatterTip.locator(final)).toHaveText(["1", "8"]);
  await expect
    .poll(() => scatterTip.locator(reels).first().getAttribute("style"))
    .toContain("-11lh");
  const settled = await scatterTip.locator(reels).first().getAttribute("style");
  const node = await scatterTip.locator(reels).first().elementHandle();
  await page
    .getByRole("button", { name: "Value 0", exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  expect(await node?.evaluate((element) => element.isConnected)).toBe(true);
  await expect(scatterTip.locator(final)).toHaveText(["1", "8"]);
  const unchanged = await scatterTip
    .locator(reels)
    .first()
    .evaluate(async (element) => {
      const samples: string[] = [];
      for (let i = 0; i < 5; i++) {
        samples.push(element.getAttribute("style") ?? "");
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return samples;
    });
  expect(unchanged.every((sample) => sample === settled)).toBe(true);
});

test("Heatmap default-off, hover/leave/re-enter, keyboard, touch and custom Content preserve native semantics", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  const calendar = page.getByRole("region", { name: "Calendar preview" });
  const cell = calendar.getByRole("gridcell", { name: "Tue, Jul 9: 13 commits", exact: true });
  const tip = calendar.getByRole("tooltip");
  await cell.hover();
  await expect(tip).toHaveText("Tue, Jul 9: 13 commits");
  await expect(tip.locator(reels)).toHaveCount(0);
  await page.getByLabel("Shuffle values").check();
  await cell.hover();
  await expect(tip.locator(final)).toHaveText("13 commits");
  await calendar.getByRole("gridcell", { name: "Tue, Jul 14: 4 commits", exact: true }).hover();
  await expect(tip.locator(final)).toHaveText("4 commits");
  await expect(tip.locator(visual)).toHaveAttribute("aria-hidden", "true");
  await page.screenshot({ path: info.outputPath("heat-calendar-shuffle.png") });
  await page.mouse.move(0, 0);
  await expect(tip).not.toBeVisible();
  await cell.hover();
  await expect(tip.locator(final)).toHaveText("13 commits");
  await cell.focus();
  await page.keyboard.press("ArrowRight");
  await expect(tip.locator(final)).toHaveText("8 commits");
  await page.keyboard.press("Escape");
  await expect(tip).not.toBeVisible();
  await cell.tap();
  await expect(tip.locator(final)).toHaveText("13 commits");
  await page.getByLabel("Custom content").check();
  await cell.hover();
  await expect(tip.locator('[data-custom="heatmap"]')).toHaveText("13 commits");
  await expect(tip.locator(reels)).toHaveCount(0);
});

test("wider values stay fully visible on every retarget frame", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  await page.getByLabel("Shuffle values").check();
  const samples = await page.evaluate(async () => {
    const root = document.querySelector('[data-direct="true"] [data-series="count"]');
    if (!root) throw new Error("Missing numeric tooltip row");
    const samples: { value: string; width: number; required: number; outside: number }[] = [];
    for (const value of [123456.75, 4, -12.5, 123456.75, 0]) {
      const button = [...document.querySelectorAll("button")].find(
        (node) => node.textContent === `Value ${value}`,
      );
      if (!button) throw new Error("Missing value control");
      button.click();
      for (let frame = 0; frame < 12; frame++) {
        await new Promise(requestAnimationFrame);
        const number = root.querySelector('[data-kind-ui="tooltip-number"]');
        const final = root.querySelector('[data-kind-ui="tooltip-number-final"]');
        const visual = root.querySelector('[data-kind-ui="tooltip-number-visual"]');
        if (!number || !final || !visual) throw new Error("Missing rolling number");
        const bounds = number.getBoundingClientRect();
        samples.push({
          value: final.textContent ?? "",
          width: bounds.width,
          required: final.getBoundingClientRect().width,
          outside: [...visual.children].filter((node) => {
            const part = node.getBoundingClientRect();
            return part.left < bounds.left - 0.5 || part.right > bounds.right + 0.5;
          }).length,
        });
      }
    }
    return samples;
  });
  expect(samples).toHaveLength(60);
  for (const sample of samples) {
    expect(sample.width, sample.value).toBeGreaterThanOrEqual(sample.required - 0.5);
    expect(sample.outside, sample.value).toBe(0);
  }
});

test("font and zoom changes reserve complete values in a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  await page.getByLabel("Shuffle values").check();
  const widths = await page.evaluate(async () => {
    const root = document.querySelector<HTMLElement>('[data-direct="true"]');
    if (!root) throw new Error("Missing direct tooltip");
    const widths: { actual: number; required: number }[] = [];
    for (const font of ["20px/30px Georgia", "30px/45px system-ui", "16px/24px Arial"]) {
      root.style.font = font;
      root.style.zoom = "1.25";
      for (let frame = 0; frame < 4; frame++) {
        await new Promise(requestAnimationFrame);
        for (const number of root.querySelectorAll('[data-kind-ui="tooltip-number"]')) {
          const final = number.querySelector('[data-kind-ui="tooltip-number-final"]');
          if (!final) throw new Error("Missing accessible numeric text");
          widths.push({
            actual: number.getBoundingClientRect().width,
            required: final.getBoundingClientRect().width,
          });
        }
      }
    }
    return widths;
  });
  expect(widths.length).toBeGreaterThan(0);
  for (const width of widths) expect(width.actual).toBeGreaterThanOrEqual(width.required - 0.5);
});

test("settled digits retain full glyph bounds with inherited line height", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(route);
  await page.getByLabel("Shuffle values").check();
  await page.getByRole("button", { name: "Value 123456.75", exact: true }).click();
  await page.addStyleTag({
    content: '[data-direct="true"] { font: 24px/36px system-ui; zoom: 1.25; }',
  });
  await expect
    .poll(() =>
      page
        .locator('[data-direct="true"] [data-kind-ui="tooltip-digit"]')
        .evaluateAll((nodes) =>
          nodes.every((node) =>
            [...node.querySelectorAll('[data-kind-ui="tooltip-digit-reel"] > span')].some(
              (row) =>
                Math.abs(row.getBoundingClientRect().top - node.getBoundingClientRect().top) < 0.5,
            ),
          ),
        ),
    )
    .toBe(true);
  const glyphs = await page
    .locator('[data-direct="true"] [data-kind-ui="tooltip-digit"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const slot = node.getBoundingClientRect();
        const row = [...node.querySelectorAll('[data-kind-ui="tooltip-digit-reel"] > span')].find(
          (row) => Math.abs(row.getBoundingClientRect().top - slot.top) < 0.5,
        );
        if (!row) throw new Error("Digit has not settled on its visible row");
        const range = document.createRange();
        range.selectNodeContents(row);
        const text = range.getBoundingClientRect();
        return {
          top: text.top - slot.top,
          bottom: slot.bottom - text.bottom,
          left: text.left - slot.left,
          right: slot.right - text.right,
        };
      }),
    );
  expect(glyphs.length).toBeGreaterThan(0);
  for (const glyph of glyphs) {
    for (const edge of Object.values(glyph)) expect(edge).toBeGreaterThanOrEqual(-0.5);
  }
});
