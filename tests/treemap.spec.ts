import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const port = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) + 37;
test.use({ baseURL: `http://127.0.0.1:${port}` });
const tile = (page: Page, id: string) =>
  page.locator(`[data-kind-ui="treemap-tile"][data-node-id="${id}"]`);
const output = (page: Page, label: string) => page.getByRole("status", { name: label });
const update = (page: Page, name: string) =>
  page
    .getByRole("button", { name, exact: true })
    .evaluate((element: HTMLButtonElement) => element.click());
const geometry = (page: Page) =>
  page.locator('[data-kind-ui="treemap-tile"]').evaluateAll((elements) =>
    elements
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          id: element.getAttribute("data-node-id"),
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        };
      })
      .sort((a, b) => (a.id ?? "").localeCompare(b.id ?? "")),
  );

test("treemap keeps real element identity and focus through independent updates", async ({
  page,
}) => {
  await page.goto("/");
  const alpha = tile(page, "a");
  await expect(alpha).toBeVisible();
  await alpha.focus();
  const original = await alpha.elementHandle();
  if (!original) throw new Error("Missing Alpha tile");
  await expect(output(page, "Active ID")).toHaveText("a");
  for (const name of ["Weights", "Reorder", "Resize", "Colors"]) {
    const before = await geometry(page);
    await update(page, name);
    await expect(alpha).toBeFocused();
    expect(await alpha.evaluate((element, retained) => element === retained, original)).toBe(true);
    if (name === "Resize") {
      const previousAlpha = before.find((rectangle) => rectangle.id === "a");
      if (!previousAlpha) throw new Error("Missing alpha rectangle before resize");
      await expect
        .poll(async () => (await geometry(page)).find((rectangle) => rectangle.id === "a")?.width)
        .toBeLessThan(previousAlpha.width);
    }
    if (name === "Colors") expect(await geometry(page)).toEqual(before);
  }
  await original.dispose();
});

test("treemap initial responsive measurement matches a fresh positive-width layout", async ({
  page,
}) => {
  // The unstyled fixture's two 8px body margins leave exactly 720px of chart width.
  await page.setViewportSize({ width: 736, height: 900 });
  await page.goto("/?responsive&fixed-width=720");
  await expect(tile(page, "a")).toBeVisible();
  await expect(page.locator('[data-kind-ui="treemap"]')).toHaveCSS("width", "720px");
  const explicit = await geometry(page);
  await page.goto("/?responsive");
  await expect(tile(page, "a")).toBeVisible();
  await expect(page.locator('[data-kind-ui="treemap"]')).toHaveCSS("width", "720px");
  const responsive = await geometry(page);
  expect(responsive).toEqual(explicit);
  // A zero-width resquarify seed otherwise retains long, thin vertical strips.
  const alpha = responsive.find((item) => item.id === "a");
  if (!alpha) throw new Error("Missing dominant responsive tile");
  expect(Math.max(alpha.width / alpha.height, alpha.height / alpha.width)).toBeLessThan(3);
});

test("treemap keyboard traversal, inspection dismissal, selection and table agree", async ({
  page,
}) => {
  await page.goto("/");
  await tile(page, "a").focus();
  await expect(page.getByRole("tooltip")).toContainText("Alpha");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).not.toBeVisible();
  await page.keyboard.press("ArrowRight");
  const afterArrow = await page.locator(":focus").getAttribute("data-node-id");
  expect(afterArrow).not.toBe("a");
  await page.keyboard.press("Home");
  const first = await page.locator(":focus").getAttribute("data-node-id");
  await page.keyboard.press("End");
  const last = await page.locator(":focus").getAttribute("data-node-id");
  expect(first).not.toBe(last);
  await tile(page, "b").focus();
  await page.keyboard.press("Enter");
  await expect(output(page, "Selected ID")).toHaveText("b");
  await expect(tile(page, "b")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("row").filter({ hasText: "Beta" })).toContainText("0%");
  await tile(page, "a").focus();
  await page.keyboard.press("Space");
  await expect(output(page, "Selected ID")).toHaveText("a");
  await expect(tile(page, "b")).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("row").filter({ hasText: "Beta" }).getByRole("button").click();
  await expect(output(page, "Selected ID")).toHaveText("b");
});

test("treemap zero-area records remain in its table and missing color differs from zero", async ({
  page,
}) => {
  await page.goto("/");
  await expect(tile(page, "zero")).toHaveCount(0);
  await expect(page.getByRole("row").filter({ hasText: "Zero allocation" })).toContainText(
    "Unknown",
  );
  await expect(page.getByRole("row").filter({ hasText: "Beta" })).toContainText("0%");
  const colors = await Promise.all(
    ["b", "d"].map((id) =>
      tile(page, id).evaluate((element) => {
        const rect = element instanceof SVGRectElement ? element : element.querySelector("rect");
        return rect ? getComputedStyle(rect).fill : getComputedStyle(element).backgroundColor;
      }),
    ),
  );
  expect(colors[0]).not.toBe(colors[1]);
  await tile(page, "e").focus();
  await expect(page.getByRole("tooltip")).toContainText("-20%");
});

