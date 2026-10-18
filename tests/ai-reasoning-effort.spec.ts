import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?component=reasoning-effort");
});

test("effort buttons request controlled keys once for pointer, Enter, Space and reactivation", async ({
  page,
}) => {
  const root = page.getByTestId("effort");
  const quick = root.getByRole("button", { name: "Quick" });
  const thorough = root.getByRole("button", { name: "Thorough" });
  await expect(root.getByRole("group", { name: "Thinking" })).toBeVisible();
  await quick.focus();
  await page.keyboard.press("Tab");
  await expect(thorough).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("effort-requests")).toHaveText("high");
  await expect(quick).toHaveAttribute("aria-pressed", "true");
  await expect(thorough).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(page.getByTestId("effort-requests")).toHaveText("high,high");
  await quick.click();
  await expect(page.getByTestId("effort-requests")).toHaveText("high,high,low");
  await expect(page.getByTestId("effort-submits")).toHaveText("0");
  await expect(quick).toHaveAttribute("type", "button");
  await page.getByRole("button", { name: "Host selects high", exact: true }).click();
  await expect(thorough).toHaveAttribute("aria-pressed", "true");
  await expect(root.getByRole("meter")).toHaveAttribute("aria-valuetext", "0 / 100 used");
});

test("effort respects disabled and prevented actions and keeps native props and refs", async ({
  page,
}) => {
  const root = page.getByTestId("effort");
  const quick = root.getByRole("button", { name: "Quick" });
  await page.getByRole("button", { name: "Toggle prevent activation", exact: true }).click();
  await quick.click();
  await expect(page.getByTestId("effort-requests")).toHaveText("");
  await page.getByRole("button", { name: "Toggle prevent activation", exact: true }).click();
  await quick.click();
  await expect(page.getByTestId("effort-requests")).toHaveText("low");
  await expect(page.getByTestId("effort-clicks")).toHaveText("2");
  await page.getByRole("button", { name: "Toggle disabled", exact: true }).click();
  await expect(quick).toBeDisabled();
  await quick.evaluate((element: HTMLButtonElement) => element.click());
  await expect(page.getByTestId("effort-requests")).toHaveText("low");
  await expect(quick).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Inspect effort ref", exact: true }).click();
  await expect(page.getByTestId("effort-ref")).toHaveText("DIV");
  await expect(root).toHaveAttribute("id", "host-effort");
  await expect(root).toHaveAttribute("title", "Host effort");
  await expect(root).toHaveClass(/host-effort-class/);
  await expect(root).toHaveCSS("outline-color", "rgb(1, 2, 3)");
  await root.focus();
  await expect(root).toBeFocused();
});

test("effort retains focused keys across reorder and has static labels without actions", async ({
  page,
}) => {
  const root = page.getByTestId("effort");
  const quick = root.getByRole("button", { name: "Quick" });
  const original = await quick.elementHandle();
  await quick.focus();
  await page
    .getByRole("button", { name: "Reverse levels", exact: true })
    .evaluate((element: HTMLButtonElement) => element.click());
  await expect(quick).toBeFocused();
  expect(
    await original?.evaluate(
      (element) =>
        element === document.querySelector('[data-testid="effort"] button[aria-pressed="true"]'),
    ),
  ).toBe(true);
  await expect(root.getByRole("button").first()).toHaveText("Thorough");
  await page.getByRole("button", { name: "Toggle readonly", exact: true }).click();
  await expect(root.getByRole("button")).toHaveCount(0);
  await expect(root.locator('[aria-current="true"]')).toHaveText("Quick");
  const staticRoot = page.getByTestId("static-effort");
  await expect(staticRoot.getByRole("button")).toHaveCount(0);
  await expect(staticRoot.locator('[aria-current="true"]')).toHaveText("Thorough");
  await expect(staticRoot.getByRole("meter", { name: "Readonly budget used" })).toHaveAttribute(
    "aria-valuenow",
    "0.5",
  );
});

test("effort uses bounded consumption meters and retains actual extreme values", async ({
  page,
}) => {
  const root = page.getByTestId("effort");
  const meter = root.getByRole("meter");
  await expect(meter).toHaveAttribute("aria-valuenow", "0");
  for (const [button, now, text] of [
    ["Over budget", "1", "150 / 10 used"],
    ["Large equal", "1", "1e+308 / 1e+308 used"],
    ["Extreme overrun", "1", "1e+308 / 5e-324 used"],
    ["Tiny spend", "0", "5e-324 / 1e+308 used"],
  ] as const) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(meter).toHaveAttribute("aria-valuenow", now);
    await expect(meter).toHaveAttribute("aria-valuemax", "1");
    await expect(meter).toHaveAttribute("aria-valuetext", text);
    await expect(root.locator('[data-slot="reasoning-effort-usage"]')).toHaveText(text);
    expect(
      await root.evaluate(
        (element) => element.innerHTML.includes("NaN") || element.innerHTML.includes("Infinity"),
      ),
    ).toBe(false);
    const fill = root.locator('[data-slot="usage-bar-fill"]');
    expect(
      await fill.evaluate((element) => Number.isFinite(element.getBoundingClientRect().width)),
    ).toBe(true);
  }
  await expect(root.getByRole("progressbar")).toHaveCount(0);
  await expect(root.getByText(/complete/i)).toHaveCount(0);
});

