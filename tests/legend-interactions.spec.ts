import { expect, test } from "./browser";

for (const family of ["bar", "line", "area", "scatter", "radar", "pie", "radial"]) {
  test(`${family}: mark keyboard and legend share one persistent focus owner`, async ({ page }) => {
    await page.goto(
      `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
    );
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
    await expect(second).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(selected).toHaveText("none");
    await expect(scope.locator("[data-interaction-changes]")).toHaveText("4");
    await expect(scope.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
      "Highlight cleared.",
    );
  });
}

test("last eligible hide is rejected once; stale config does not count", async ({ page }) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
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
    await page.goto(
      `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
    );
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
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
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
  test(`${family} category hiding retains slots and keyed focus after reorder`, async ({
    page,
  }) => {
    await page.goto(
      `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
    );
    const scope = page.getByRole("region", { name: "Shared interactions" });
    await scope.getByLabel("Interaction family").selectOption(family);
    await scope.getByRole("button", { name: "Reorder identities" }).click();
    await expect(scope.locator("[data-interaction-selected]")).toHaveText("first");
    await scope.getByRole("button", { name: "Switch mode" }).click();
    await scope.getByRole("button", { name: "First", exact: true }).click();
    await expect(scope.locator(".recharts-pie-sector, .recharts-radial-bar-sector")).toHaveCount(2);
    await expect(scope.locator('[aria-hidden="true"][pointer-events="none"]')).not.toHaveCount(0);
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

test("persistent paint survives keyboard activation and inactive inspection", async ({ page }) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
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
  expect(await alpha(first)).toBeCloseTo(0.28);
  await scope.getByRole("heading").hover();
  expect(await alpha(first)).toBeCloseTo(0.28);
  await expect(scope.locator("[data-interaction-selected]")).toHaveText("second");
});

test("native pointer callback tuple runs first and veto preserves focus", async ({ page }) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
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
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
  const scope = page.getByRole("region", { name: "Shared interactions" });
  await scope.getByRole("button", { name: "Switch mode" }).click();
  await scope.getByRole("button", { name: "Toggle native hide" }).click();
  await scope.getByRole("button", { name: "First", exact: true }).click();
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("0");
  await expect(scope.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
    "At least one item must remain visible.",
  );
});

test("Pie hiding preserves angles and keeps original blue Cell", async ({ page }) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
  const scope = page.getByRole("region", { name: "Shared interactions" });
  await scope.getByLabel("Interaction family").selectOption("pie");
  await scope.getByRole("button", { name: "Switch mode" }).click();
  await scope.getByRole("button", { name: "First", exact: true }).click();
  const sector = scope.locator("[data-kind-ui=pie-sector]").nth(1);
  await expect(scope.locator("[data-kind-ui=pie-sector]")).toHaveCount(2);
  await expect(sector).toHaveAttribute("data-sector-span", "240");
  await expect(sector).toHaveAttribute("fill", "#0000ff");
  await expect(scope.getByRole("button", { name: "Toggle second", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("Sankey node/legend share focus, preserve identity payload, and include incident endpoints", async ({
  page,
}) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
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

test("legacy Scatter series-owned data keeps controlled visibility interactive", async ({
  page,
}) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
  const scope = page.getByRole("region", { name: "Legacy Scatter visibility" });
  const first = scope.getByRole("button", { name: "First", exact: true });
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await scope.getByRole("button", { name: "Second", exact: true }).click();
  await expect(scope.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
    "At least one item must remain visible.",
  );
});

test("one hidden duplicate cannot invalidate another available mark of the same identity", async ({
  page,
}) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
  const scope = page.getByRole("region", { name: "Duplicate series availability" });
  await scope.getByRole("button", { name: "First", exact: true }).click();
  await expect(scope.locator("[data-duplicate-changes]")).toHaveText("1");
  await expect(scope.getByRole("button", { name: "First", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await scope.getByRole("button", { name: "Second", exact: true }).click();
  await expect(scope.locator("[data-duplicate-changes]")).toHaveText("1");
  await expect(scope.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
    "At least one item must remain visible.",
  );
});

for (const family of ["pie", "radial"]) {
  test(`${family}: bound tooltip inspection preserves consumer shape`, async ({ page }) => {
    await page.goto(
      `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
    );
    const scope = page.getByRole("region", { name: "Shared interactions" });
    await scope.getByLabel("Interaction family").selectOption(family);
    await scope.getByRole("button", { name: "Toggle custom shape" }).click();
    const marks = scope.locator("[data-custom-sector=consumer]");
    await expect(marks).toHaveCount(2);
    const point = await marks.first().evaluate((node: SVGPathElement) => {
      const box = node.getBBox();
      const matrix = node.getScreenCTM();
      for (let x = box.x + 2; x < box.x + box.width; x += 3) {
        for (let y = box.y + 2; y < box.y + box.height; y += 3) {
          if (node.isPointInFill(new DOMPoint(x, y))) {
            const screen = new DOMPoint(x, y).matrixTransform(matrix ?? undefined);
            return { x: screen.x, y: screen.y };
          }
        }
      }
      throw new Error("No painted sector point");
    });
    await page.mouse.move(point.x, point.y);
    await expect(marks).toHaveCount(2);
    await expect(scope.locator("[data-interaction-selected]")).toHaveText("first");
    await expect(scope.locator("[data-interaction-changes]")).toHaveText("0");
  });
}

test("touch activation uses the same owner and emits one change per tap", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1000, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
  const scope = page.getByRole("region", { name: "Shared interactions" });
  const legend = scope.getByRole("button", { name: "Second", exact: true });
  await legend.tap();
  await expect(scope.locator("[data-interaction-selected]")).toHaveText("second");
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("1");
  await legend.tap();
  await expect(scope.locator("[data-interaction-selected]")).toHaveText("none");
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("2");
  await context.close();
});

test("configured LineChart owns config and shares focus through existing rootProps", async ({
  page,
}) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
  const scope = page.getByRole("region", { name: "Configured interactions" });
  await scope.getByRole("button", { name: "Second", exact: true }).click();
  await expect(scope.locator("[data-configured-selected]")).toHaveText("second");
  await expect(scope.locator("[data-configured-changes]")).toHaveText("1");
  const mark = scope.getByRole("button", { name: "Highlight Second", exact: true });
  await mark.focus();
  await page.keyboard.press("Enter");
  await expect(scope.locator("[data-configured-selected]")).toHaveText("none");
  await expect(scope.locator("[data-configured-changes]")).toHaveText("2");
});

