import { expect, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
test.beforeEach(async ({ page }) => {
  await page.goto(`http://127.0.0.1:${4190 + offset}`);
});

for (const width of [1000, 320]) {
  test(`packed compact cells, associated accessible headers and usable overflow at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const grid = page.getByRole("grid", { name: "Compact contributions" });
    const cells = grid.getByRole("gridcell");
    await expect(cells).toHaveCount(182);
    await expect(grid.locator("caption")).toHaveText("Compact contributions");
    await expect(grid.getByRole("rowheader", { name: "Day: Monday", exact: true })).toHaveCount(1);
    await expect(
      grid.getByRole("columnheader", { name: "Period: Week 1", exact: true }),
    ).toHaveCount(1);
    const geometry = await grid.evaluate((table: HTMLTableElement) => {
      const cell = table.querySelector("td");
      if (!cell) throw new Error("Missing cell");
      const rect = cell.getBoundingClientRect();
      const ids = cell.headers.split(" ");
      const headers = ids.map((id) => document.getElementById(id));
      return {
        width: rect.width,
        height: rect.height,
        gap: getComputedStyle(table).borderSpacing,
        headers: headers.map((header) => ({
          text: header?.textContent,
          scope: header?.getAttribute("scope"),
          ownGrid: header?.closest("table") === table,
        })),
        rowWidth: headers[0]?.getBoundingClientRect().width,
        scrollWidth: table.parentElement?.scrollWidth,
        clientWidth: table.parentElement?.clientWidth,
      };
    });
    expect(geometry.width).toBeCloseTo(12, 1);
    expect(geometry.height).toBeCloseTo(12, 1);
    expect(geometry.gap).toBe("3px");
    expect(geometry.headers).toEqual([
      { text: "Day: Monday", scope: "row", ownGrid: true },
      { text: "Period: Week 1", scope: "col", ownGrid: true },
    ]);
    expect(geometry.rowWidth).toBe(1);
    if (width === 320) expect(geometry.scrollWidth).toBeGreaterThan(geometry.clientWidth ?? 0);
    // Verify actual browser accessibility exposure as well as explicit native associations.
    const session = await page.context().newCDPSession(page);
    const tree = await session.send("Accessibility.getFullAXTree");
    for (const [role, name] of [
      ["rowheader", "Day: Monday"],
      ["columnheader", "Period: Week 1"],
      ["grid", "Compact contributions"],
    ]) {
      expect(
        tree.nodes.some(
          (node) => !node.ignored && node.role?.value === role && node.name?.value === name,
        ),
      ).toBe(true);
    }
    await session.detach();
    await page
      .getByRole("region", { name: "Compact fixture" })
      .screenshot({ path: info.outputPath(`compact-${width}.png`) });
    await expect(cells.first().locator('[data-custom-cell="0"]')).toHaveCount(1);
    await expect(cells.first()).toHaveClass("consumer-cell");
    await expect(cells.first()).toHaveCSS("border-radius", "2px");
    await expect(cells.first()).toHaveCSS("opacity", "0.8");
    await page.getByRole("button", { name: "Focus consumer ref" }).click();
    await expect(cells.first()).toBeFocused();
    await expect(page.getByRole("status", { name: "Consumer events" })).toHaveText("1");
    const tooltip = page.getByRole("tooltip", { name: "Monday, Week 1: 0", exact: true });
    await expect(tooltip).toHaveText("Monday, Week 1: 0");
    await expect(cells.first()).toHaveAttribute(
      "aria-describedby",
      (await tooltip.getAttribute("id")) ?? "",
    );
    await page.keyboard.press("ArrowRight");
    await expect(cells.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(cells.nth(27)).toBeFocused();
    await page.keyboard.press("Home");
    await expect(cells.nth(26)).toBeFocused();
    await page.keyboard.press("Control+End");
    await expect(cells.last()).toBeFocused();
    await expect(grid.locator('td[tabindex="0"]')).toHaveCount(1);
    const tip = page.getByRole("tooltip", { name: "Sunday, Week 26: 1", exact: true });
    await expect(tip).toBeVisible();
    const bounds = await tip.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
    if (width === 320)
      expect(await grid.locator("..").evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    await page.keyboard.press("Control+Home");
    await expect(cells.first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(grid.locator("..").locator("..").getByRole("tooltip")).toHaveCount(0);
    await page.getByRole("button", { name: "Toggle compact labels" }).click();
    await expect(grid).toHaveAttribute("data-row-labels", "visible");
    expect((await cells.first().boundingBox())?.height).toBeCloseTo(12, 1);
    const row = grid.getByRole("rowheader", { name: "Day: Monday", exact: true });
    expect((await row.boundingBox())?.width).toBeGreaterThan(90);
    const column = grid.getByRole("columnheader", { name: "Period: Week 1", exact: true });
    expect((await column.boundingBox())?.height).toBeGreaterThan(1);
    await page.getByRole("button", { name: "Toggle compact labels" }).click();
    await page.getByRole("button", { name: "Use CSS lengths" }).click();
    await expect(cells.first()).toHaveCSS("height", "16px");
    await expect(grid).toHaveCSS("border-spacing", "4px");
    await page.getByRole("button", { name: "Use zero gap" }).click();
    await expect(grid).toHaveCSS("border-spacing", "0px");
    expect((await cells.first().boundingBox())?.width).toBeCloseTo(12, 1);
    const independent = page.getByRole("grid", { name: "Independent headers" });
    await expect(independent).toHaveAttribute("data-row-labels", "hidden");
    expect(
      (await independent.getByRole("columnheader", { name: "X", exact: true }).boundingBox())
        ?.height,
    ).toBeGreaterThan(1);
    await page.getByText("Compact data", { exact: true }).click();
    await expect(page.getByRole("table", { name: "Contribution values" })).toBeVisible();
  });
}

test("explicit native table and cell styles override compact defaults; cell handlers retain control", async ({
  page,
}) => {
  const grid = page.getByRole("grid", { name: "Explicit compact styles" });
  await expect(grid).toHaveCSS("border-spacing", "7px");
  await expect(grid).toHaveCSS("width", "180px");
  const cell = grid.getByRole("gridcell").first();
  await expect(cell).toHaveCSS("height", "28px");
  await expect(cell).toHaveCSS("padding", "4px");
  await expect(cell).toHaveCSS("border-radius", "8px");
  await cell.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(cell.first()).toBeFocused();
  const defaults = page.getByRole("grid", { name: "Default dimensions" });
  expect((await defaults.getByRole("gridcell").boundingBox())?.height).toBeGreaterThanOrEqual(41.5);
  await expect(defaults).not.toHaveAttribute("data-cell-sizing");
  await expect(defaults).toHaveCSS("border-spacing", "3px");
});
