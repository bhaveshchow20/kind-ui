import { expect, type Page, test } from "@playwright/test";

async function family(page: Page, name: string) {
  await page.getByRole("tab", { name: new RegExp(`^${name}(?:\\s|$)`) }).click();
  await page.locator(".chart-card").first().scrollIntoViewIfNeeded();
}

test("navigation, code modal and pending-install copy are keyboard accessible", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Bring your data\s*to life/);
  await expect(page.locator(".install-section")).not.toContainText("npm install");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("textbox", { name: "Search components" })).toBeFocused();
  await page.getByRole("textbox", { name: "Search components" }).fill("no-such-chart");
  await expect(page.getByText("No components found.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await family(page, "Line");
  await page.getByRole("button", { name: "View chart code" }).first().click();
  await expect(page.getByRole("region", { name: "Chart example code" })).toContainText(
    "@kind-ui/charts",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "View chart code" }).first()).toBeFocused();
});

for (const width of [320, 375, 768, 1280]) {
  test(`layout stays inside ${width}px and theme controls remain reachable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    await expect(page.getByRole("button", { name: "Search documentation" })).toBeVisible();
    await expect(page.locator(".wordmark")).toBeVisible();
    if (width <= 800) {
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
      await expect(page.locator("html")).toHaveClass(/dark/);
    } else {
      await page.getByRole("radio", { name: "Dark", exact: true }).check();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await page.getByRole("radio", { name: "System", exact: true }).check();
    }
    await family(page, "Histogram");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test("custom palette drafting waits for apply and does not open a native picker on focus", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Create custom palette" }).click();
  await expect(page.locator(".palette-editor")).toBeFocused();
  await page.getByRole("textbox", { name: "Hex for custom color 1" }).fill("#ff0033");
  await expect(page.getByRole("radio", { name: "Custom palette" })).toHaveCount(0);
  await page.getByRole("button", { name: "Use palette" }).click();
  await expect(page.getByRole("radio", { name: "Custom palette" })).toBeChecked();
  await page.getByRole("button", { name: "Edit custom palette" }).click();
  await expect(page.getByRole("textbox", { name: "Hex for custom color 1" })).toHaveValue(
    "#ff0033",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Edit custom palette" })).toBeFocused();
});

for (const name of ["Bar", "Histogram", "Box Plot", "Waterfall"]) {
  test(`${name} reveals visibly, replays, and settles on interruptions`, async ({ page }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("./");
    await family(page, name);
    await page.mouse.move(0, 0);
    await page.getByRole("button", { name: "Replay chart animations" }).click();
    const reveal = page
      .locator(".chart-card")
      .first()
      .locator('[data-kind-ui="bar-reveal"]')
      .first();
    await expect(reveal).toBeAttached();
    await page.clock.runFor(120);
    const early = Number(await reveal.getAttribute("height"));
    expect(early).toBeGreaterThan(0);
    await page.clock.runFor(250);
    expect(Number(await reveal.getAttribute("height"))).toBeGreaterThan(early);
    await page.clock.runFor(1400);
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Replay chart animations" }).click();
    await page.getByRole("button", { name: "Replay chart animations" }).click();
    await page.getByRole("switch", { name: "Motion", exact: true }).uncheck();
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
    await page.getByRole("switch", { name: "Motion", exact: true }).check();
    await page.getByRole("button", { name: "Replay chart animations" }).click();
    await page.setViewportSize({ width: 375, height: 900 });
    await page.clock.runFor(1400);
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
    await family(page, "Line");
    await family(page, name);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.runFor(100);
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
  });
}

test("replay preserves distribution legend selections", async ({ page }) => {
  await page.goto("./");
  await family(page, "Histogram");
  const legend = page
    .locator(".chart-card")
    .first()
    .locator('[data-kind-ui="chart-legend-button"]');
  await legend.click();
  await expect(legend).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Replay chart animations" }).click();
  await expect(legend).toHaveAttribute("aria-pressed", "false");
});

for (const name of ["Line", "Bar", "Histogram", "Box Plot"]) {
  test(`${name} keyboard tooltips and axis numbers remain inside the card`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    await family(page, name);
    const card = page.locator(".chart-card").first();
    const chart = card.getByRole("application").first();
    await chart.focus();
    await page.keyboard.press("ArrowRight");
    const tooltip = card.locator('[data-kind-ui="chart-tooltip"]').first();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(/\d/);
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expect
        .poll(async () =>
          card.locator(".recharts-yAxis text").evaluateAll((nodes) =>
            nodes.every((node) => {
              const bounds = node.getBoundingClientRect();
              const card = node.closest(".chart-card")?.getBoundingClientRect();
              if (!card) return false;
              return bounds.x >= card.x && bounds.right <= card.right;
            }),
          ),
        )
        .toBe(true);
    }
  });
}

test("clipboard denial leaves a readable recovery message", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard denied");
        },
      },
      configurable: true,
    });
  });
  await page.goto("./");
  await family(page, "Line");
  await page
    .getByRole("button", { name: /^Copy code for/ })
    .first()
    .click();
  await expect(page.locator(".copy-feedback").first()).toContainText("Could not copy");
});

test("animated tooltip final digits fit their value container", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./");
  await family(page, "Line");
  const card = page.locator(".chart-card").first();
  await card.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  const number = card.locator('[data-kind-ui="tooltip-number-final"]').first();
  await expect(number).toBeVisible();
  await expect
    .poll(async () =>
      number.evaluate((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const glyphs = range.getBoundingClientRect();
        const box = node.getBoundingClientRect();
        return (
          glyphs.width > 0 &&
          glyphs.height > 0 &&
          glyphs.x >= box.x - 1 &&
          glyphs.right <= box.right + 1 &&
          glyphs.y >= box.y - 1 &&
          glyphs.bottom <= box.bottom + 1
        );
      }),
    )
    .toBe(true);
});
