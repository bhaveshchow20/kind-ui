import { expect, type Locator, test } from "./browser.js";

const url = "http://127.0.0.1:4177";
const control = "[data-kind-ui=radar-selection]";
const dimmed = `${control}[data-selection=dimmed]`;
const radar = "[data-host=radar]";
const selected = `${control}[data-selection=selected]`;

async function polygonCenter(path: Locator) {
  return path.evaluate((node: SVGPathElement) => {
    const points = [...(node.getAttribute("d") ?? "").matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)];
    if (!points.length) throw new Error("Missing native polygon coordinates");
    const x = points.reduce((sum, point) => sum + Number(point[1]), 0) / points.length;
    const y = points.reduce((sum, point) => sum + Number(point[2]), 0) / points.length;
    const matrix = node.getScreenCTM();
    if (!matrix) throw new Error("Missing native screen transform");
    const point = new DOMPoint(x, y).matrixTransform(matrix);
    return { x: point.x, y: point.y };
  });
}
async function clickPolygon(path: Locator) {
  const point = await polygonCenter(path);
  const box = await path.boundingBox();
  if (!box) throw new Error("Missing visible native polygon");
  await path.click({ position: { x: point.x - box.x, y: point.y - box.y } });
}
async function geometry(host: Locator) {
  return host
    .locator(".recharts-radar-polygon path, .recharts-radar-dots circle, .recharts-label")
    .evaluateAll((nodes) =>
      nodes.map((node) => [
        node.tagName,
        ...[
          "d",
          "cx",
          "cy",
          "r",
          "x",
          "y",
          "opacity",
          "fill",
          "fill-opacity",
          "stroke",
          "filter",
        ].map((name) => node.getAttribute(name)),
      ]),
    );
}

test("uncontrolled series selection needs no state glue and preserves native paint and click ownership", async ({
  page,
}) => {
  await page.goto(`${url}?selection&bare`);
  const host = page.locator(radar);
  await expect(host.locator(control)).toHaveCount(2);
  const before = await geometry(host);
  const actual = host.getByRole("button", { name: "Highlight Actual", exact: true });
  for (let repeat = 0; repeat < 3; repeat++) {
    await clickPolygon(actual.locator(".recharts-radar-polygon path"));
    await expect(actual).toHaveAttribute("aria-pressed", "true");
    await expect(host.locator(dimmed)).toHaveCount(1);
    await page.mouse.move(0, 0);
    await expect(actual).toHaveAttribute("aria-pressed", "true");
    expect(await geometry(host)).toEqual(before);
    await clickPolygon(actual.locator(".recharts-radar-polygon path"));
    await expect(host.locator(dimmed)).toHaveCount(0);
    await expect(actual).toHaveAttribute("aria-pressed", "false");
  }
  await expect(page.locator("output")).toContainText("Clicks 6");
  await expect(page.locator("output")).toContainText("requests []");
  await expect(host.locator("svg[data-ref-count='1']")).toHaveCount(1);
});

test("keyboard controls toggle once, reject held-key repeats and reset with Escape", async ({
  page,
}) => {
  await page.goto(`${url}?selection`);
  const host = page.locator(radar);
  const actual = host.getByRole("button", { name: "Highlight Actual", exact: true });
  const target = host.getByRole("button", { name: "Highlight Target", exact: true });
  await actual.focus();
  await expect(actual).toBeFocused();
  expect(await actual.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(actual).toHaveAttribute("aria-pressed", "true");
  await actual.evaluate((node) =>
    node.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", repeat: true, bubbles: true })),
  );
  await expect(actual).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(host.locator(selected)).toHaveCount(0);
  await target.focus();
  await page.keyboard.press("Space");
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(host.locator(dimmed)).toHaveCount(0);
  await expect(page.locator("output")).toContainText('requests ["value",null,"alias",null]');
  await expect(page.locator("output")).toContainText("Clicks 0");
});

test("controlled selection requests updates and never overrides consumer visibility or frozen state", async ({
  page,
}) => {
  await page.goto(`${url}?selection&controlled`);
  const host = page.locator(radar);
  const actual = host.getByRole("button", { name: "Highlight Actual", exact: true });
  const target = host.getByRole("button", { name: "Highlight Target", exact: true });
  await page.getByRole("button", { name: "Freeze selection", exact: true }).click();
  await actual.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("output")).toContainText('requests ["value"]');
  await expect(host.locator(selected)).toHaveCount(0);
  await page.getByRole("button", { name: "Freeze selection", exact: true }).click();
  await actual.focus();
  await page.keyboard.press("Enter");
  await expect(actual).toHaveAttribute("aria-pressed", "true");
  await host.getByRole("button", { name: "Actual", exact: true }).click();
  await expect(host.locator(control)).toHaveCount(1);
  await expect(host.locator(dimmed)).toHaveCount(0);
  await expect(page.locator("output")).toContainText("selected value");
  await expect(page.locator("output")).toContainText('requests ["value","value"]');
  await host.getByRole("button", { name: "Actual", exact: true }).click();
  await expect(actual).toHaveAttribute("aria-pressed", "true");
  await target.focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("output")).toContainText("selected none");
  await expect(host.locator(dimmed)).toHaveCount(0);
});

