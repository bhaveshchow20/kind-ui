import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("Candlestick card preserves source-labelled inspection, copied code and installation parity", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => sessionStorage.setItem("candlestick-code", value),
      },
    });
  });
  await page.goto("./");
  await page.getByRole("tab", { name: "Candlestick", exact: true }).click();
  const card = page.locator(".demo-grid .chart-card");
  await expect(card).toHaveCount(1);
  await expect(card.locator(".chart-summary")).toContainText("USD/share · synthetic executions");
  await expect(card.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(20);
  const table = card.getByRole("table", {
    name: "Synthetic executions: daily OHLC in USD per share and volume in shares",
    exact: true,
  });
  await expect(table.getByRole("row")).toHaveCount(21);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await expect(table.getByRole("row").nth(1)).toContainText("Synthetic executions");
  const frame = card.locator('[data-kind-ui="chart"]').first();
  expect(
    await table.evaluate((table) => {
      for (
        let parent = table.parentElement;
        parent && !parent.classList.contains("chart-card");
        parent = parent.parentElement
      ) {
        if (parent.tabIndex >= 0) return true;
      }
      return false;
    }),
  ).toBe(false);
  await frame.focus();
  await page.keyboard.press("Tab");
  await expect(
    card.getByRole("button", { name: "Highlight Synthetic executions · USD/share", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    card.getByRole("button", { name: "Highlight Volume · shares", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Expand Session price action", exact: true }),
  ).toBeFocused();
  const readout = card.locator('[data-kind-ui="candlestick-content"][role="status"]');
  await frame.focus();
  await frame.press("Home");
  await expect(readout).toContainText("09-14");
  await expect(readout).toContainText("$187.30");
  await expect(readout).toContainText("420,000 shares");
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--chart-grid", "initial");
    document.documentElement.style.setProperty("--chart-axis", "initial");
  });
  await expect(card.locator(".recharts-cartesian-grid-horizontal line").first()).toHaveCSS(
    "stroke",
    "rgb(229, 231, 235)",
  );
  await expect(card.locator('[data-kind-ui="candlestick-crosshair"]')).toHaveCSS(
    "stroke",
    "rgb(100, 116, 139)",
  );
  await page.evaluate(() => {
    document.documentElement.style.removeProperty("--chart-grid");
    document.documentElement.style.removeProperty("--chart-axis");
  });
  await frame.press("End");
  await expect(readout).toContainText("10-09");
  await expect(readout).toContainText("$206.40");
  await frame.press("Enter");
  await expect(table.locator('tr[data-selected="true"]')).toContainText("10-09");
  await frame.press("Escape");
  await expect(readout).toBeEmpty();
  await expect(table.locator('tr[data-selected="true"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Expand Session price action", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("slider", { name: "Wick weight", exact: true })).toHaveAttribute(
    "aria-valuenow",
    "1.5",
  );
  await expect(dialog.getByRole("slider", { name: "Candle width", exact: true })).toHaveAttribute(
    "aria-valuenow",
    "14",
  );
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  await dialog.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(dialog.locator('.playground-footer [role="status"]')).toHaveText("Code copied");
  const copied = await page.evaluate(() => sessionStorage.getItem("candlestick-code"));
  expect(copied).toContain('from "@kind-ui/charts"');
  expect(copied).toContain("<CandlestickChart.Volume");
  expect(copied).toContain('data-kind-ui="candlestick-data-alternative"');
  expect(copied).not.toContain("<CandlestickChart.DataTable");
  expect(copied).toContain('stroke="var(--chart-grid, #e5e7eb)"');
  expect(copied).toContain('stroke="var(--chart-axis, #64748b)"');
  expect(copied).toContain("selection={selection}");
  expect(copied).toContain("Synthetic executions");
  expect(copied).not.toMatch(/responsive|localhost|127\.0\.0\.1/);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

  const install = page.getByRole("region", { name: "Install Kind UI Charts" });
  await install.getByRole("tab", { name: "shadcn", exact: true }).click();
  const picker = install.locator(".install-chart-picker");
  const initial = await picker.getAttribute("aria-label");
  expect(initial).toBeTruthy();
  let wrapped = false;
  let foundCandlestick = false;
  for (let index = 0; index < 30; index += 1) {
    const current = await picker.getAttribute("aria-label");
    if (current?.includes("candlestick-chart")) foundCandlestick = true;
    await picker.click();
    await expect(picker).not.toHaveAttribute("aria-label", current ?? "");
    if ((await picker.getAttribute("aria-label")) === initial) {
      wrapped = true;
      break;
    }
  }
  expect(wrapped).toBe(true);
  expect(foundCandlestick).toBe(true);
  expect(errors).toEqual([]);
});

for (const theme of ["light", "dark"] as const) {
  test(`Candlestick bodies, wicks and volume retain graphical contrast in ${theme}`, async ({
    page,
  }, info) => {
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/);
    else await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.getByRole("tab", { name: "Candlestick", exact: true }).click();
    const verify = async (selector: string) => {
      const card = page.locator(selector);
      await expect(card.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(20);
      if (selector.includes("playground"))
        await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
      const samples = await card.evaluate((card) => {
        const parse = (value: string) => {
          const [r = 0, g = 0, b = 0, a = 1] = (value.match(/[\d.]+/g) ?? []).map(Number);
          return [r, g, b, a] as const;
        };
        const composite = (
          color: readonly [number, number, number, number],
          background: readonly number[],
        ) =>
          color
            .slice(0, 3)
            .map((value, index) => value * color[3] + (background[index] ?? 0) * (1 - color[3]));
        const luminance = (color: readonly number[]) =>
          color
            .map((value) => {
              const channel = value / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            })
            .reduce((sum, value, index) => sum + value * ([0.2126, 0.7152, 0.0722][index] ?? 0), 0);
        const ancestors: Element[] = [];
        for (let node: Element | null = card; node; node = node.parentElement)
          ancestors.unshift(node);
        const background = ancestors.reduce<number[]>(
          (color, node) => composite(parse(getComputedStyle(node).backgroundColor), color),
          [255, 255, 255],
        );
        return [
          ...card.querySelectorAll('[data-candle-part], [data-kind-ui="candlestick-volume-mark"]'),
        ].map((node) => {
          const style = getComputedStyle(node);
          const volume = node.getAttribute("data-kind-ui") === "candlestick-volume-mark";
          const line = node.tagName.toLowerCase() === "line";
          const paint = parse(line ? style.stroke : style.fill);
          let opacity = Number(line ? style.strokeOpacity : style.fillOpacity);
          for (let parent: Element | null = node; parent; parent = parent.parentElement) {
            opacity *= Number(getComputedStyle(parent).opacity);
            if (parent === card) break;
          }
          const color = composite([paint[0], paint[1], paint[2], paint[3] * opacity], background);
          const foregroundLuminance = luminance(color);
          const backgroundLuminance = luminance(background);
          return {
            part: volume ? "volume" : node.getAttribute("data-candle-part"),
            contrast:
              (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
              (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
          };
        });
      });
      expect(samples.some(({ part }) => part === "body")).toBe(true);
      expect(samples.some(({ part }) => part === "wick")).toBe(true);
      expect(samples.some(({ part }) => part === "volume")).toBe(true);
      const evidenceName = `candlestick-${theme}-${selector.includes("playground") ? "dialog" : "card"}-contrast`;
      const evidencePath = info.outputPath(`${evidenceName}.json`);
      await writeFile(evidencePath, JSON.stringify({ theme, selector, samples }));
      await info.attach(evidenceName, { path: evidencePath, contentType: "application/json" });
      for (const sample of samples)
        expect(sample.contrast, `${theme} ${sample.part}`).toBeGreaterThanOrEqual(3);
    };
    await verify(".demo-grid .chart-card");
    await page.getByRole("button", { name: "Expand Session price action", exact: true }).click();
    await verify(".playground-preview .chart-card");
  });
}

for (const width of [320, 375, 390, 414]) {
  test(`Candlestick card and dialog fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    await page.getByRole("tab", { name: "Candlestick", exact: true }).click();
    const verify = async (selector: string) => {
      const card = page.locator(selector);
      await expect(card.locator('[data-kind-ui="candlestick-mark"]')).toHaveCount(20);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(
        await card.evaluate((card) => {
          const outer = card.getBoundingClientRect();
          return [...card.querySelectorAll("svg.recharts-surface")].every((plot) => {
            const inner = plot.getBoundingClientRect();
            return (
              inner.left >= outer.left &&
              inner.right <= outer.right &&
              inner.bottom <= outer.bottom - 8
            );
          });
        }),
      ).toBe(true);
    };
    await verify(".demo-grid .chart-card");
    await page.getByRole("button", { name: "Expand Session price action", exact: true }).click();
    await verify(".playground-preview .chart-card");
    const card = await page.locator(".playground-preview .chart-card").boundingBox();
    const main = await page.locator(".playground-main").boundingBox();
    expect(card).not.toBeNull();
    expect(main).not.toBeNull();
    if (!card || !main) throw new Error("Missing visible Candlestick dialog bounds");
    expect(card.y + card.height).toBeLessThanOrEqual(main.y + main.height);
  });
}
