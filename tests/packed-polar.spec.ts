import { expect, type Locator, type Page, test } from "@playwright/test";

const url = "http://127.0.0.1:4177";
const radarPath = ".recharts-radar-polygon";
const radialPath = ".recharts-radial-bar-sector";
async function paths(scope: Locator, selector: string) {
  return scope
    .locator(selector)
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("d") ?? node.getAttribute("points")),
    );
}
async function geometry(page: Page) {
  const native = page.locator('[data-host="native"]');
  for (const [host, selector] of [
    ["radar", radarPath],
    ["radial", radialPath],
  ] as const) {
    await expect
      .poll(async () => paths(page.locator(`[data-host="${host}"]`), selector))
      .toEqual(await paths(native, selector));
    expect((await paths(native, selector)).join()).not.toMatch(/NaN|Infinity/);
  }
}
async function opacity(scope: Locator) {
  return scope.evaluate((node) => Number(getComputedStyle(node).opacity));
}

test("packed polar geometry matches native axes, domains, ordering, resize and zero values", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await expect(page.locator('[data-host="radar"] .recharts-radar')).toHaveCount(2);
  await geometry(page);
  for (const name of ["Domain", "Geometry", "Resize", "Update", "Reorder", "Zero"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await geometry(page);
  }
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(page.locator('[data-host="radial"] .recharts-radial-bar-sector')).toHaveCount(0);
  await geometry(page);
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await geometry(page);
  expect(errors).toEqual([]);
  await expect(page.locator("svg[data-host-ref=attached]")).toHaveCount(2);
  await expect(page.locator('svg[data-ref-count="1"]')).toHaveCount(2);
});

test("series visibility, native hide and keyboard tooltip retain registered identities", async ({
  page,
}) => {
  await page.goto(url);
  for (const kind of ["radar", "radial"]) {
    const host = page.locator(`[data-host="${kind}"]`);
    const chart = host.locator('svg[role="application"]');
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(host.locator('[data-kind-ui="chart-tooltip"]')).toBeVisible();
    await expect(
      host.locator('[data-series="alias"][data-kind-ui="chart-tooltip-item"]'),
    ).toContainText("Target");
    await expect(host.locator('[data-kind-ui="chart-tooltip"]')).toContainText("pts");
    await host.getByRole("button", { name: "Actual", exact: true }).click();
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      host.locator('[data-kind-ui="chart-tooltip-item"][data-series="value"]'),
    ).toHaveCount(0);
    await host.getByRole("button", { name: "Target", exact: true }).click();
    await expect(host.locator(kind === "radar" ? ".recharts-radar" : radialPath)).toHaveCount(0);
    await host.getByRole("button", { name: "Actual", exact: true }).click();
    await host.getByRole("button", { name: "Target", exact: true }).click();
    await page.getByRole("button", { name: "Native hide", exact: true }).click();
    await expect(
      host.locator(
        kind === "radar"
          ? ".recharts-radar.kind-ui-radar-series"
          : ".recharts-area.kind-ui-radial-bar-series",
      ),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Native hide", exact: true }).click();
  }
});

test("native radial Cell styling, labels, click handlers and custom shapes remain available", async ({
  page,
}) => {
  await page.goto(url);
  const radial = page.locator('[data-host="radial"]');
  await expect(radial.locator('.recharts-radial-bar-sector[fill="#27806a"]')).toHaveCount(1);
  await expect(radial.locator(".recharts-label-list text")).toHaveCount(4);
  await radial.locator(radialPath).first().dispatchEvent("click");
  await expect(page.locator("output")).toContainText("Clicks 1");
  await page.getByRole("button", { name: "Shape", exact: true }).click();
  await expect(radial.locator('[data-host-shape="radial"]')).toHaveCount(3);
  await page.getByRole("button", { name: "Content", exact: true }).click();
  await radial.locator('svg[role="application"]').focus();
  await page.keyboard.press("ArrowRight");
  await radial
    .getByRole("button", { name: "Content count 0" })
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(radial.getByRole("button", { name: "Content count 1" })).toBeVisible();
  await expect(page.locator("svg[data-host-ref=attached]")).toHaveCount(2);
  await expect(page.locator('svg[data-ref-count="1"]')).toHaveCount(2);
});

test("Motion entrance preserves native geometry and stops on interruption/reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?motion`);
  const marks = page.locator('[data-host="radar"] [data-kind-ui="radar-reveal"]').first();
  await expect.poll(() => opacity(marks)).toBeLessThan(0.95);
  await geometry(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => opacity(marks)).toBe(1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => opacity(marks)).toBe(1);
  await page.reload();
  await expect.poll(() => opacity(marks)).toBeLessThan(0.95);
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect.poll(() => opacity(marks)).toBe(1);
  await geometry(page);
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await page.getByRole("button", { name: "Motion", exact: true }).click();
  await expect.poll(() => opacity(marks)).toBe(1);
});

test("pointer interruption finishes entrance; reduced mode renders full geometry immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${url}/?motion`);
  const host = page.locator('[data-host="radar"]');
  const mark = host.locator('[data-kind-ui="radar-reveal"]').first();
  await expect.poll(() => opacity(mark)).toBeLessThan(0.95);
  await host.locator("svg").hover({ position: { x: 260, y: 90 } });
  await expect.poll(() => opacity(mark)).toBe(1);
  await expect(page.locator("output")).not.toContainText("moves 0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect.poll(() => opacity(mark)).toBe(1);
  await geometry(page);
});

for (const strict of [false, true]) {
  test(`radial and radar Motion entrance resumes effect replay (StrictMode=${strict})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`http://127.0.0.1:4178/?motion${strict ? "&strict" : ""}`);
    for (const kind of ["radar", "radial-bar"]) {
      const mark = page.locator(`[data-kind-ui="${kind}-reveal"]`).first();
      await expect.poll(() => opacity(mark)).toBeLessThan(0.95);
    }
    await page.locator('[data-host="radial"] svg').focus();
    await page.keyboard.press("ArrowRight");
    for (const kind of ["radar", "radial-bar"]) {
      // A chart's interruption affects its own marks; reduced motion finishes both.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect
        .poll(() => opacity(page.locator(`[data-kind-ui="${kind}-reveal"]`).first()))
        .toBe(1);
    }
  });
}

test("range Radar preserves native baseline geometry", async ({ page }) => {
  await page.goto(`${url}/?range`);
  await geometry(page);
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await geometry(page);
});

test("controlled non-string identity has an actionable error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${url}/?invalid`);
  await expect
    .poll(() => errors.join())
    .toContain("requires seriesKey for controlled non-string dataKey");
});
