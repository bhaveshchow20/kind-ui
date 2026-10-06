import { expect, test } from "./browser";

for (const family of ["bar", "line", "area", "scatter", "radar", "pie", "radial"]) {
  test(`${family}: mark keyboard and legend share one persistent focus owner`, async ({ page }) => {
    await page.goto("http://127.0.0.1:4193");
    const scope = page.getByRole("region", { name: "Shared interactions" });
    await scope.getByLabel("Interaction family").selectOption(family);
    const selected = scope.locator("[data-interaction-selected]");
    await expect(selected).toHaveText("first");
    const second =
      family === "pie" || family === "radial"
        ? scope.getByRole("button", { name: "Highlight second", exact: true })
        : scope.getByRole("button", { name: "Highlight Second", exact: true });
    await second.focus();
    await page.keyboard.press("Enter");
    await expect(selected).toHaveText("second");
    await expect(scope.locator("[data-interaction-changes]")).toHaveText("1");
    await scope.getByRole("button", { name: "Second", exact: true }).click();
    await expect(selected).toHaveText("none");
    await expect(scope.locator("[data-interaction-changes]")).toHaveText("2");
    await second.focus();
    await page.keyboard.press("Space");
    await expect(selected).toHaveText("second");
    await page.keyboard.press("Escape");
    await expect(selected).toHaveText("none");
    await expect(scope.locator("[data-interaction-changes]")).toHaveText("4");
    await expect(scope.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
      "Highlight cleared.",
    );
  });
}

