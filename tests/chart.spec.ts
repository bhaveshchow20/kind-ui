import { expect, test } from "./browser";

test("public components share configuration and preserve missing, zero and hidden values", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const chart = page.getByRole("application", { name: "Task outcomes by day" });
  await expect(chart).toBeVisible();
  await expect(page.getByRole("row", { name: "Thu 64 tasks 0 tasks" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("chart-default.png"), fullPage: true });
  const completed = page.getByRole("button", { name: "Completed", exact: true });
  await completed.focus();
  await page.keyboard.press("Space");
  await expect(completed).toBeFocused();
  await expect(completed).toHaveAttribute("aria-pressed", "false");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  const status = page.getByRole("status");
  await expect(status).toContainText("Needs review");
  await expect(status).not.toContainText("Completed");
  await expect(status).toHaveAttribute("aria-live", "assertive");
  await completed.click();
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  await expect(status).toContainText("No data");
  await page.screenshot({ path: info.outputPath("chart-tooltip.png"), fullPage: true });
  await page.keyboard.press("Escape");
  await expect(status).not.toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(status).toContainText("0 tasks");
  await completed.focus();
  await expect(status).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("legend keyboard guard retains focus and genuine no-data recovery", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  const review = page.getByRole("button", { name: "Needs review", exact: true });
  await review.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-kind-ui=chart-interaction-status]")).toHaveText(
    "At least one item must remain visible.",
  );
  await expect(review).toBeFocused();
  await expect(page.getByRole("row", { name: "Mon 42 tasks 12 tasks" })).toBeVisible();
  await review.click();
  await expect(page.getByRole("application")).toBeVisible();
  await page.getByLabel("Empty data").check();
  await expect(page.getByRole("status")).toHaveText("No data yet.");
  await page.screenshot({ path: info.outputPath("chart-empty.png"), fullPage: true });
  await page.getByLabel("Empty data").uncheck();
  await expect(page.getByRole("application")).toBeVisible();
  for (let i = 0; i < 10; i++) await review.click();
  await expect(review).toHaveAttribute("aria-pressed", "true");
});

test("controlled state stays authoritative and native props/refs reach the DOM", async ({
  page,
}) => {
  await page.goto("/contracts.html");
  const a = page.getByRole("region", { name: "A", exact: true });
  const button = a.getByRole("button", { name: "A tasks" });
  await button.click();
  await expect(page.getByRole("status", { name: "A request" })).toHaveText("count");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(a.locator('[data-owner="A"]')).toHaveAttribute("data-forwarded", "container");
  await expect(a.getByRole("list")).toHaveAttribute("data-forwarded", "legend");
  await expect(a.getByRole("list")).toHaveAttribute("data-clicked", "yes");
  await a.getByLabel("Hold A changes").uncheck();
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await a.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(a.getByRole("status", { name: "A tooltip" })).toHaveAttribute(
    "data-forwarded",
    "tooltip",
  );
});

test("two independent containers isolate metadata, keyboard tooltips and resizing", async ({
  page,
}) => {
  await page.goto("/contracts.html");
  const a = page.getByRole("region", { name: "A", exact: true });
  const b = page.getByRole("region", { name: "B", exact: true });
  for (const [scope, name] of [
    [a, "A"],
    [b, "B"],
  ] as const) {
    await scope.getByLabel(`Hold ${name} changes`).uncheck();
    await scope.getByRole("button").click();
  }
  await a.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(a.getByRole("status", { name: "A tooltip" })).toContainText("A tasks");
  await b.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  await expect(a.getByRole("status", { name: "A tooltip" })).not.toBeVisible();
  await expect(b.getByRole("status", { name: "B tooltip" })).toContainText("B tasks");
  await expect(b.getByRole("status", { name: "B tooltip" })).not.toContainText("A tasks");
  await a.getByRole("button").click();
  await expect(b.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  const before = await b.getByRole("application").boundingBox();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect
    .poll(async () => (await b.getByRole("application").boundingBox())?.width ?? 0)
    .toBeLessThan(before?.width ?? 0);
});

test("compact example fits mobile and retains the data alternative", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Needs review" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Needs review Hidden" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: info.outputPath("chart-mobile.png"), fullPage: true });
});

