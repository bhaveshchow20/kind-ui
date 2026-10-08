import { expect, test } from "./browser";

test("gallery shows public recipe variants and defaults to motion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/showcase.html");
  await expect(page.getByRole("heading", { name: "Area charts" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Motion", exact: true })).toBeChecked();
  await expect(page.locator(".showcase")).toHaveAttribute("data-motion", "on");
  await expect(page.locator(".example-card")).toHaveCount(6);
  await expect(page.locator('[data-kind-ui="chart-legend"]')).toHaveCount(6);
  await expect(page.getByText(/draft|invented|with context/i)).toHaveCount(0);
  for (const [family, count] of [
    ["Bar", 6],
    ["Line", 8],
    ["Pie", 2],
    ["Radar", 4],
    ["Radial", 4],
  ] as const) {
    await page.getByRole("tab", { name: family, exact: true }).click();
    await expect(page.locator(".example-card")).toHaveCount(count);
    await expect(page.locator(".recharts-surface")).toHaveCount(count);
    await expect(page.locator('[data-kind-ui="chart-legend"]')).toHaveCount(count);
  }
  await page.getByRole("button", { name: "Green palette" }).click();
  await expect(
    page.locator('[data-example="gallery"] .recharts-radial-bar-sector').first(),
  ).toHaveCSS("fill", "rgb(57, 133, 109)");
  expect(errors).toEqual([]);
});

test("color and finish stay independent without remounting or replaying entrance", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/showcase.html");
  await expect(page.locator("[data-area-reveal]")).toHaveCount(0);
  const chart = page.locator(".example-card").first().locator('[data-kind-ui="line-frame"]');
  await chart.evaluate((node) => {
    node.setAttribute("data-gallery-identity", "preserved");
  });
  await page.getByRole("button", { name: "Green palette" }).click();
  await expect(chart).toHaveAttribute("data-gallery-identity", "preserved");
  await expect(page.locator("[data-area-reveal]")).toHaveCount(0);
  await page.getByRole("radio", { name: "Clay", exact: true }).check();
  await page.getByLabel("Custom chart color").fill("#c53662");
  await expect(page.getByRole("radio", { name: "Clay", exact: true })).toBeChecked();
  await expect(page.locator(".showcase")).toHaveCSS("--chart-1", "#c53662");
  await expect(chart).toHaveAttribute("data-gallery-identity", "preserved");
  await expect(page.locator("[data-area-reveal]")).toHaveCount(0);
});

test("keyboard tabs, controlled legend, code dialog and reduced motion work", async ({ page }) => {
  await page.goto("/showcase.html");
  const area = page.getByRole("tab", { name: "Area", exact: true });
  await area.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Bar", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  const comparison = page.locator('[data-example="comparison"]');
  const previous = comparison.getByRole("button", { name: "Previous", exact: true });
  await expect(previous).toHaveAttribute("aria-pressed", "false");
  await previous.click();
  await expect(previous).toHaveAttribute("aria-pressed", "true");
  await comparison.getByRole("button", { name: "View code", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("ComparisonLine");
  await expect(dialog).toContainText('from "@kind-ui/charts"');
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".showcase")).toHaveAttribute("data-motion", "off");
  await expect(page.getByRole("checkbox", { name: "Motion", exact: true })).toBeChecked();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".showcase")).toHaveAttribute("data-motion", "on");
  await page.getByRole("checkbox", { name: "Motion", exact: true }).uncheck();
  await expect(page.locator(".showcase")).toHaveAttribute("data-motion", "off");
});

test("all families fit phones and gauge values stay inside open center", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/showcase.html");
  for (const family of ["Area", "Bar", "Line", "Pie", "Radar", "Radial"]) {
    await page.getByRole("tab", { name: family, exact: true }).click();
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  const gauge = page.locator('[data-example="gauge"]');
  const value = gauge.locator("[data-gauge-value]");
  await expect(value).toHaveText("72");
  const box = await value.boundingBox();
  expect(box?.width).toBeGreaterThan(30);
  await gauge.getByRole("checkbox", { name: "Labels", exact: true }).uncheck();
  await expect(value).toHaveCount(0);
  await expect(gauge.locator(".recharts-radial-bar-sector")).toHaveCount(1);
  await gauge.getByRole("checkbox", { name: "Labels", exact: true }).check();
  await expect(value).toHaveText("72");
  await page.screenshot({ path: test.info().outputPath("showcase-phone.png"), fullPage: true });
});

test("desktop gallery capture and bounded switching response", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/showcase.html");
  await expect(page.locator(".recharts-surface")).toHaveCount(6);
  const before = Date.now();
  await page.getByRole("tab", { name: "Line", exact: true }).click();
  await expect(page.locator(".recharts-surface")).toHaveCount(8);
  expect(Date.now() - before).toBeLessThan(2000);
  await page.getByRole("tab", { name: "Area", exact: true }).click();
  await page.screenshot({ path: test.info().outputPath("showcase-desktop.png"), fullPage: true });
});

test("a rejected copy after a family switch does not reopen stale code", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          new Promise((_resolve, reject) => {
            document.addEventListener("reject-copy", () => reject(new Error("Denied")), {
              once: true,
            });
            document.documentElement.dataset.copyPending = "true";
          }),
      },
    });
  });
  await page.goto("/showcase.html");
  await page.getByRole("button", { name: "Copy Smooth code", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-copy-pending", "true");
  await page.getByRole("tab", { name: "Bar", exact: true }).click();
  await page.evaluate(() => document.dispatchEvent(new Event("reject-copy")));
  await expect(page.getByRole("heading", { name: "Bar charts" })).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".copy-status")).toBeEmpty();
});