test("effort omits unavailable meters and never chooses a fallback", async ({ page }) => {
  const root = page.getByTestId("effort");
  await page.getByRole("button", { name: "Unknown selection", exact: true }).click();
  await expect(root.getByRole("meter")).toHaveCount(0);
  await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);
  await expect(root.getByText(/Usage unavailable/)).toBeVisible();
  for (const button of ["No budget", "Invalid budget", "Invalid spend", "Empty levels"]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(root.getByRole("meter")).toHaveCount(0);
    await expect(root.locator('[data-slot="reasoning-effort-unavailable"]')).toBeVisible();
    await expect(root).not.toContainText(/NaN|Infinity/);
  }
});

test("effort labels and counts wrap within narrow layouts in forced colors", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ forcedColors: "active" });
  await page.getByRole("button", { name: "Long labels", exact: true }).click();
  const root = page.getByTestId("effort");
  for (const target of [root, ...(await root.getByRole("button").all())]) {
    expect(await target.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
      true,
    );
    expect(
      await target.evaluate((element) => element.getBoundingClientRect().width),
    ).toBeLessThanOrEqual(220);
  }
  await page.getByRole("button", { name: "Large equal", exact: true }).click();
  await expect(root.getByRole("meter")).toBeVisible();
  expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
});

test("effort fill transitions only when enabled and normal motion is preferred", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const root = page.getByTestId("animated-effort");
  const fill = root.locator('[data-slot="usage-bar-fill"]');
  const meter = root.getByRole("meter");
  await expect(fill).not.toHaveCSS("transition-property", "width");
  await page.getByRole("button", { name: "Toggle effort animation", exact: true }).click();
  await expect(fill).toHaveCSS("transition-property", "width");
  await expect(fill).toHaveCSS("transition-duration", "0.15s");
  await page.getByRole("button", { name: "Over budget", exact: true }).click();
  await expect(meter).toHaveAttribute("aria-valuenow", "1");
  await expect(meter).toHaveAttribute("aria-valuetext", "150 / 10 used");
  await expect(root.locator('[data-slot="reasoning-effort-usage"]')).toHaveText("150 / 10 used");
  await page.getByRole("button", { name: "Host selects high", exact: true }).click();
  await expect(root.getByRole("button", { name: "Thorough" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(meter).toHaveAttribute("aria-valuetext", "150 / 100 used");
  await root.getByRole("button", { name: "Quick" }).click();
  await expect(page.getByTestId("effort-requests")).toHaveText("low");
  await expect(root.getByRole("button", { name: "Thorough" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  for (const [button, now, valueText] of [
    ["Tiny spend", "0", "5e-324 / 1e+308 used"],
    ["Large equal", "1", "1e+308 / 1e+308 used"],
    ["Extreme overrun", "1", "1e+308 / 5e-324 used"],
  ] as const) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(meter).toHaveAttribute("aria-valuenow", now);
    await expect(meter).toHaveAttribute("aria-valuetext", valueText);
    expect(await root.evaluate((element) => /NaN|Infinity/.test(element.innerHTML))).toBe(false);
  }
  await page.getByRole("button", { name: "Toggle effort animation", exact: true }).click();
  await expect(fill).not.toHaveCSS("transition-property", "width");
});

test("effort initial and live reduced motion disable decorative fill transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const root = page.getByTestId("animated-effort");
  const fill = root.locator('[data-slot="usage-bar-fill"]');
  await page.getByRole("button", { name: "Toggle effort animation", exact: true }).click();
  await expect(fill).toHaveCSS("transition-property", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(fill).toHaveCSS("transition-property", "width");
  await expect(fill).toHaveCSS("transition-duration", "0.15s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(fill).toHaveCSS("transition-property", "none");
  await page.getByRole("button", { name: "Large equal", exact: true }).click();
  await expect(root.getByRole("meter")).toHaveAttribute("aria-valuetext", "1e+308 / 1e+308 used");
  expect(
    await fill.evaluate((element) => Number.isFinite(element.getBoundingClientRect().width)),
  ).toBe(true);
});
