import { expect, test } from "@playwright/test";
import { docRoute, publicPath } from "../lib/routing.mjs";

const marks = '[data-kind-ui="candlestick-mark"]';

test("Candlestick docs preserve original OHLC, quote metadata, live updates and shared installation", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`.${docRoute("/docs/components/candlestick/")}`);
  await expect(
    page.getByRole("heading", { name: "Candlestick Chart", exact: true, level: 1 }),
  ).toBeVisible();
  const asset = page.locator('[data-component="candlestick"]');
  await expect(asset.locator(marks)).toHaveCount(12);
  await expect(asset.locator('[data-kind-ui="candlestick-volume-mark"]')).toHaveCount(12);
  await expect(asset.locator('[data-candle-part="doji"]')).toHaveCount(1);
  await asset.getByRole("button", { name: "6 sessions", exact: true }).click();
  // Six visible intervals plus one explicit overscan record retain their original extrema.
  await expect(asset.locator(marks)).toHaveCount(7);
  await asset.getByRole("button", { name: "All sessions", exact: true }).click();
  await expect(asset.locator(marks)).toHaveCount(12);
  await asset.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("Home");
  await expect(asset.locator('[data-kind-ui="candlestick-content"]')).toContainText("09-21");
  await expect(asset.locator('[data-kind-ui="candlestick-content"]')).toContainText("$121.60");

  const binary = page.locator('[data-component="candlestick-binary"]');
  await expect(binary.locator(marks)).toHaveCount(6);
  await expect(binary.locator('[data-kind-ui="candlestick-volume-mark"]')).toHaveCount(0);
  await binary.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("End");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("Bid quotes");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("partial");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("$0.59");

  const updates = page.locator('[data-component="candlestick-updates"]');
  const table = updates.getByRole("table", { name: "Current observations", exact: true });
  await expect(table.locator("tbody tr")).toHaveCount(5);
  await expect(updates.locator(marks)).toHaveCount(4);
  await expect(table).toContainText("Gap");
  const volumeCells = table.locator("tbody tr td:nth-child(6)");
  await expect(volumeCells).toHaveText(["—", "—", "—", "—", "—"]);
  await updates.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(table.locator('tr[data-selected="true"]')).toContainText("$78.00");
  await updates.getByRole("button", { name: "Replace current", exact: true }).click();
  await expect(table.locator('tr[data-selected="true"]')).toContainText("$79.00");
  await expect(table.locator('tr[data-selected="true"]')).toContainText("partial replacement");
  await updates.getByRole("button", { name: "Correct older", exact: true }).click();
  await expect(table.locator("tbody tr").first()).toContainText("$70.00");
  await expect(table.locator("tbody tr").first()).toContainText("corrected");
  await updates.getByRole("button", { name: "Append", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(6);
  await expect(table.locator('tr[data-selected="true"]')).toContainText("final");
  await updates.getByRole("button", { name: "Prepend", exact: true }).click();
  await expect(table.locator("tbody tr")).toHaveCount(7);
  await expect(table.locator('tr[data-selected="true"]')).toContainText("$79.00");
  await expect(table).toContainText("Explicit gap");

  const installation = page.locator('[data-chart-installation="candlestick"]');
  await expect(installation.getByRole("tab", { name: "CLI", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(installation.getByRole("tab", { name: "Manual", exact: true })).toBeVisible();
  await expect(installation.locator("pre")).toHaveText(
    "npx shadcn@latest add @kind-ui/candlestick-chart",
  );
  await expect(page.locator("[data-release-pending]")).toHaveCount(0);
  await installation.getByRole("tab", { name: "Manual", exact: true }).click();
  await expect(installation.getByRole("heading", { level: 3 })).toHaveText([
    "Install Core",
    "Configure Tailwind CSS v4",
    "Create the composition",
    "Render the chart",
  ]);
  await expect(installation.locator("figcaption")).toHaveText([
    "Terminal",
    "src/app.css",
    "components/candlestick-chart.tsx",
    "App.tsx",
  ]);
  const composition = installation.locator("figure").nth(2);
  await composition.getByRole("button", { name: /^(?:Copy|Copied) Text$/ }).click();
  const copiedSource = await page.evaluate(() => navigator.clipboard.readText());
  const sourceResponse = await page.request.get(
    publicPath("/examples/candlestick/src/examples/candlestick/example.tsx"),
  );
  expect(sourceResponse.ok()).toBe(true);
  expect(copiedSource.trimEnd()).toBe((await sourceResponse.text()).trimEnd());
  expect(copiedSource).toContain("<CandlestickChart");
  expect(copiedSource).toContain("<CandlestickSeries");
  expect(copiedSource).toContain("<CandlestickVolume");
  await asset.getByRole("button", { name: "Copy prompt", exact: true }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain("https://kindui.dev/charts/docs/");
  expect(prompt).not.toMatch(
    /Published Core|Public installation requires|candidate artifact|wait for|unreleased|0\.6\.0/i,
  );
  expect(errors).toEqual([]);
});
test("Candlestick installation and section copy controls fit narrow layouts with enlarged text", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`.${docRoute("/docs/components/candlestick/")}`);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const fontFamily of ["", "Arial, sans-serif"]) {
      for (const fontSize of ["", "200%"]) {
        await page.evaluate(
          ({ fontFamily, fontSize }) => {
            document.body.style.fontFamily = fontFamily;
            document.documentElement.style.fontSize = fontSize;
          },
          { fontFamily, fontSize },
        );
        const installation = page.locator('[data-chart-installation="candlestick"]');
        await installation.getByRole("tab", { name: "Manual", exact: true }).click();
        await expect(installation.getByRole("heading", { level: 3 })).toHaveCount(4);
        const composition = installation.locator("figure").nth(2);
        await expect(composition.locator("figcaption")).toHaveText(
          "components/candlestick-chart.tsx",
        );
        const expectedSource = await composition.locator("pre").textContent();
        const copySource = composition.getByRole("button", { name: /^(?:Copy|Copied) Text$/ });
        await copySource.focus();
        await expect(copySource).toBeFocused();
        await copySource.click();
        await expect(copySource).toHaveAttribute("data-checked", "true");
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
          expectedSource ?? "",
        );
        const blockLayout = await installation.locator("figure").evaluateAll((blocks) =>
          blocks.map((block) => {
            const bounds = block.getBoundingClientRect();
            const button = block.querySelector("button");
            const caption = block.querySelector("figcaption");
            const buttonBounds = button?.getBoundingClientRect();
            const captionBounds = caption?.getBoundingClientRect();
            return {
              left: bounds.left,
              right: bounds.right,
              buttonLeft: buttonBounds?.left,
              buttonRight: buttonBounds?.right,
              captionRight: captionBounds?.right,
            };
          }),
        );
        for (const block of blockLayout) {
          expect(block.left).toBeGreaterThanOrEqual(-1);
          expect(block.right).toBeLessThanOrEqual(width + 1);
          expect(block.buttonLeft).toBeGreaterThanOrEqual(block.left - 1);
          expect(block.buttonRight).toBeLessThanOrEqual(block.right + 1);
          expect(block.captionRight).toBeLessThanOrEqual(block.right + 1);
        }
        const layout = await page.locator(".doc-body > h2").evaluateAll((headings) => ({
          pageWidth: document.documentElement.scrollWidth,
          viewport: innerWidth,
          headings: headings.map((heading) => {
            const bounds = heading.getBoundingClientRect();
            return {
              title: heading.textContent,
              left: bounds.left,
              right: bounds.right,
              children: [...heading.children].map((child) => {
                const bounds = child.getBoundingClientRect();
                return { left: bounds.left, right: bounds.right };
              }),
            };
          }),
        }));
        expect(
          layout.pageWidth,
          JSON.stringify({ width, fontFamily, fontSize, layout }),
        ).toBeLessThanOrEqual(layout.viewport + 1);
        const inspectedHeading = page.locator("#inspection-and-accessibility");
        await expect(inspectedHeading.locator(":scope > a")).toBeVisible();
        const copyAction = inspectedHeading.getByRole("button", {
          name: "Copy Anchor Link",
          exact: true,
        });
        await expect(copyAction).toBeVisible();
        await copyAction.focus();
        await expect(copyAction).toBeFocused();
        for (const heading of layout.headings) {
          for (const child of heading.children) {
            expect(child.left, heading.title ?? "Section link").toBeGreaterThanOrEqual(
              heading.left - 1,
            );
            expect(child.right, heading.title ?? "Section copy action").toBeLessThanOrEqual(
              heading.right + 1,
            );
          }
        }
      }
    }
  }
});