for (const family of ["scatter-named", "scatter-namespace", "radar-element", "radar-function"]) {
  test(`${family}: inactive shared adapter retains first pointerdown target and custom dot lifetime`, async ({
    page,
  }) => {
    await page.goto(
      `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
    );
    const scope = page.getByRole("region", { name: `Native lifetime ${family}`, exact: true });
    const mark = scope
      .locator(family.startsWith("scatter") ? ".recharts-symbols" : ".recharts-radar-polygon path")
      .first();
    const identities = await scope
      .locator("[data-lifetime-dot]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-lifetime-dot")));
    const node = await mark.elementHandle();
    if (!node) throw new Error("Missing native target");
    await mark.dispatchEvent("pointerdown", { button: 0, pointerType: "mouse" });
    expect(await node.evaluate((element) => element.isConnected)).toBe(true);
    expect(
      await scope
        .locator("[data-lifetime-dot]")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-lifetime-dot"))),
    ).toEqual(identities);
    await mark.click();
    await expect(scope.locator("[data-lifetime-clicks]")).toHaveText("1");
  });
}
for (const family of ["scatter-namespace", "radar-function"]) {
  test(`${family}: active stable delegate uses current state and current consumer veto`, async ({
    page,
  }) => {
    await page.goto(
      `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
    );
    const scope = page.getByRole("region", {
      name: `Native lifetime ${family} active`,
      exact: true,
    });
    const mark = scope
      .locator(family.startsWith("scatter") ? ".recharts-symbols" : ".recharts-radar-polygon path")
      .first();
    await mark.hover();
    const node = await mark.elementHandle();
    if (!node) throw new Error("Missing native target");
    await page.mouse.down();
    expect(await node.evaluate((element) => element.isConnected)).toBe(true);
    await page.mouse.up();
    await expect(scope.locator("[data-lifetime-clicks]")).toHaveText("1");
    await expect(scope.locator("[data-lifetime-selected]")).toHaveText("first");
    await mark.click();
    await expect(scope.locator("[data-lifetime-selected]")).toHaveText("none");
    await expect(scope.locator("[data-lifetime-changes]")).toHaveText("2");
    await scope.getByRole("button", { name: "Toggle native veto" }).click();
    await mark.click();
    await expect(scope.locator("[data-lifetime-clicks]")).toHaveText("3");
    await expect(scope.locator("[data-lifetime-selected]")).toHaveText("none");
    await expect(scope.locator("[data-lifetime-changes]")).toHaveText("2");
    await scope.getByRole("button", { name: "Toggle native veto" }).click();
    await scope.getByRole("button", { name: "Toggle native synchronous change" }).click();
    await mark.click();
    await expect(scope.locator("[data-lifetime-clicks]")).toHaveText("4");
    await expect(scope.locator("[data-lifetime-selected]")).toHaveText("none");
    await expect(scope.locator("[data-lifetime-changes]")).toHaveText("3");
  });
}
for (const accessor of [false, true]) {
  test(`original Pie category survives Cell override, veto, reorder and filtering (${accessor ? "accessor" : "field"})`, async ({
    page,
  }) => {
    await page.goto(
      `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
    );
    const scope = page.getByRole("region", {
      name: `Cell identity ${accessor ? "accessor" : "field"}`,
      exact: true,
    });
    const second = scope.locator(
      '[data-interaction-focus-key="second"] [data-kind-ui="pie-sector"]',
    );
    await expect(second).toHaveAttribute("fill", "#e11d48");
    await second.click();
    await expect(scope.locator("[data-cell-clicks]")).toHaveText("1");
    await expect(scope.locator("[data-cell-payload]")).toHaveText("first");
    await expect(scope.locator("[data-cell-selected]")).toHaveText("second");
    const control = scope.getByRole("button", { name: "Highlight second", exact: true });
    await control.focus();
    await page.keyboard.press("Escape");
    await expect(scope.locator("[data-cell-selected]")).toHaveText("none");
    await control.focus();
    await page.keyboard.press("Enter");
    await expect(scope.locator("[data-cell-selected]")).toHaveText("second");
    await scope.getByRole("button", { name: "Veto Cell" }).click();
    await scope.locator('[data-interaction-focus-key="first"] [data-kind-ui="pie-sector"]').click();
    await expect(scope.locator("[data-cell-clicks]")).toHaveText("2");
    await expect(scope.locator("[data-cell-selected]")).toHaveText("second");
    await scope.getByRole("button", { name: "Reorder Cells" }).click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
    await scope.getByRole("button", { name: "Veto Cell" }).click();
    await scope.getByRole("button", { name: "Sync rows in series handler" }).click();
    await second.click();
    await expect(scope.locator("[data-cell-clicks]")).toHaveText("3");
    await expect(scope.locator("[data-cell-selected]")).toHaveText("none");
    await control.focus();
    await page.keyboard.press("Enter");
    await expect(scope.locator("[data-cell-selected]")).toHaveText("second");
    await scope.getByRole("button", { name: "Sync rows in series handler" }).click();
    await scope.getByRole("button", { name: "Sync rows in Cell handler" }).click();
    await second.click();
    await expect(scope.locator("[data-cell-clicks]")).toHaveText("4");
    await expect(scope.locator("[data-cell-selected]")).toHaveText("none");
    await control.focus();
    await page.keyboard.press("Enter");
    await expect(scope.locator("[data-cell-selected]")).toHaveText("second");
    await scope.getByRole("button", { name: "Filter first" }).click();
    await expect(scope.locator('[data-kind-ui="pie-sector"]')).toHaveCount(2);
    await expect(control).toHaveAttribute("aria-pressed", "true");
    await expect(second).toHaveAttribute("fill", "#e11d48");
    await expect(second).toHaveAttribute("data-sector-span", "120");
  });
}
test("Root-derived Area hide retains restore control while last-visible protection remains", async ({
  page,
}) => {
  await page.goto(
    `http://127.0.0.1:${4193 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}/?interactions`,
  );
  const scope = page.getByRole("region", { name: "Shared interactions" });
  await scope.getByLabel("Interaction family").selectOption("area");
  await scope.getByRole("button", { name: "Switch mode" }).click();
  const first = scope.getByRole("button", { name: "First", exact: true });
  const second = scope.getByRole("button", { name: "Second", exact: true });
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "false");
  await second.click();
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("1");
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(scope.locator("[data-interaction-changes]")).toHaveText("2");
});
