import { expect, test } from "./browser.js";

const url = "http://127.0.0.1:4177";
const window = '[data-kind-ui="radar-entrance-window"]';
const polygons = ".recharts-radar-polygon .recharts-polygon";

for (const range of [false, true]) {
  test(`Radar center-out paint preserves native ${range ? "range" : "single"} paths and labels`, async ({
    page,
  }, info) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${url}/?motion${range ? "&range" : ""}`);
    const host = page.locator('[data-host="radar"]');
    const native = page.locator('[data-host="native"]');
    const paths = async (scope: typeof host) =>
      scope
        .locator(polygons)
        .evaluateAll((nodes) =>
          nodes.flatMap((node) =>
            (node.matches("path") ? [node] : [...node.querySelectorAll("path")]).map((node) =>
              node.getAttribute("d"),
            ),
          ),
        );
    await expect(host.locator(window).first()).toBeAttached();
    const before = await paths(host);
    expect(before.length).toBeGreaterThan(0);
    expect(before.join()).not.toMatch(/NaN|Infinity/);
    expect(before).toEqual(await paths(native));
    const circle = host.locator(window).first();
    await page.clock.runFor(100);
    const radius = Number(await circle.getAttribute("r"));
    expect(radius).toBeGreaterThan(0);
    await page.clock.runFor(150);
    expect(Number(await circle.getAttribute("r"))).toBeGreaterThan(radius);
    expect(await paths(host)).toEqual(before);
    await expect(host.locator('[data-kind-ui="radar-reveal"]').first()).toHaveCSS("opacity", "1");
    await expect(host.locator(".recharts-label-list").first()).toHaveCSS("opacity", "1");
    await host.screenshot({
      path: info.outputPath(`radar-${range ? "range" : "single"}-entrance.png`),
    });
    await page.clock.runFor(2600);
    await expect(host.locator(window)).toHaveCount(0);
    expect(await paths(host)).toEqual(before);
  });
}

for (const change of [
  "Update",
  "Resize",
  "Domain",
  "Geometry",
  "Reorder",
  "Native hide",
] as const) {
  test(`Radar settles on ${change} and does not replay`, async ({ page }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${url}/?motion`);
    const host = page.locator('[data-host="radar"]');
    await expect(host.locator(window).first()).toBeAttached();
    await page
      .getByRole("button", { name: change, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(host.locator(window)).toHaveCount(0);
    await page
      .getByRole("button", { name: change, exact: true })
      .evaluate((node) => (node as HTMLButtonElement).click());
    await page.clock.runFor(100);
    await expect(host.locator(window)).toHaveCount(0);
  });
}

test("Radar entrance interruption preserves native pressed node and persistent selection", async ({
  page,
}) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?motion&selection&bare`);
  const host = page.locator('[data-host="radar"]');
  await expect(host.locator(window).first()).toBeAttached();
  const control = host.getByRole("button", { name: "Highlight Actual", exact: true });
  const path = control.locator(".recharts-radar-polygon path").first();
  const node = await path.elementHandle();
  await path.dispatchEvent("pointerdown", { button: 0 });
  await expect(host.locator(window)).toHaveCount(0);
  expect(await node?.evaluate((node) => node.isConnected)).toBe(true);
  await path.dispatchEvent("click", { button: 0 });
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await control.focus();
  await page.keyboard.press("Escape");
  await expect(control).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(host.locator(window)).toHaveCount(0);
});

for (const owned of ["radar-shape", "portal-shape", "style-filter"] as const) {
  test(`Radar ${owned} remains consumer-owned during entrance`, async ({ page }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`${url}/?motion&selection&${owned}`);
    const control = page
      .locator('[data-host="radar"]')
      .getByRole("button", { name: "Highlight Actual", exact: true });
    await expect(control.locator(window)).toHaveCount(0);
    await expect(control.locator('[data-kind-ui="radar-reveal"]')).toHaveCSS("opacity", "1");
    if (owned === "portal-shape")
      await expect(page.locator('[data-host-shape="portal"]').first()).toBeAttached();
    if (owned === "radar-shape")
      await expect(control.locator('[data-host-shape="radar"]').first()).toBeAttached();
  });
}