test("host theme tokens reach marks, legend and tooltip without changing selection", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--chart-1", "rgb(0, 128, 128)");
    document.documentElement.style.setProperty("--popover", "rgb(255, 240, 200)");
    document.documentElement.style.setProperty("--popover-foreground", "rgb(20, 30, 40)");
  });
  const chart = page.getByRole("application", { name: "Task outcomes by day" });
  await expect(chart.locator('path[stroke="var(--color-completed)"]').first()).toHaveCSS(
    "stroke",
    "rgb(0, 128, 128)",
  );
  const completed = page.getByRole("button", { name: "Completed", exact: true });
  await expect(completed.locator('[aria-hidden="true"]')).toHaveCSS(
    "background-color",
    "rgb(0, 128, 128)",
  );
  await expect(completed).toHaveAttribute("aria-pressed", "true");
  await chart.focus();
  await page.keyboard.press("ArrowRight");
  const tooltip = page.getByRole("status");
  await expect(tooltip).toHaveCSS("background-color", "rgb(255, 240, 200)");
  await expect(tooltip).toHaveCSS("color", "rgb(20, 30, 40)");
});

for (const palette of ["Monochrome", "Color"] as const) {
  test(`${palette} preserves chart state, non-color cues and readable theme contrast`, async ({
    page,
  }, info) => {
    const externalRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).hostname !== "127.0.0.1") externalRequests.push(request.url());
    });
    await page.goto("/");
    const paletteButton = page.getByRole("button", { name: palette, exact: true });
    await paletteButton.click();
    await expect(paletteButton).toHaveAttribute("aria-pressed", "true");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() =>
        [...document.fonts].some(
          (font) =>
            font.family.replaceAll('"', "") === "Geist Variable" && font.status === "loaded",
        ),
      ),
    ).toBe(true);
    const chart = page.getByRole("application", { name: "Task outcomes by day" });
    const reviewLine = chart.locator('path[stroke="var(--color-review)"]').first();
    await expect(reviewLine).toHaveAttribute("stroke-dasharray", "5 4");
    await expect(chart.locator('path.recharts-symbols[fill="var(--color-review)"]')).toHaveCount(5);
    await expect(chart.locator('circle[fill="var(--color-completed)"]')).toHaveCount(4);
    await expect(reviewLine).toHaveCSS(
      "stroke",
      palette === "Monochrome" ? "rgb(98, 98, 98)" : "rgb(190, 24, 93)",
    );
    const ratios = await page.evaluate(() => {
      const host = document.querySelector("[data-palette]");
      if (!host) throw new Error("Missing palette host");
      const style = getComputedStyle(host);
      const luminance = (token: string) => {
        const raw = style.getPropertyValue(token).trim().slice(1);
        const hex = raw.length === 3 ? [...raw].map((channel) => channel + channel).join("") : raw;
        const channels = [0, 2, 4]
          .map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
        return (
          (channels[0] ?? 0) * 0.2126 + (channels[1] ?? 0) * 0.7152 + (channels[2] ?? 0) * 0.0722
        );
      };
      const contrast = (a: string, b: string) => {
        const first = luminance(a),
          second = luminance(b);
        return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
      };
      return {
        text: contrast("--muted-foreground", "--background"),
        control: contrast("--muted-foreground", "--muted"),
        firstMark: contrast("--chart-1", "--background"),
        secondMark: contrast("--chart-2", "--background"),
        focus: contrast("--ring", "--background"),
      };
    });
    expect(ratios.text).toBeGreaterThanOrEqual(4.5);
    expect(ratios.control).toBeGreaterThanOrEqual(4.5);
    for (const value of [ratios.firstMark, ratios.secondMark, ratios.focus])
      expect(value).toBeGreaterThanOrEqual(3);
    await page.screenshot({
      path: info.outputPath(`chart-${palette.toLowerCase()}.png`),
      fullPage: true,
    });
    const completed = page.getByRole("button", { name: "Completed", exact: true });
    await completed.click();
    const other = page.getByRole("button", {
      name: palette === "Color" ? "Monochrome" : "Color",
      exact: true,
    });
    await other.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(other).toBeFocused();
    await expect(other).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Space");
    await expect(other).toHaveAttribute("aria-pressed", "true");
    await expect(completed).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("columnheader", { name: "Completed Hidden" })).toBeVisible();
    await page.getByLabel("Empty data").check();
    await paletteButton.click();
    await expect(page.getByRole("status")).toHaveText("No data yet.");
    expect(externalRequests).toEqual([]);
  });
}