test("last eligible hide is rejected once; stale config does not count", async ({ page }) => {
  await page.goto("http://127.0.0.1:4193");
  const scope = page.getByRole("region", { name: "Shared interactions" });
  await scope.getByRole("button", { name: "Switch mode" }).click();
  await scope.getByRole("button", { name: "First", exact: true }).click();
  await scope.getByRole("button", { name: "Second", exact: true }).click();
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("1");
  await expect(scope.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
    "At least one item must remain visible.",
  );
  await expect(scope.getByRole("button", { name: "Second", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

for (const controlled of [false, true]) {
  test(`${controlled ? "controlled restores" : "uncontrolled clears"} invalid IDs without change events`, async ({
    page,
  }) => {
    await page.goto("http://127.0.0.1:4193");
    const scope = page.getByRole("region", { name: "Shared interactions" });
    if (controlled) await scope.getByRole("button", { name: "Switch owner" }).click();
    await scope.getByRole("button", { name: "Remove first identity" }).click();
    await expect(scope.locator("[data-interaction-selected]")).toHaveText("none");
    await scope.getByRole("button", { name: "Remove first identity" }).click();
    await expect(scope.locator("[data-interaction-selected]")).toHaveText(
      controlled ? "first" : "none",
    );
    await expect(scope.locator("[data-interaction-changes]")).toHaveText("0");
  });
}

test("consumer handler, before-hook and Escape can veto; hover never changes persistent focus", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4193");
  const scope = page.getByRole("region", { name: "Shared interactions" });
  const selected = scope.locator("[data-interaction-selected]");
  await scope.getByRole("button", { name: "Second", exact: true }).hover();
  await expect(selected).toHaveText("first");
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("0");
  await scope.getByRole("button", { name: "Toggle consumer veto" }).click();
  await scope.getByRole("button", { name: "Second", exact: true }).click();
  await scope.getByRole("button", { name: "First", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(selected).toHaveText("first");
  await scope.getByRole("button", { name: "Toggle consumer veto" }).click();
  await scope.getByRole("button", { name: "Toggle before veto" }).click();
  await scope.getByRole("button", { name: "Second", exact: true }).click();
  await expect(selected).toHaveText("first");
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("0");
  await scope.getByRole("button", { name: "Toggle before veto" }).click();
  await scope.getByRole("button", { name: "Toggle transient emphasis" }).click();
  await scope.getByRole("button", { name: "Second", exact: true }).click();
  await expect(selected).toHaveText("second");
});

for (const family of ["pie", "radial"]) {
  test(`${family} category hiding removes rows and retains keyed focus after reorder`, async ({
    page,
  }) => {
    await page.goto("http://127.0.0.1:4193");
    const scope = page.getByRole("region", { name: "Shared interactions" });
    await scope.getByLabel("Interaction family").selectOption(family);
    await scope.getByRole("button", { name: "Reorder identities" }).click();
    await expect(scope.locator("[data-interaction-selected]")).toHaveText("first");
    await scope.getByRole("button", { name: "Switch mode" }).click();
    await scope.getByRole("button", { name: "First", exact: true }).click();
    await expect(scope.locator(".recharts-pie-sector, .recharts-radial-bar-sector")).toHaveCount(1);
    await scope.getByRole("button", { name: "First", exact: true }).click();
    await expect(scope.locator(".recharts-pie-sector, .recharts-radial-bar-sector")).toHaveCount(2);
  });
}

async function alpha(locator: import("@playwright/test").Locator) {
  return locator.evaluate((node) => {
    let opacity = 1;
    for (
      let current: Element | null = node;
      current instanceof SVGElement;
      current = current.parentElement
    )
      opacity *= Number(getComputedStyle(current).opacity);
    return opacity;
  });
}

test("persistent paint survives keyboard activation with transient emphasis disabled; inspection restores it", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4193");
  const scope = page.getByRole("region", { name: "Shared interactions" });
  await scope.getByRole("button", { name: "Toggle transient emphasis" }).click();
  const first = scope.locator(".recharts-bar-rectangle path").first();
  const secondControl = scope.getByRole("button", { name: "Highlight Second", exact: true });
  await secondControl.focus();
  await page.keyboard.press("Enter");
  expect(await alpha(first)).toBeCloseTo(0.28);
  await scope.getByRole("button", { name: "Toggle transient emphasis" }).click();
  const firstLegend = scope.getByRole("button", { name: "First", exact: true });
  await firstLegend.hover();
  expect(await alpha(first)).toBe(1);
  await scope.getByRole("heading").hover();
  expect(await alpha(first)).toBeCloseTo(0.28);
  await expect(scope.locator("[data-interaction-selected]")).toHaveText("second");
});

test("native pointer callback tuple runs first and veto preserves focus", async ({ page }) => {
  await page.goto("http://127.0.0.1:4193");
  const scope = page.getByRole("region", { name: "Shared interactions" });
  await scope.getByRole("button", { name: "Toggle consumer veto" }).click();
  const mark = scope
    .locator("[data-kind-ui=series-interaction][data-series=second] .recharts-bar-rectangle path")
    .first();
  await mark.click();
  await expect(scope.locator("[data-interaction-clicks]")).toHaveText("1");
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("0");
  await scope.getByRole("button", { name: "Toggle consumer veto" }).click();
  await mark.click();
  await expect(scope.locator("[data-interaction-clicks]")).toHaveText("2");
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("1");
  await expect(scope.locator("[data-interaction-selected]")).toHaveText("second");
});

test("native-hidden peers cannot permit hiding the last painted series", async ({ page }) => {
  await page.goto("http://127.0.0.1:4193");
  const scope = page.getByRole("region", { name: "Shared interactions" });
  await scope.getByRole("button", { name: "Switch mode" }).click();
  await scope.getByRole("button", { name: "Toggle native hide" }).click();
  await scope.getByRole("button", { name: "First", exact: true }).click();
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("0");
  await expect(scope.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
    "At least one item must remain visible.",
  );
});

test("Pie filtering re-normalizes full arc and keeps original blue Cell", async ({ page }) => {
  await page.goto("http://127.0.0.1:4193");
  const scope = page.getByRole("region", { name: "Shared interactions" });
  await scope.getByLabel("Interaction family").selectOption("pie");
  await scope.getByRole("button", { name: "Switch mode" }).click();
  await scope.getByRole("button", { name: "First", exact: true }).click();
  const sector = scope.locator("[data-kind-ui=pie-sector]");
  await expect(sector).toHaveCount(1);
  await expect(sector).toHaveAttribute("data-sector-span", "360");
  await expect(sector).toHaveAttribute("fill", "#0000ff");
  await expect(scope.getByRole("button", { name: "Toggle second", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("Sankey node/legend share focus, preserve identity payload, and include incident endpoints", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4193");
  const scope = page.getByRole("region", { name: "Shared Sankey focus" });
  const third = scope.locator("[data-kind-ui=sankey-focus-mark][data-node=third]");
  const first = scope.locator("[data-kind-ui=sankey-focus-mark][data-node=first]");
  expect(await alpha(third.locator("rect"))).toBeCloseTo(0.28);
  await third.locator("rect").click();
  await expect(scope.locator("[data-interaction-selected]")).toHaveText("third");
  await expect(scope.locator("[data-sankey-payload]")).toHaveText("node/third/click");
  await expect(scope.locator("[data-sankey-changes]")).toHaveText("1");
  await scope.locator("[data-sankey-changes]").hover();
  expect(await alpha(first.locator("rect"))).toBeCloseTo(0.28);
  expect(
    await alpha(scope.locator("[data-kind-ui=sankey-focus-mark][data-node=fourth] rect")),
  ).toBe(1);
  await scope.getByRole("button", { name: "Third", exact: true }).click();
  await expect(scope.locator("[data-interaction-selected]")).toHaveText("none");
  await expect(scope.locator("[data-sankey-changes]")).toHaveText("2");
});
