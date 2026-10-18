import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?component=thinking-indicator");
});

test("thinking label updates immediately in a stable region while elapsed remains ordinary text", async ({
  page,
}) => {
  const root = page.getByTestId("thinking");
  const label = root.getByRole("status");
  const elapsed = root.locator('[data-slot="thinking-indicator-elapsed"]');
  const originalLabel = await label.elementHandle();
  expect(originalLabel).not.toBeNull();
  await expect(root).not.toHaveAttribute("role");
  await expect(root).not.toHaveAttribute("aria-live");
  await expect(label).toHaveAttribute("aria-live", "polite");
  await expect(label).toHaveText("Reviewing sources");
  await expect(elapsed).toHaveText("0s");
  expect(
    await elapsed.evaluate((element) => element.closest('[role="status"], [aria-live]')),
  ).toBeNull();

  await page.getByRole("button", { name: "Update elapsed", exact: true }).click();
  await expect(elapsed).toHaveText("12s");
  await expect(label).toHaveText("Reviewing sources");
  expect(
    await originalLabel?.evaluate(
      (element) => element === document.querySelector('[data-testid="thinking"] [role="status"]'),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Update label", exact: true }).click();
  await expect(label).toHaveText("Comparing results");
  await expect(label).toHaveAttribute("aria-label", "Comparing results");
  await page.getByRole("button", { name: "Toggle label announcements" }).click();
  await expect(label).toHaveAttribute("aria-live", "off");
  await page.getByRole("button", { name: "Clear elapsed", exact: true }).click();
  await expect(elapsed).toHaveCount(1);
  await expect(elapsed).toHaveText("");
  await page.getByRole("button", { name: "Omit elapsed", exact: true }).click();
  await expect(elapsed).toHaveCount(0);
  expect(
    await originalLabel?.evaluate(
      (element) => element === document.querySelector('[data-testid="thinking"] [role="status"]'),
    ),
  ).toBe(true);
});

test("thinking indicator forwards root refs, native props and composed handlers", async ({
  page,
}) => {
  const root = page.getByTestId("thinking");
  await page.getByRole("button", { name: "Inspect root ref", exact: true }).click();
  await expect(page.getByTestId("ref-tag")).toHaveText("DIV");
  await expect(root).toHaveAttribute("id", "host-thinking");
  await expect(root).toHaveAttribute("title", "Host thinking");
  await expect(root).toHaveClass(/host-thinking-class/);
  await expect(root).toHaveCSS("outline-color", "rgb(1, 2, 3)");
  await root.focus();
  await expect(root).toBeFocused();
  await root.click();
  await expect(page.getByTestId("clicks")).toHaveText("1");
  const composed = page.getByTestId("composed-thinking");
  expect(await composed.evaluate((element) => element.tagName)).toBe("BUTTON");
  await composed.click();
  await expect(page.getByTestId("clicks")).toHaveText("2");
  await expect(page.getByTestId("render-clicks")).toHaveText("1");
  await composed.focus();
  await composed.press("Space");
  await expect(page.getByTestId("clicks")).toHaveText("3");
  await expect(page.getByTestId("render-clicks")).toHaveText("2");
  await composed.press("Enter");
  await expect(page.getByTestId("clicks")).toHaveText("4");
  await expect(page.getByTestId("render-clicks")).toHaveText("3");
  expect(await page.getByTestId("function-thinking").evaluate((element) => element.tagName)).toBe(
    "ARTICLE",
  );
});

test("thinking indicator wraps long supplied text at narrow widths", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole("button", { name: "Long content", exact: true }).click();
  const root = page.getByTestId("thinking");
  for (const locator of [
    root,
    root.getByRole("status"),
    root.locator('[data-slot="thinking-indicator-elapsed"]'),
  ]) {
    const geometry = await locator.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      overflow: getComputedStyle(element).textOverflow,
    }));
    expect(geometry.width).toBeLessThanOrEqual(220);
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(geometry.overflow).not.toBe("ellipsis");
  }
});

test("thinking indicator never invents elapsed time or activity", async ({ page }) => {
  await page.clock.install();
  await page.clock.runFor(60_000);
  await expect(page.getByTestId("thinking").getByRole("status")).toHaveText("Reviewing sources");
  await expect(
    page.getByTestId("thinking").locator('[data-slot="thinking-indicator-elapsed"]'),
  ).toHaveText("0s");
  await expect(page.getByTestId("thinking").getByRole("status")).toHaveCSS(
    "animation-name",
    "none",
  );
});

for (const initialPreference of ["no-preference", "reduce"] as const) {
  test(`thinking dot respects initial ${initialPreference}, live preferences and pulse opt-out`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: initialPreference });
    await page.reload();
    const root = page.getByTestId("thinking");
    const dot = root.locator('[data-slot="status"] > span[aria-hidden="true"]');
    const label = root.getByRole("status");
    const elapsed = root.locator('[data-slot="thinking-indicator-elapsed"]');
    const staticDot = page
      .getByTestId("composed-thinking")
      .locator('[data-slot="status"] > span[aria-hidden="true"]');
    const originalLabel = await label.elementHandle();

    for (const reducedMotion of [initialPreference, "reduce", "no-preference", "reduce"] as const) {
      await page.emulateMedia({ reducedMotion });
      if (reducedMotion === "reduce") {
        await expect(dot).toHaveCSS("animation-name", "none");
      } else {
        await expect(dot).toHaveCSS("animation-name", "pulse");
      }
      await expect(staticDot).toHaveCSS("animation-name", "none");
      await expect(label).toHaveCSS("animation-name", "none");
      await expect(elapsed).toHaveCSS("animation-name", "none");
    }

    await page.getByRole("button", { name: "Update elapsed", exact: true }).click();
    await expect(elapsed).toHaveText("12s");
    await expect(label).toHaveText("Reviewing sources");
    expect(
      await originalLabel?.evaluate(
        (element) => element === document.querySelector('[data-testid="thinking"] [role="status"]'),
      ),
    ).toBe(true);
  });
}
