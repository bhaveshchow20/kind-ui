import { expect, type Page, test } from "@playwright/test";

const port = 4198 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
test.beforeEach(async ({ page, baseURL }, testInfo) => {
  await page.goto(
    testInfo.project.name === "identity-colors-focused"
      ? (baseURL ?? "/")
      : `http://127.0.0.1:${port}`,
  );
});
async function fills(page: Page, family: string, selector: string) {
  return page
    .getByRole("region", { name: family, exact: true })
    .locator(selector)
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fill));
}
const sector = "path.recharts-sector";
async function categories(page: Page, colors: string[]) {
  for (const family of ["Pie", "Donut", "Radial"])
    await expect.poll(() => fills(page, family, sector)).toEqual(colors);
}
async function legend(page: Page, family: string) {
  return page
    .getByRole("region", { name: family, exact: true })
    .locator('[data-kind-ui="chart-indicator"]')
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).backgroundColor));
}

test("configured identity keeps Pie, Donut, Radial, Sankey and series paint aligned across reorder/update/filter", async ({
  page,
}) => {
  const red = "rgb(204, 34, 68)",
    blue = "rgb(34, 85, 204)",
    green = "rgb(17, 119, 68)";
  await categories(page, [red, blue]);
  for (const family of ["Pie", "Donut", "Radial", "Sankey", "Series"])
    await expect.poll(() => legend(page, family)).toEqual([red, blue]);
  await expect
    .poll(() => fills(page, "Sankey", ".recharts-sankey-nodes rect"))
    .toEqual([red, blue]);
  await expect(
    page
      .getByRole("region", { name: "Sankey", exact: true })
      .locator(".recharts-sankey-links path"),
  ).toHaveCSS("stroke", red);
  await page.getByRole("button", { name: "Gradient defaults" }).click();
  const stops = page
    .getByRole("region", { name: "Sankey", exact: true })
    .locator("linearGradient stop");
  await expect(stops.nth(0)).toHaveAttribute("stop-color", "#cc2244");
  await expect(stops.nth(1)).toHaveAttribute("stop-color", "#2255cc");
  await page.getByRole("button", { name: "Reorder", exact: true }).click();
  await categories(page, [blue, red]);
  await expect
    .poll(() => fills(page, "Sankey", ".recharts-sankey-nodes rect"))
    .toEqual([blue, red]);
  await page.getByRole("button", { name: "Update colors" }).click();
  await categories(page, [blue, green]);
  await expect(stops.nth(0)).toHaveAttribute("stop-color", "#117744");
  await expect(stops.nth(1)).toHaveAttribute("stop-color", "#2255cc");
  for (const family of ["Pie", "Donut", "Radial", "Sankey", "Series"])
    await expect.poll(() => legend(page, family)).toEqual([green, blue]);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await categories(page, [blue]);
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await categories(page, [blue, green]);
  const lines = page
    .getByRole("region", { name: "Series", exact: true })
    .locator(".recharts-line-curve");
  await expect(lines).toHaveCount(2);
  await expect(page.locator('.recharts-line-curve[stroke="var(--color-beta)"]')).toHaveCSS(
    "stroke",
    blue,
  );
  await expect(page.locator('.recharts-line-curve[stroke="var(--color-alpha)"]')).toHaveCSS(
    "stroke",
    green,
  );
});
test("mixed Cells/datum paint, native series fill, custom renderers and custom legends retain precedence", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Cell override" }).click();
  for (const family of ["Pie", "Radial"])
    await expect
      .poll(() => fills(page, family, sector))
      .toEqual(["rgb(204, 34, 68)", "rgb(170, 119, 0)"]);
  await page.getByRole("button", { name: "Datum override" }).click();
  for (const family of ["Pie", "Radial"])
    await expect
      .poll(() => fills(page, family, sector))
      .toEqual(["rgb(102, 68, 153)", "rgb(170, 119, 0)"]);
  await page.getByRole("region", { name: "Pie", exact: true }).locator(sector).nth(1).click();
  await expect(page.getByLabel("Cell clicks")).toHaveText("1");
  await page.getByRole("button", { name: "Datum override" }).click();
  await page.getByRole("button", { name: "Custom owners" }).click();
  for (const family of ["Pie", "Radial"])
    await expect
      .poll(() => fills(page, family, sector))
      .toEqual(["rgb(68, 102, 119)", "rgb(170, 119, 0)"]);
  await expect(page.locator('[data-custom="pie"]')).toHaveCount(2);
  await expect(page.locator('[data-custom="radial"]')).toHaveCount(2);
  await expect(page.locator("[data-custom-legend]")).toHaveCount(2);
  await expect(page.locator("[data-custom-node-legend]")).toHaveCount(2);
  await expect
    .poll(() => fills(page, "Sankey", ".recharts-sankey-nodes rect"))
    .toEqual(["rgb(153, 102, 51)", "rgb(153, 102, 51)"]);
  await expect(
    page.getByRole("region", { name: "Sankey", exact: true }).locator("linearGradient stop").nth(0),
  ).toHaveAttribute("stop-color", "#335599");
  await expect(
    page.getByRole("region", { name: "Sankey", exact: true }).locator("linearGradient stop").nth(1),
  ).toHaveAttribute("stop-color", "#993355");
});