test("treemap controlled drilldown and real breadcrumbs recover removed subtrees", async ({
  page,
}) => {
  await page.goto("/");
  await update(page, "View platforms");
  await expect(output(page, "View ID")).toHaveText("platforms");
  await expect(tile(page, "a")).toBeVisible();
  await expect(tile(page, "d")).toHaveCount(0);
  const breadcrumbs = page.getByRole("navigation");
  await breadcrumbs.getByRole("button", { name: "Technology", exact: true }).click();
  await expect(output(page, "View ID")).toHaveText("technology");
  await expect(tile(page, "c")).toBeVisible();
  await update(page, "View platforms");
  await tile(page, "a").focus();
  await update(page, "Remove subtree");
  await expect(output(page, "View ID")).toHaveText("root");
  await expect(tile(page, "d")).toBeVisible();
  await expect(page.locator('[data-node-id="a"]')).toHaveCount(0);
  await expect(page.locator(":focus")).toHaveAttribute("data-node-id", /energy|d|e/);
});

test("treemap rectangles stay bounded, disjoint, and proportional inside grouped padding", async ({
  page,
}) => {
  await page.goto("/");
  const bounds = await page.locator('[data-kind-ui="treemap"]').boundingBox();
  if (!bounds) throw new Error("Missing Treemap bounds");
  const boxes = await geometry(page);
  expect(boxes).toHaveLength(5);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(bounds.x - 0.5);
    expect(box.y).toBeGreaterThanOrEqual(bounds.y - 0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 0.5);
    expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height + 0.5);
  }
  for (const [index, left] of boxes.entries())
    for (const right of boxes.slice(index + 1)) {
      const overlapX =
        Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
      const overlapY =
        Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
      expect(overlapX <= 0.5 || overlapY <= 0.5).toBe(true);
    }
  for (const [largeId, smallId] of [
    ["a", "b"],
    ["d", "e"],
  ]) {
    const large = boxes.find((box) => box.id === largeId);
    const small = boxes.find((box) => box.id === smallId);
    if (!large || !small) throw new Error("Missing ratio pair");
    const ratio = (large.width * large.height) / (small.width * small.height);
    expect(ratio).toBeGreaterThan(1.85);
    expect(ratio).toBeLessThan(2.2);
  }
  const groups = await page.locator('[data-kind-ui="treemap-group"]').evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        id: element.getAttribute("data-node-id"),
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    }),
  );
  const platforms = groups.find((item) => item.id === "platforms");
  if (!platforms) throw new Error("Missing nested group");
  for (const id of ["a", "b"]) {
    const item = boxes.find((box) => box.id === id);
    if (!item) throw new Error("Missing nested leaf");
    expect(item.x).toBeGreaterThanOrEqual(platforms.x);
    expect(item.y).toBeGreaterThan(platforms.y);
    expect(item.x + item.width).toBeLessThanOrEqual(platforms.x + platforms.width + 0.5);
    expect(item.y + item.height).toBeLessThanOrEqual(platforms.y + platforms.height + 0.5);
  }
  await expect(page.locator('[data-kind-ui="treemap-label"]')).not.toHaveCount(0);
  expect(
    await page
      .locator('[data-kind-ui="treemap-label"]')
      .evaluateAll((labels) =>
        labels.every((label) => getComputedStyle(label).overflow === "hidden"),
      ),
  ).toBe(true);
});

for (const count of [500, 2000])
  test(`treemap measures ${count} leaves without truncation and retains keyboard access`, async ({
    page,
  }, info) => {
    const started = Date.now();
    await page.goto(`/?count=${count}&padding=0`);
    await expect(page.locator('[data-kind-ui="treemap-tile"]')).toHaveCount(count);
    await expect(page.locator("tbody tr")).toHaveCount(count + 1);
    const initialRenderMs = Date.now() - started;
    info.annotations.push({ type: "render-duration-ms", description: String(initialRenderMs) });
    await info.attach("treemap-density", {
      body: JSON.stringify({ count, padding: 0, initialRenderMs }),
      contentType: "application/json",
    });
    await tile(page, "resource-0").focus();
    await page.keyboard.press("End");
    await expect(page.locator(":focus")).toHaveAttribute("data-node-id", /^resource-/);
    expect(await page.locator('[data-kind-ui="treemap-tile"][tabindex="0"]').count()).toBe(1);
  });

test("treemap loading, empty data, reduced motion and automated accessibility", async ({
  page,
}) => {
  await page.goto("/");
  const audit = () =>
    new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect((await audit()).violations).toEqual([]);
  await tile(page, "a").focus();
  expect((await audit()).violations).toEqual([]);
  await update(page, "Loading");
  await expect(page.locator('[data-kind-ui="treemap"]')).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("tooltip")).not.toBeVisible();
  await expect(page.locator('[data-kind-ui="treemap-content"]')).toHaveAttribute("inert", "");
  expect((await audit()).violations).toEqual([]);
  await update(page, "Loading");
  await update(page, "Empty");
  await expect(page.getByText("No positive values", { exact: true })).toBeVisible();
  await expect(page.locator('[data-kind-ui="treemap-tile"]')).toHaveCount(0);
  expect((await audit()).violations).toEqual([]);
});

