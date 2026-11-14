import { expect, type Page, test } from "@playwright/test";

async function family(page: Page, name: string) {
  if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
  await page.getByRole("tab", { name, exact: true }).click();
  await page.locator(".tile-open").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("navigation, code modal and installation are keyboard accessible", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
    "Interactive charts for React.js and Next.js, built on Recharts and Motion and ready for Codex, Claude, Gemini, Grok and your agents.",
  );
  await expect(page.locator(".install-section")).toContainText("npm install @kind-ui/charts");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("textbox", { name: "Search components" })).toBeFocused();
  await page.getByRole("textbox", { name: "Search components" }).fill("no-such-chart");
  await expect(page.getByText("No components found.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await family(page, "Line");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByRole("region", { name: "Chart example code" })).toContainText(
    "@kind-ui/charts",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".tile-open").first()).toBeFocused();
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

for (const name of ["Line", "Bar", "Histogram", "Box Plot"]) {
  test(`${name} keyboard tooltips and axis numbers remain inside the card`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    await family(page, name);
    const card = page.locator(".playground-preview .chart-card").first();
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
              const card = node.closest(".playground-preview .chart-card")?.getBoundingClientRect();
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
  await page.goto("./", { waitUntil: "networkidle" });
  await family(page, "Line");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page.getByRole("button", { name: "Copy code", exact: true }).first().click();
  await expect(page.locator(".playground-footer [role=status]")).toContainText("Could not copy");
});

test("animated tooltip final digits fit their value container", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("./", { waitUntil: "networkidle" });
  await family(page, "Line");
  const card = page.locator(".playground-preview .chart-card").first();
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

for (const width of [375, 1280]) {
  test(`package manager tabs copy their commands at ${width}px`, async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./", { waitUntil: "networkidle" });
    const install = page.getByRole("region", { name: "Install Kind UI Charts" });
    for (const manager of ["npm", "pnpm", "yarn", "bun"]) {
      const command = `${manager} ${manager === "npm" ? "install" : "add"} @kind-ui/charts`;
      await install.getByRole("tab", { name: manager, exact: true }).click();
      await expect(install.getByRole("tabpanel")).toContainText(command);
      await install.getByRole("button", { name: "Copy install command", exact: true }).click();
      await expect(install.getByRole("button", { name: "Install command copied" })).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(command);
    }
    const npm = install.getByRole("tab", { name: "npm", exact: true });
    await npm.click();
    await npm.focus();
    await page.keyboard.press("ArrowRight");
    await expect(install.getByRole("tab", { name: "pnpm", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.keyboard.press("End");
    await expect(install.getByRole("tab", { name: "bun", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const bounds = await install.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(width);
  });
}

test("package manager copy feedback ignores a write completed after switching tabs", async ({
  page,
}) => {
  await page.goto("./", { waitUntil: "networkidle" });
  const install = page.getByRole("region", { name: "Install Kind UI Charts" });
  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () =>
        new Promise<void>((resolve) => {
          Object.assign(window, { finishInstallCopy: resolve });
        }),
    });
  });
  await install.getByRole("button", { name: "Copy install command", exact: true }).click();
  await install.getByRole("tab", { name: "pnpm", exact: true }).click();
  await page.evaluate(() =>
    (window as unknown as Window & { finishInstallCopy: () => void }).finishInstallCopy(),
  );
  await expect(
    install.getByRole("button", { name: "Copy install command", exact: true }),
  ).toBeVisible();
  await expect(install.getByRole("button", { name: "Install command copied" })).toHaveCount(0);
});

for (const width of [375, 1280]) {
  test(`gallery legends stay inside their cards at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    for (const family of [
      "Bar",
      "Line",
      "Area",
      "Combo",
      "Pie",
      "Radar",
      "Activity",
      "Scatter",
      "Heatmap",
      "Waterfall",
      "Sankey",
      "Histogram",
      "Box Plot",
    ]) {
      await page.getByRole("tab", { name: family, exact: true }).click();
      const overflowing = await page
        .locator('.demo-grid .chart-card [data-kind-ui="chart-legend"]')
        .evaluateAll(
          (legends) =>
            legends.filter((legend) => {
              const card = legend.closest(".chart-card")?.getBoundingClientRect();
              if (!card) return true;
              const bounds = legend.getBoundingClientRect();
              return (
                bounds.bottom > card.bottom - 8 ||
                bounds.left < card.left ||
                bounds.right > card.right
              );
            }).length,
        );
      expect(overflowing, `${family} legend containment`).toBe(0);
    }
  });
}
