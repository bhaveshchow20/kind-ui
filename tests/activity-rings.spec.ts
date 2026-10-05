import { expect, test } from "@playwright/test";

const port = 4199 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const url =
  process.env.KIND_UI_ACTIVITY_RINGS_URL ?? `http://127.0.0.1:${port}/activity-rings.html`;

test("packed activity rings match explicit native geometry and preserve identity through reorder/update", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const sectors = (id: string) => page.locator(`${id} .recharts-radial-bar-sector`);
  await expect(sectors("#defaults")).toHaveCount(3);
  await expect(page.locator('#defaults [role="application"]')).toHaveAttribute(
    "aria-label",
    "Daily activity",
  );
  const geometry = (id: string) =>
    sectors(id).evaluateAll((nodes) =>
      nodes.map((node) => ({ d: node.getAttribute("d"), fill: node.getAttribute("fill") })),
    );
  await expect.poll(() => geometry("#defaults")).toEqual(await geometry("#explicit"));
  await expect(page.locator('#defaults [data-kind-ui="chart-instructions"]')).toContainText(
    "Move75Exercise30Stand50",
  );
  await page.getByRole("button", { name: "Reorder" }).click();
  await expect.poll(() => geometry("#defaults")).toEqual(await geometry("#explicit"));
  await expect(page.locator('#defaults [data-kind-ui="chart-legend"] li').first()).toContainText(
    "Stand",
  );
  await page.getByRole("button", { name: "Update" }).click();
  await expect(page.locator('#defaults [data-kind-ui="chart-instructions"]')).toContainText(
    "Stand50Exercise50Move50",
  );
  await expect.poll(() => geometry("#defaults")).toEqual(await geometry("#explicit"));
  expect(errors).toEqual([]);
});

test("native overrides, mixed paint, normalized geometry and raw-value tooltip", async ({
  page,
}) => {
  await page.goto(url);
  const paths = page.locator("#overrides .recharts-radial-bar-sector");
  // A below-domain zero ring has no foreground path; background remains native.
  await expect(paths).toHaveCount(2);
  const d = (selector: string) =>
    page.locator(selector).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  expect(await d("#overrides .recharts-radial-bar-sector")).toEqual(
    await d("#normalized .recharts-radial-bar-sector"),
  );
  await expect(paths.first()).toHaveAttribute("fill", "purple");
  await expect(paths.nth(1)).toHaveAttribute("fill", "orange");
  await expect(page.locator('#overrides [data-kind-ui="chart-legend"]')).toHaveCount(0);
  const svg = page.locator('#overrides [role="application"]');
  await expect(svg).toHaveAttribute("aria-labelledby", "override-title");
  await expect(svg).toHaveAttribute("aria-describedby", /description /);
  await expect(page.locator('#overrides [data-kind-ui="chart-instructions"]')).toContainText(
    "Move25Exercise300Stand-10",
  );
  await paths.nth(1).scrollIntoViewIfNeeded();
  const arc = await paths.nth(1).boundingBox();
  if (!arc) throw new Error("Expected a painted exercise arc");
  // The half-circle bounding-box center lies in its empty interior.
  await page.mouse.move(arc.x + arc.width / 2, arc.y + 5);
  await expect(page.locator('#overrides [data-kind-ui="chart-tooltip"]')).toContainText(
    "Exercise 300",
  );
  await page.screenshot({ path: "artifacts/chart-tests/activity-rings-overrides.png" });
});

test("empty, zero/full rings and reduced-motion settle with bounded visual labels", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator("#empty .recharts-radial-bar-sector")).toHaveCount(0);
  await expect(page.locator("#zero .recharts-radial-bar-sector")).toHaveCount(1);
  const shape = page.locator("#zero .recharts-radial-bar-sector");
  const d = await shape.getAttribute("d");
  await page.waitForTimeout(100);
  expect(await shape.getAttribute("d")).toBe(d);
  expect(d).not.toMatch(/NaN|Infinity/);
  await expect(page.locator('#zero [data-kind-ui="chart-instructions"]')).toContainText(
    "Move0Exercise100",
  );
  for (const label of await page.locator('#zero [data-kind-ui="radial-label"]').all())
    if (await label.isVisible()) await expect(label).toHaveAttribute("data-fit", "yes");
});
