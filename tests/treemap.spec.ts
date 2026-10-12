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
    if (name === "Colors") expect(await geometry(page)).toEqual(before);
  }
  await original.dispose();
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
    await page.goto(`/?count=${count}`);
    await expect(page.locator('[data-kind-ui="treemap-tile"]')).toHaveCount(count);
    await expect(page.locator("tbody tr")).toHaveCount(count + 1);
    info.annotations.push({
      type: "render-duration-ms",
      description: String(Date.now() - started),
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