test("uncontrolled visibility, empty data and opt-out clear selection without synthetic callbacks", async ({
  page,
}) => {
  await page.goto(`${url}?selection`);
  const host = page.locator(radar);
  const actual = host.getByRole("button", { name: "Highlight Actual", exact: true });
  await actual.focus();
  await page.keyboard.press("Enter");
  await host.getByRole("button", { name: "Actual", exact: true }).click();
  await expect(host.locator(dimmed)).toHaveCount(0);
  await host.getByRole("button", { name: "Actual", exact: true }).click();
  await expect(actual).toHaveAttribute("aria-pressed", "false");
  await actual.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(host.locator(control)).toHaveCount(0);
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(actual).toHaveAttribute("aria-pressed", "false");
  await actual.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Selection mode", exact: true }).click();
  await expect(host.locator(control)).toHaveCount(0);
  await page.getByRole("button", { name: "Selection mode", exact: true }).click();
  await expect(actual).toHaveAttribute("aria-pressed", "false");
  await actual.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Emphasis mode", exact: true }).click();
  await expect(host.locator(control)).toHaveCount(0);
  await page.getByRole("button", { name: "Emphasis mode", exact: true }).click();
  await expect(actual).toHaveAttribute("aria-pressed", "false");
  await expect(host.locator("svg[data-ref-count='1']")).toHaveCount(1);
  await expect(page.locator("output")).toContainText('requests ["value","value","value","value"]');
});

test("native spoke inspection and portaled labels/active markers stay independent of persistent selection", async ({
  page,
}) => {
  await page.goto(`${url}?selection`);
  const host = page.locator(radar);
  const target = host.getByRole("button", { name: "Highlight Target", exact: true });
  await target.focus();
  await page.keyboard.press("Enter");
  await host.locator("svg[role=application]").focus();
  await page.keyboard.press("ArrowRight");
  await expect(host.locator("[data-kind-ui=chart-tooltip]")).toBeVisible();
  await expect(host.locator("[data-kind-ui=chart-tooltip-item]")).toHaveCount(2);
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await expect(host.locator("[data-kind-ui=active-marker]")).toHaveCount(2);
  expect(
    await host
      .locator(".recharts-label, [data-kind-ui=active-marker]")
      .evaluateAll((nodes) =>
        nodes.every((node) => !node.closest("[data-kind-ui=radar-selection-paint]")),
      ),
  ).toBe(true);
  await host.locator(".recharts-label").first().click();
  await expect(target).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("output")).toContainText('requests ["alias"]');
  await page.mouse.move(0, 0);
  await expect(target).toHaveAttribute("aria-pressed", "true");
});

test("default charts remain unselected and consumer custom shapes/veto retain ownership", async ({
  page,
}) => {
  await page.goto(url);
  await expect(page.locator(radar).locator(control)).toHaveCount(0);
  await page.goto(`${url}?selection&radar-shape&veto`);
  const host = page.locator(radar);
  const actual = host.getByRole("button", { name: "Highlight Actual", exact: true });
  const path = actual.locator("[data-host-shape=radar]");
  const before = await path.getAttribute("d");
  await clickPolygon(path);
  await expect(page.locator("output")).toContainText("Clicks 1");
  await expect(host.locator(selected)).toHaveCount(0);
  await actual.focus();
  await page.keyboard.press("Enter");
  await expect(actual).toHaveAttribute("aria-pressed", "true");
  await expect(path).toHaveAttribute("d", before ?? "");
});

test.describe("touch selection", () => {
  test.use({ hasTouch: true });
  test("tap toggles persistent selection and consumer click exactly once", async ({ page }) => {
    await page.goto(`${url}?selection`);
    const host = page.locator(radar);
    const actual = host.getByRole("button", { name: "Highlight Actual", exact: true });
    const point = await polygonCenter(actual.locator(".recharts-radar-polygon path"));
    await page.touchscreen.tap(point.x, point.y);
    await expect(actual).toHaveAttribute("aria-pressed", "true");
    await page.touchscreen.tap(point.x, point.y);
    await expect(actual).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("output")).toContainText("Clicks 2");
    await expect(page.locator("output")).toContainText('requests ["value",null]');
  });
});