test("treemap touch activation and keyboard activation share selection state", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    reducedMotion: "reduce",
    viewport: { width: 900, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/`);
  await tile(page, "a").tap();
  await expect(output(page, "Selected ID")).toHaveText("a");
  await tile(page, "b").focus();
  await page.keyboard.press("Enter");
  await expect(output(page, "Selected ID")).toHaveText("b");
  await context.close();
});

test("treemap retains its resolved ancestor when a controlled consumer rejects corrections", async ({
  page,
}) => {
  await page.goto("/?held");
  await expect(output(page, "Resolved view")).toHaveText("platforms");
  await expect(output(page, "View requests")).toHaveText("0");
  await update(page, "Remove platforms");
  await expect(output(page, "View ID")).toHaveText("platforms");
  await expect(output(page, "Resolved view")).toHaveText("technology");
  await expect(output(page, "View requests")).toHaveText("1");
  await expect(tile(page, "c")).toBeVisible();
  for (const name of ["Colors", "Resize", "Reorder"]) {
    await update(page, name);
    await expect(output(page, "Resolved view")).toHaveText("technology");
    await expect(output(page, "View requests")).toHaveText("1");
    await expect(tile(page, "c")).toBeVisible();
  }
});

test("treemap root-scoped table leaves sibling view shares undefined during drilldown", async ({
  page,
}) => {
  await page.goto("/?table-root");
  await update(page, "View technology");
  await expect(output(page, "Resolved view")).toHaveText("technology");
  const energy = page.locator('tbody tr[data-node-id="energy"]');
  const delta = page.locator('tbody tr[data-node-id="d"]');
  await expect(energy).toBeVisible();
  await expect(energy.getByRole("cell").nth(4)).toHaveText("—");
  await expect(delta.getByRole("cell").nth(4)).toHaveText("—");
  await expect(page.locator('tbody tr[data-node-id="a"]').getByRole("cell").nth(4)).toHaveText(
    "60.00%",
  );
});

for (const parts of ["tiles", "groups"])
  test(`treemap ${parts}-only composition navigates only its rendered marks`, async ({ page }) => {
    await page.goto(`/?parts=${parts}`);
    const marks = page.locator(
      '[data-kind-ui="treemap-tile"], [data-kind-ui="treemap-group-header"]',
    );
    const omitted = parts === "tiles" ? "treemap-group-header" : "treemap-tile";
    await expect(page.locator(`[data-kind-ui="${omitted}"]`)).toHaveCount(0);
    await expect(marks.first()).toBeVisible();
    const stops = page.locator(
      '[data-kind-ui="treemap-tile"][tabindex="0"], [data-kind-ui="treemap-group-header"][tabindex="0"]',
    );
    await expect(stops).toHaveCount(1);
    await stops.focus();
    await page.keyboard.press("Home");
    const first = await page.locator(":focus").getAttribute("data-node-id");
    expect(
      await marks.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("data-node-id")),
      ),
    ).toContain(first);
    await page.keyboard.press("End");
    const last = await page.locator(":focus").getAttribute("data-node-id");
    expect(last).not.toBe(first);
    expect(
      await marks.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("data-node-id")),
      ),
    ).toContain(last);
    await expect(stops).toHaveCount(1);
  });

test("treemap labels fit their tiles and remain accessible across consumer theme changes", async ({
  page,
}) => {
  await page.goto("/");
  const before = await geometry(page);
  for (const dark of [false, true]) {
    if (dark) await update(page, "Theme");
    expect(await geometry(page)).toEqual(before);
    const labels = await page.locator('[data-kind-ui="treemap-label"]').evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return {
          id: element.getAttribute("data-node-id"),
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          overflow: getComputedStyle(element).overflow,
        };
      }),
    );
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      const mark = before.find((item) => item.id === label.id);
      if (!mark) throw new Error("Missing label tile");
      expect(label.overflow).toBe("hidden");
      expect(label.x).toBeGreaterThanOrEqual(mark.x);
      expect(label.y).toBeGreaterThanOrEqual(mark.y);
      expect(label.x + label.width).toBeLessThanOrEqual(mark.x + mark.width + 0.5);
      expect(label.y + label.height).toBeLessThanOrEqual(mark.y + mark.height + 0.5);
    }
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  }
});

test("treemap excludes disabled initial marks and tolerates fresh consumer callback refs", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const stops = page.locator(
    '[data-kind-ui="treemap-tile"][tabindex="0"]:enabled, [data-kind-ui="treemap-group-header"][tabindex="0"]:enabled',
  );
  await expect(stops).toHaveCount(1);
  await expect(tile(page, "d")).toHaveAttribute("tabindex", "0");
  await update(page, "Disabled");
  await expect(tile(page, "d")).toBeDisabled();
  await expect(tile(page, "d")).toHaveAttribute("tabindex", "-1");
  await expect(stops).toHaveCount(1);
  await update(page, "Disabled");
  await expect(tile(page, "d")).toBeEnabled();
  await expect(stops).toHaveCount(1);
  await update(page, "Disabled");
  await stops.focus();
  for (const key of ["Home", "End", "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"]) {
    await page.keyboard.press(key);
    await expect(page.locator(":focus")).not.toHaveAttribute("data-node-id", "d");
    await expect(page.locator(":focus")).toBeEnabled();
  }
  for (const name of ["Colors", "Resize", "Colors", "Resize"]) {
    await update(page, name);
    await expect(stops).toHaveCount(1);
    await expect(tile(page, "a")).toHaveAttribute("data-host-ref", "tile");
  }
  expect(errors).toEqual([]);
});

test("treemap removes focused group refs with cleanup and restores focus to rendered tiles", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const header = page.locator('[data-kind-ui="treemap-group-header"][data-node-id="energy"]');
  await header.focus();
  await expect(header).toBeFocused();
  const retained = await header.elementHandle();
  if (!retained) throw new Error("Missing retained group header");
  await update(page, "Toggle groups");
  await expect(header).toHaveCount(0);
  await expect(page.locator(":focus")).toHaveAttribute("data-kind-ui", "treemap-tile");
  expect(await retained.getAttribute("data-host-cleaned")).toBe("true");
  for (const key of ["Home", "ArrowRight", "End"]) {
    await page.keyboard.press(key);
    await expect(page.locator(":focus")).toHaveAttribute("data-kind-ui", "treemap-tile");
    await expect(page.locator(":focus")).toBeEnabled();
  }
  await expect(page.locator('[data-kind-ui="treemap-tile"][tabindex="0"]')).toHaveCount(1);
  expect(errors).toEqual([]);
  await retained.dispose();
});

test("treemap preserves committed callback records and geometry after an abandoned transition", async ({
  page,
}) => {
  await page.goto("/");
  const alpha = tile(page, "a");
  await expect(alpha).toBeVisible();
  await alpha.focus();
  const retained = await alpha.elementHandle();
  if (!retained) throw new Error("Missing committed Alpha tile");
  const committed = await geometry(page);
  await update(page, "Suspended weights");
  await expect(page.locator("body")).toHaveAttribute("data-suspended-render", "true");
  await expect(alpha).toBeFocused();
  expect(await alpha.evaluate((element, original) => element === original, retained)).toBe(true);
  // Invoke the still-committed handler without pointer/focus changes triggering another commit.
  await retained.evaluate((element) => {
    if (!(element instanceof HTMLButtonElement)) throw new Error("Expected committed button");
    element.click();
  });
  await expect(output(page, "Activated area")).toHaveText("60");
  await update(page, "Rollback transition");
  await update(page, "Colors");
  await expect(alpha).toBeFocused();
  expect(await alpha.evaluate((element, original) => element === original, retained)).toBe(true);
  expect(await geometry(page)).toEqual(committed);
  await expect(page.locator('tbody tr[data-node-id="a"]').getByRole("cell").nth(1)).toHaveText(
    "60",
  );
  await expect(alpha).toHaveAttribute("aria-label", /^Alpha: 60,/);
  await retained.dispose();
});

test("treemap crowded padding retains every record in its semantic alternative", async ({
  page,
}) => {
  await page.goto("/?count=2000&padding=6");
  await expect(page.locator("tbody tr")).toHaveCount(2001);
  const glyphs = await page.locator('[data-kind-ui="treemap-tile"]').count();
  expect(glyphs).toBeGreaterThan(0);
  expect(glyphs).toBeLessThan(2000);
  await expect(page.locator('tbody tr[data-node-id="resource-0"]')).toBeVisible();
});

test("treemap viewed root keeps its own semantic share without a rectangle", async ({ page }) => {
  await page.goto("/?table-root");
  await update(page, "View technology");
  await expect(page.locator('tbody tr[data-node-id="technology"] td').nth(4)).toHaveText("100.00%");
});
test("treemap zero-height headers preserve boundaries without invisible keyboard targets", async ({
  page,
}) => {
  await page.goto("/?header=0");
  await expect(page.locator('[data-kind-ui="treemap-group"]')).not.toHaveCount(0);
  await expect(page.locator('[data-kind-ui="treemap-group-header"]')).toHaveCount(0);
  const stop = page.locator('[data-kind-ui="treemap-tile"][tabindex="0"]');
  await expect(stop).toHaveCount(1);
  await stop.focus();
  await page.keyboard.press("Home");
  await expect(page.locator(":focus")).toHaveAttribute("data-kind-ui", "treemap-tile");
});
for (const domain of ["positive", "constant"]) {
  test(`treemap ${domain} legend positions match its shared scale`, async ({ page }) => {
    await page.goto(`/?domain=${domain}`);
    const fieldset = page.locator('[data-kind-ui="treemap-color-legend"] fieldset');
    const bar = await fieldset.locator(":scope > div").first().boundingBox();
    if (!bar) throw new Error("Missing numeric legend bar");
    const ticks = await fieldset
      .locator('[data-kind-ui="treemap-legend-tick"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return { x: r.x, width: r.width };
        }),
      );
    if (domain === "constant") {
      expect(ticks).toHaveLength(1);
      const tick = ticks[0];
      if (!tick) throw new Error("Missing constant tick");
      expect(Math.abs(tick.x + tick.width / 2 - bar.x - bar.width / 2)).toBeLessThan(1);
    } else {
      expect(ticks).toHaveLength(2);
      expect(Math.abs((ticks[0]?.x ?? 0) - bar.x)).toBeLessThan(1);
      const end = ticks[1];
      if (!end) throw new Error("Missing end tick");
      expect(Math.abs(end.x + end.width - bar.x - bar.width)).toBeLessThan(1);
    }
  });
}

test("treemap hover inspection dismisses with outside focus and stays dismissed under a stationary pointer", async ({
  page,
}) => {
  await page.goto("/");
  const alpha = tile(page, "a");
  await alpha.hover();
  await expect(page.getByRole("tooltip")).toContainText("Alpha");
  const root = page.locator('[data-kind-ui="treemap"]');
  const coordinates = await root.evaluate((element) => ({
    clientX: Number(element.getAttribute("data-pointer-x")),
    clientY: Number(element.getAttribute("data-pointer-y")),
  }));
  expect(coordinates.clientX).toBeGreaterThan(0);
  expect(coordinates.clientY).toBeGreaterThan(0);
  const outside = page.getByRole("textbox", { name: "Outside focus" });
  await outside.focus();
  await expect(outside).toBeFocused();
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await alpha.dispatchEvent("pointerover", { ...coordinates, pointerType: "mouse", pointerId: 1 });
  await alpha.dispatchEvent("pointermove", { ...coordinates, pointerType: "mouse", pointerId: 1 });
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  const bounds = await alpha.boundingBox();
  if (!bounds) throw new Error("Missing Alpha bounds after dismissal");
  await page.mouse.move(bounds.x + bounds.width / 2 + 1, bounds.y + bounds.height / 2);
  await expect(page.getByRole("tooltip")).toContainText("Alpha");
});

test("treemap document Escape respects an outside consumer's prevented event", async ({ page }) => {
  await page.goto("/?prevent-escape");
  await tile(page, "a").hover();
  const outside = page.getByRole("textbox", { name: "Outside focus" });
  await outside.focus();
  await expect(page.getByRole("tooltip")).toContainText("Alpha");
  await outside.press("Escape");
  await expect(output(page, "Prevented escapes")).toHaveText("1");
  await expect(page.getByRole("tooltip")).toContainText("Alpha");
});

test("treemap table group keyboard activation transfers focus into its surviving subtree", async ({
  page,
}) => {
  await page.goto("/");
  const row = page.locator('tbody tr[data-node-id="technology"]');
  const action = row.getByRole("button");
  await action.focus();
  await expect(action).toBeFocused();
  await action.press("Enter");
  await expect(output(page, "Resolved view")).toHaveText("technology");
  await expect(row).toHaveCount(0);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const focused = document.activeElement;
          if (!(focused instanceof HTMLButtonElement) || focused.disabled) return false;
          if (focused.closest('[data-kind-ui="treemap-breadcrumbs"]')) return true;
          const id = focused.closest("[data-node-id]")?.getAttribute("data-node-id");
          return (
            id !== null && id !== undefined && ["platforms", "a", "b", "c", "zero"].includes(id)
          );
        }),
      {
        message: "Removed table group focus moves to a surviving semantic descendant or breadcrumb",
      },
    )
    .toBe(true);
});

test("treemap uncontrolled loading clears active inspection with one original-record callback", async ({
  page,
}) => {
  await page.goto("/?uncontrolled-active");
  const resolvedActive = page.locator('output[aria-label="Resolved active"]');
  await tile(page, "a").focus();
  await expect(output(page, "Active ID")).toHaveText("a");
  await expect(resolvedActive).toHaveText("a");
  await expect(output(page, "Active requests")).toHaveText("1");
  await expect(output(page, "Active request log")).toHaveText('[{"id":"a","metric":-2}]');
  await update(page, "Loading");
  await expect(output(page, "Active ID")).toHaveText("none");
  await expect(resolvedActive).toHaveText("none");
  await expect(output(page, "Active requests")).toHaveText("2");
  await expect(output(page, "Active request log")).toHaveText(
    '[{"id":"a","metric":-2},{"id":null,"metric":null}]',
  );
  await update(page, "Colors");
  await update(page, "Resize");
  await expect(output(page, "Active requests")).toHaveText("2");
  // Completing loading does not restore inspection after the user chooses an outside control.
  await page.getByRole("textbox", { name: "Outside focus" }).focus();
  await update(page, "Loading");
  await expect(resolvedActive).toHaveText("none");
  await expect(output(page, "Active ID")).toHaveText("none");
  await expect(output(page, "Active requests")).toHaveText("2");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("treemap repeated categorical labels and wrapped palette entries keep unique presentation keys", async ({
  page,
}) => {
  const duplicateWarnings: string[] = [];
  page.on("console", (message) => {
    if (
      ["warning", "error"].includes(message.type()) &&
      /same key|unique.*key/i.test(message.text())
    )
      duplicateWarnings.push(message.text());
  });
  await page.goto("/?duplicate-legend");
  const entries = page.locator('[data-kind-ui="treemap-legend-item"]');
  await expect(entries).toHaveCount(6);
  await expect(entries).toHaveText(Array.from({ length: 6 }, () => "Same label"));
  for (const control of ["Reorder", "Colors", "Resize"]) {
    await update(page, control);
    await expect(entries).toHaveCount(6);
  }
  expect(duplicateWarnings).toEqual([]);
});

test("treemap empty table group keyboard activation retains focus on its named data alternative", async ({
  page,
}) => {
  await page.goto("/?empty-group");
  const row = page.locator('tbody tr[data-node-id="empty-group"]');
  const action = row.getByRole("button");
  await action.focus();
  await action.press("Enter");
  await expect(output(page, "Resolved view")).toHaveText("empty-group");
  await expect(row).toHaveCount(0);
  const table = page.getByRole("table", { name: "Allocation values and signed change" });
  await expect(table).toBeFocused();
  await expect(table.locator("tbody tr")).toHaveCount(0);
});

for (const mark of ["tile", "header"] as const) {
  test(`treemap loading completion restores actual ${mark} keyboard focus`, async ({ page }) => {
    await page.goto("/");
    const target =
      mark === "tile"
        ? tile(page, "a")
        : page.locator('[data-kind-ui="treemap-group-header"][data-node-id="technology"]');
    await target.focus();
    await expect(target).toBeFocused();
    await update(page, "Loading");
    await expect(page.locator('[data-kind-ui="treemap-content"]')).toHaveAttribute("inert", "");
    await expect(target).not.toBeFocused();
    await update(page, "Loading");
    await expect(target).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(":focus")).toHaveAttribute(
      "data-kind-ui",
      /treemap-tile|treemap-group-header/,
    );
  });
}

test("treemap loading completion respects the user's outside keyboard focus", async ({ page }) => {
  await page.goto("/");
  await tile(page, "a").focus();
  await update(page, "Loading");
  await expect(tile(page, "a")).not.toBeFocused();
  const outside = page.getByRole("textbox", { name: "Outside focus" });
  await outside.focus();
  await expect(outside).toBeFocused();
  await update(page, "Loading");
  await expect(outside).toBeFocused();
  await expect(page.locator('[data-kind-ui="treemap-content"]')).not.toHaveAttribute("inert", "");
});

test("treemap loading restores a removed tile's nearest surviving group focus", async ({
  page,
}) => {
  await page.goto("/");
  await tile(page, "a").focus();
  await update(page, "Loading");
  await expect(tile(page, "a")).not.toBeFocused();
  await update(page, "Remove platforms");
  await expect(tile(page, "a")).toHaveCount(0);
  await update(page, "Loading");
  const ancestor = page.locator('[data-kind-ui="treemap-group-header"][data-node-id="technology"]');
  await expect(ancestor).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(output(page, "Resolved view")).toHaveText("technology");
});

test("treemap loading restores a surviving mark after the focused subtree is removed", async ({
  page,
}) => {
  await page.goto("/");
  await tile(page, "a").focus();
  await update(page, "Loading");
  await update(page, "Remove subtree");
  await expect(tile(page, "a")).toHaveCount(0);
  await update(page, "Loading");
  await expect(page.locator(":focus")).toHaveAttribute("data-node-id", /^(energy|d|e)$/);
  await expect(page.locator(":focus")).toBeEnabled();
});

test("treemap completed entrance releases opacity for subsequent consumer CSS changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?animate&opacity");
  const chart = page.locator('[data-kind-ui="treemap"]');
  await expect(tile(page, "a")).toBeVisible();
  await expect(chart).toHaveCSS("opacity", "0.45");
  await update(page, "Class opacity");
  await expect(chart).toHaveCSS("opacity", "0.8");
  await update(page, "Class opacity");
  await expect(chart).toHaveCSS("opacity", "0.45");
});

test("treemap loading interruption preserves explicit consumer opacity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?animate&opacity");
  const chart = page.locator('[data-kind-ui="treemap"]');
  await update(page, "Inline opacity");
  await update(page, "Loading");
  await expect(chart).toHaveCSS("opacity", "0.7");
  await update(page, "Loading");
  await expect(chart).toHaveCSS("opacity", "0.7");
  await update(page, "Class opacity");
  await expect(chart).toHaveCSS("opacity", "0.7");
});

for (const part of ["table", "breadcrumb", "content"] as const) {
  test(`treemap loading restores exact portaled ${part} focus`, async ({ page }) => {
    await page.goto(part === "content" ? "/?content-control" : "/");
    const control =
      part === "table"
        ? page.locator('tbody tr[data-node-id="b"]').getByRole("button")
        : part === "breadcrumb"
          ? page.getByRole("navigation").getByRole("button", { name: "All", exact: true })
          : page.getByRole("button", { name: "Portal action", exact: true });
    await control.focus();
    await expect(control).toBeFocused();
    const retained = await control.elementHandle();
    if (!retained) throw new Error("Missing portaled focus owner");
    await update(page, "Loading");
    await expect(control).not.toBeVisible();
    await expect
      .poll(() => retained.evaluate((element) => element === document.activeElement))
      .toBe(false);
    await update(page, "Loading");
    await expect(control).toBeFocused();
    expect(await control.evaluate((element, previous) => element === previous, retained)).toBe(
      true,
    );
    await retained.dispose();
  });
  test(`treemap portaled ${part} loading restoration respects deliberate outside focus`, async ({
    page,
  }) => {
    await page.goto(part === "content" ? "/?content-control" : "/");
    const control =
      part === "table"
        ? page.locator('tbody tr[data-node-id="b"]').getByRole("button")
        : part === "breadcrumb"
          ? page.getByRole("navigation").getByRole("button", { name: "All", exact: true })
          : page.getByRole("button", { name: "Portal action", exact: true });
    await control.focus();
    const retained = await control.elementHandle();
    if (!retained) throw new Error("Missing portaled focus owner");
    await update(page, "Loading");
    await expect
      .poll(() => retained.evaluate((element) => element === document.activeElement))
      .toBe(false);
    const outside = page.getByRole("textbox", { name: "Outside focus" });
    await outside.focus();
    await update(page, "Loading");
    await expect(outside).toBeFocused();
    await expect(control).toBeVisible();
    await retained.dispose();
  });
}

for (const mode of ["omit-tooltip", "no-active"]) {
  test(`treemap Escape bubbles unprevented with ${mode}`, async ({ page }) => {
    await page.goto(`/?content-control${mode === "omit-tooltip" ? "&omit-tooltip" : ""}`);
    await page.getByRole("button", { name: "Portal action", exact: true }).focus();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(output(page, "Escape propagation")).toHaveText("[false]");
  });
}

test("treemap active dismissal consumes one Escape and allows already-dismissed Escape to bubble", async ({
  page,
}) => {
  await page.goto("/");
  await tile(page, "a").focus();
  await expect(page.getByRole("tooltip")).toContainText("Alpha");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(output(page, "Escape propagation")).toHaveText("[true]");
  await expect(output(page, "Active ID")).toHaveText("a");
  await page.keyboard.press("Escape");
  await expect(output(page, "Escape propagation")).toHaveText("[true,false]");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

for (const native of ["hidden", "inert"]) {
  for (const target of ["tile", "header", "ancestor"]) {
    test(`treemap excludes ${native} ${target} from native entry, arrows and loading restoration`, async ({
      page,
    }) => {
      await page.goto(
        `/?native=${native}&target=${target}${target === "tile" ? "" : "&parts=groups"}`,
      );
      const stops = page.locator(
        '[data-kind-ui="treemap-tile"][tabindex="0"], [data-kind-ui="treemap-group-header"][tabindex="0"]',
      );
      await expect(stops).toHaveCount(1);
      await expect(stops).toBeVisible();
      expect(
        await stops.evaluate(
          (element) => !element.closest("[hidden],[inert]") && !element.matches(":disabled"),
        ),
      ).toBe(true);
      await page.getByRole("button", { name: "Before chart entry", exact: true }).focus();
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toHaveAttribute(
        "data-kind-ui",
        /treemap-tile|treemap-group-header/,
      );
      const forbidden = target === "tile" ? "d" : "energy";
      for (const key of ["Home", "End", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]) {
        await page.keyboard.press(key);
        await expect(page.locator(":focus")).not.toHaveAttribute("data-node-id", forbidden);
        expect(
          await page
            .locator(":focus")
            .evaluate(
              (element) => !element.closest("[hidden],[inert]") && !element.matches(":disabled"),
            ),
        ).toBe(true);
      }
      const remembered = await page.locator(":focus").elementHandle();
      if (!remembered) throw new Error("Missing visible keyboard owner");
      await update(page, "Loading");
      await update(page, "Loading");
      expect(await remembered.evaluate((element) => element === document.activeElement)).toBe(true);
      await expect(page.locator(":focus")).not.toHaveAttribute("data-node-id", forbidden);
      await remembered.dispose();
      // Native availability changes must update the sole tab stop after the DOM commit.
      await update(page, "Native availability");
      const formerlyBlocked =
        target === "tile"
          ? tile(page, "d")
          : page.locator('[data-kind-ui="treemap-group-header"][data-node-id="energy"]');
      await formerlyBlocked.focus();
      await expect(formerlyBlocked).toBeFocused();
      await update(page, "Native availability");
      await expect(formerlyBlocked).not.toBeFocused();
      await expect(stops).toHaveCount(1);
      expect(
        await stops.evaluate(
          (element) => !element.closest("[hidden],[inert]") && !element.matches(":disabled"),
        ),
      ).toBe(true);
      await page.getByRole("button", { name: "Before chart entry", exact: true }).focus();
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toHaveAttribute(
        "data-kind-ui",
        /treemap-tile|treemap-group-header/,
      );
      await expect(page.locator(":focus")).not.toHaveAttribute("data-node-id", forbidden);
    });
  }
}

test("treemap depth reduction restores the focused leaf's own rendered ancestor", async ({
  page,
}) => {
  await page.goto("/");
  await tile(page, "a").focus();
  await update(page, "Depth");
  await expect(tile(page, "a")).toHaveCount(0);
  await expect(tile(page, "technology")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(output(page, "Resolved view")).toHaveText("technology");
});

for (const field of ["view", "active", "selected"]) {
  for (const direction of ["to-controlled", "to-uncontrolled"]) {
    test(`treemap rejects ${field} ownership switching ${direction} on a real rerender`, async ({
      page,
    }) => {
      await page.goto(`/?ownership=${field}&direction=${direction}`);
      await expect(tile(page, "a")).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(output(page, "Ownership mode")).toHaveText(
        direction === "to-controlled" ? "uncontrolled" : "controlled",
      );
      await update(page, "Switch ownership");
      const alert = page.getByRole("alert");
      await expect(alert).toContainText(new RegExp(`${field}Id`, "i"));
      await expect(alert).toContainText(/controlled|ownership/i);
      await expect(page.locator('[data-kind-ui="treemap"]')).toHaveCount(0);
    });
  }
}

for (const native of ["hidden", "inert"]) {
  test(`treemap table drilldown skips a ${native} first descendant row`, async ({ page }) => {
    await page.goto(`/?table-native=${native}`);
    const action = page.locator('tbody tr[data-node-id="technology"]').getByRole("button");
    await action.focus();
    await action.press("Enter");
    await expect(output(page, "Resolved view")).toHaveText("technology");
    const alpha = page.locator('tbody tr[data-node-id="a"]').getByRole("button");
    await expect(alpha).toBeFocused();
    expect(
      await alpha.evaluate(
        (element) => !element.closest("[hidden],[inert]") && !element.matches(":disabled"),
      ),
    ).toBe(true);
  });
}

test("shared treemap legend dims and hides without reallocating area, and guards the last root", async ({
  page,
}) => {
  for (const hide of [false, true]) {
    await page.goto(`/?shared-legend${hide ? "&hide" : ""}`);
    const alpha = tile(page, "a");
    const before = await alpha.boundingBox();
    const energy = page.locator('button[data-legend-key="energy"]');
    const technology = page.locator('button[data-legend-key="technology"]');
    for (let repeat = 0; repeat < 3; repeat++) {
      await energy.click();
      if (hide) {
        await expect(tile(page, "d")).toBeHidden();
        await expect(alpha).toBeVisible();
        await technology.click();
        await expect(alpha).toBeVisible();
      } else {
        await expect(alpha).toHaveAttribute("data-inactive", "true");
        await alpha.hover();
        await expect(page.locator('[data-kind-ui="chart-tooltip-item"]')).toHaveAttribute(
          "data-inactive",
          "true",
        );
      }
      expect(await alpha.boundingBox()).toEqual(before);
      await energy.click();
      await page.mouse.move(950, 5);
      await expect(tile(page, "d")).toBeVisible();
      await expect(alpha).not.toHaveAttribute("data-inactive", "true");
    }
  }
});

test("treemap tooltip follows motion within the same tile and clamps on resize", async ({
  page,
}) => {
  await page.goto("/?animate&shared-legend");
  const alpha = tile(page, "a");
  const box = await alpha.boundingBox();
  if (!box) throw new Error("Missing tile");
  await page.mouse.move(box.x + 10, box.y + 20);
  const first = await page.getByRole("tooltip").boundingBox();
  await page.mouse.move(box.x + 45, box.y + 40);
  const second = await page.getByRole("tooltip").boundingBox();
  if (!first || !second) throw new Error("Missing cursor tooltip");
  expect(second.x).toBeGreaterThan(first.x);
  expect(second.y).toBeGreaterThan(first.y);
  await update(page, "Resize");
  await alpha.hover();
  const tooltip = await page.getByRole("tooltip").boundingBox();
  const chart = await page.locator('[data-kind-ui="treemap"]').boundingBox();
  if (!tooltip || !chart) throw new Error("Missing measured bounds");
  expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(chart.x + chart.width + 1);
  expect(tooltip.y + tooltip.height).toBeLessThanOrEqual(chart.y + chart.height + 1);
});

test("animated cursor inspection retargets continuously and clamps during resize", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?animate&shared-legend");
  const alpha = tile(page, "a");
  const box = await alpha.boundingBox();
  if (!box) throw new Error("Missing tile");
  await page.mouse.move(box.x + 12, box.y + 15);
  await expect(page.getByRole("tooltip")).toBeVisible();
  await page.mouse.move(box.x + 70, box.y + 70);
  const samples = await page.locator('[data-kind-ui="tooltip-motion"]').evaluate(
    (element) =>
      new Promise<string[]>((resolve) => {
        const values: string[] = [];
        const sample = () => {
          values.push(getComputedStyle(element).transform);
          if (values.length < 8) requestAnimationFrame(sample);
          else resolve(values);
        };
        requestAnimationFrame(sample);
      }),
  );
  expect(new Set(samples).size).toBeGreaterThan(1);
  await update(page, "Weights");
  await expect(page.locator('[data-kind-ui="tooltip-number"]')).toBeVisible();
  await update(page, "Resize");
  const overflow = await page.getByRole("tooltip").evaluate((element) => {
    const chart = element.closest('[data-kind-ui="treemap"]');
    if (!chart) throw new Error("Missing plot");
    return new Promise<boolean>((resolve) => {
      let count = 0;
      let bounded = true;
      const sample = () => {
        const a = element.getBoundingClientRect();
        const b = chart.getBoundingClientRect();
        bounded &&= a.left >= b.left - 1 && a.right <= b.right + 1 && a.bottom <= b.bottom + 1;
        if (++count < 10) requestAnimationFrame(sample);
        else resolve(bounded);
      };
      requestAnimationFrame(sample);
    });
  });
  expect(overflow).toBe(true);
});

test("treemap loading uses changing contained decorative partitions and a static reduced-motion state", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await update(page, "Loading");
  const skeleton = page.locator('[data-kind-ui="chart-loading-skeleton"][data-family="treemap"]');
  await expect(skeleton).toHaveAttribute("data-loading-motion", "wave");
  const profile = skeleton.locator("[data-profile]");
  const initial = await profile.getAttribute("data-profile");
  await expect.poll(() => profile.getAttribute("data-profile")).not.toBe(initial);
  expect(
    await skeleton.locator("rect").evaluateAll((rects) =>
      rects.every((rect) => {
        const x = Number(rect.getAttribute("x")),
          y = Number(rect.getAttribute("y"));
        return (
          x >= 0 &&
          y >= 0 &&
          x + Number(rect.getAttribute("width")) <= 640 &&
          y + Number(rect.getAttribute("height")) <= 240
        );
      }),
    ),
  ).toBe(true);
  await update(page, "Resize");
  await expect(skeleton).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const staticProfile = await profile.getAttribute("data-profile");
  await expect
    .poll(() => skeleton.evaluate((el) => getComputedStyle(el).animationName))
    .toBe("none");
  await page.waitForTimeout(1900);
  expect(await profile.getAttribute("data-profile")).toBe(staticProfile);
  await update(page, "Loading");
  await expect(skeleton).toHaveCount(0);
  await expect(tile(page, "a")).toBeVisible();
  await update(page, "Loading");
  await expect(skeleton).toBeVisible();
  await update(page, "Loading");
  await expect(tile(page, "a")).toBeVisible();
});