for (const renderer of ["dot-object", "dot-element", "dot-function"]) {
  test(`regular ${renderer} preserves native geometry, refs, callbacks and portal-local paint`, async ({
    page,
  }) => {
    await page.goto(`${url}?selection&bare&${renderer}`);
    const host = page.locator(radar);
    const dots = host.locator(".recharts-radar-dots circle");
    await expect(dots).toHaveCount(4);
    const attributes = () =>
      dots.evaluateAll((nodes) =>
        nodes.map((node) =>
          ["cx", "cy", "r", "opacity", "fill", "stroke", "data-row", "data-attachments"].map(
            (key) => node.getAttribute(key),
          ),
        ),
      );
    const before = await attributes();
    const target = host.getByRole("button", { name: "Highlight Target", exact: true });
    await target.focus();
    await page.keyboard.press("Enter");
    await expect(dots.first().locator("..")).toHaveCSS("opacity", "0.28");
    expect(await attributes()).toEqual(before);
    await dots.nth(1).click();
    await expect(
      host.getByRole("button", { name: "Highlight Actual", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("output")).toContainText("dot clicks 1; dot target circle");
    await expect(page.locator("output")).toContainText("Clicks 0");
    expect(await attributes()).toEqual(before);
  });
}

test("dot click veto and native single-point fallback retain their contracts", async ({ page }) => {
  await page.goto(`${url}?selection&dot-object&dot-veto`);
  const host = page.locator(radar);
  await host.locator(".recharts-radar-dots circle").nth(1).click();
  await expect(page.locator("output")).toContainText("dot clicks 1; dot target circle");
  await expect(host.locator(selected)).toHaveCount(0);
  await page.goto(`${url}?selection&dot-off`);
  await expect(host.locator(".recharts-radar-dots circle")).toHaveCount(0);
  await page.goto(`${url}?selection&dot-off&single`);
  await expect(host.locator(".recharts-radar-dots circle")).toHaveCount(2);
  await host.locator(".recharts-radar-dots circle").first().click();
  await expect(host.getByRole("button", { name: "Highlight Actual", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

for (const renderer of ["portal-dot", "portal-shape"]) {
  test(`consumer ${renderer} keeps its own portal paint and interaction`, async ({ page }) => {
    await page.goto(`${url}?selection&${renderer}`);
    const host = page.locator(radar);
    const portal = page.locator("[data-host=portal]");
    const paint = portal.locator(renderer === "portal-dot" ? "circle" : "path").first();
    await expect(paint).toBeVisible();
    const before = await paint.evaluate((node) => ({
      html: node.outerHTML,
      opacity: getComputedStyle(node).opacity,
    }));
    const target = host.getByRole("button", { name: "Highlight Target", exact: true });
    await target.focus();
    await page.keyboard.press("Enter");
    await expect(target).toHaveAttribute("aria-pressed", "true");
    expect(
      await paint.evaluate((node) => ({
        html: node.outerHTML,
        opacity: getComputedStyle(node).opacity,
      })),
    ).toEqual(before);
    if (renderer === "portal-dot") await paint.click();
    else await clickPolygon(paint);
    await expect(target).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("output")).toContainText('requests ["alias"]');
    await expect(page.locator("output")).toContainText(
      renderer === "portal-dot" ? "dot clicks 1" : "Clicks 1",
    );
  });
}

test.describe("selection during Motion entrance", () => {
  test.use({ reducedMotion: "no-preference" });
  test("selection survives native geometry updates, responsive widths and entrance interruption", async ({
    page,
  }) => {
    await page.goto(`${url}?selection&motion`);
    const host = page.locator(radar);
    await expect
      .poll(() =>
        host
          .locator("[data-kind-ui=radar-reveal]")
          .first()
          .evaluate((node) => Number(getComputedStyle(node).opacity)),
      )
      .toBeLessThan(1);
    const actual = host.getByRole("button", { name: "Highlight Actual", exact: true });
    await actual.focus();
    await page.keyboard.press("Enter");
    for (const name of ["Resize", "Reorder", "Geometry", "Domain", "Update"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await expect(actual).toHaveAttribute("aria-pressed", "true");
      await expect(host.locator(dimmed)).toHaveCount(1);
      await expect
        .poll(async () =>
          host
            .locator(".recharts-radar-polygon path")
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
        )
        .toEqual(
          await page
            .locator("[data-host=native] .recharts-radar-polygon path")
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
        );
      await expect(host.locator("[data-kind-ui=radar-reveal]").first()).toHaveCSS("opacity", "1");
    }
    await expect(host.locator("svg[data-ref-count='1']")).toHaveCount(1);
  });
});
