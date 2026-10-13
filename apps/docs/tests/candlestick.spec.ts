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
  await expect(asset.getByText("SIMULATED", { exact: true })).toBeVisible();
  await asset.getByRole("button", { name: "Pause", exact: true }).click();
  const count = await asset.locator(marks).count();
  expect(count).toBeGreaterThanOrEqual(48);
  expect(count).toBeLessThan(55);
  await expect(asset.locator('[data-kind-ui="candlestick-volume-mark"]')).toHaveCount(count);
  const readout = asset.locator('[data-kind-ui="candle-readout"]');
  const paused = await readout.textContent();
  await asset.getByRole("button", { name: "Step", exact: true }).click();
  await expect(readout).not.toHaveText(paused ?? "");
  await expect(asset.getByRole("button", { name: "Resume", exact: true })).toBeVisible();
  await expect(asset.locator('[data-kind-ui="candlestick-current-price"]')).toBeVisible();
  await expect(asset.locator('[data-kind-ui="candlestick-history-navigator"]')).toBeVisible();
  await asset.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("Home");
  await expect(asset.locator('[data-kind-ui="candlestick-content"]')).toContainText("08:00");

  const binary = page.locator('[data-component="candlestick-binary"]');
  await expect(binary.locator(marks)).toHaveCount(6);
  await expect(binary.locator('[data-kind-ui="candlestick-volume-mark"]')).toHaveCount(0);
  await binary.locator('[data-kind-ui="chart"]').focus();
  await page.keyboard.press("End");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("Bid quotes");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("partial");
  await expect(binary.locator('[data-kind-ui="candlestick-content"]')).toContainText("$0.59");

  await expect(page.getByRole("heading", { name: "Live updates", exact: true })).toHaveCount(0);
  const panels = await page
    .locator('[data-component^="candlestick"] .preview-panel')
    .evaluateAll((nodes) =>
      nodes.map((panel) => {
        const frame = panel.getBoundingClientRect();
        const example = panel.querySelector(".chart-example")?.getBoundingClientRect();
        return { bottom: frame.bottom, contentBottom: example?.bottom ?? frame.bottom };
      }),
    );
  for (const panel of panels) expect(panel.contentBottom).toBeLessThanOrEqual(panel.bottom + 1);

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
  for (const [id, example] of [
    ["candlestick", asset],
    ["candlestick-binary", binary],
  ] as const) {
    await example.getByRole("button", { name: "Copy prompt", exact: true }).click();
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    const selectedSource =
      id === "candlestick" ? "variants/ready/example.tsx" : `src/examples/${id}/example.tsx`;
    expect(prompt).toContain(`https://kindui.dev/charts/docs/examples/${id}/${selectedSource}`);
    expect(prompt).toContain("Reference package: @kind-ui/charts@0.6.0.");
    expect(prompt).toContain("Install @kind-ui/charts@^0.6.0 and its documented");
    expect(prompt).toContain("Preserve the explicit readout part");
    expect(prompt).not.toMatch(/data table|alternative tables/);
    expect(prompt).not.toMatch(
      /Published Core|Public installation requires|candidate artifact|wait for|unreleased/i,
    );
  }
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

test("Candlestick streaming pauses and resumes while zoom, pan and navigator share historical state", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`.${docRoute("/docs/components/candlestick/")}`);
  const container = page.locator('[data-component="candlestick"]').first();
  await container.getByRole("button", { name: "Pause", exact: true }).click();
  const readout = container.locator('[data-kind-ui="candle-readout"]');
  const paused = await readout.textContent();
  await page.waitForTimeout(900);
  await expect(readout).toHaveText(paused ?? "");
  const count = await container.locator('[data-kind-ui="candlestick-mark"]').count();
  await container.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(() => container.locator('[data-kind-ui="candlestick-mark"]').count())
    .toBeLessThan(count);
  const start = container.getByRole("slider", { name: "Historical window start", exact: true });
  const beforePan = Number(await start.getAttribute("aria-valuenow"));
  const frame = container.locator('[data-kind-ui="chart"]').first();
  await frame.focus();
  await frame.press("Shift+ArrowLeft");
  await expect
    .poll(async () => Number(await start.getAttribute("aria-valuenow")))
    .toBeLessThan(beforePan);
  const beforeNavigator = Number(await start.getAttribute("aria-valuenow"));
  await start.focus();
  await start.press("ArrowLeft");
  await expect
    .poll(async () => Number(await start.getAttribute("aria-valuenow")))
    .toBeLessThan(beforeNavigator);
  const browsing = await start.getAttribute("aria-valuenow");
  await container.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(readout).not.toHaveText(paused ?? "");
  await expect(start).toHaveAttribute("aria-valuenow", browsing ?? "");
  await container.getByRole("button", { name: "Pause", exact: true }).click();
  await container.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect
    .poll(() => container.locator('[data-kind-ui="candlestick-mark"]').count())
    .toBeGreaterThanOrEqual(240);
  await container.screenshot({
    path: info.outputPath("streaming-history.png"),
    animations: "disabled",
  });
  await info.attach("streaming-history", {
    path: info.outputPath("streaming-history.png"),
    contentType: "image/png",
  });
});

for (const theme of ["light", "dark"]) {
  test(`Candlestick primary and bounded examples keep controls and readouts contained in ${theme}`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`.${docRoute("/docs/components/candlestick/")}`);
    await page.evaluate(
      (theme) => document.documentElement.classList.toggle("dark", theme === "dark"),
      theme,
    );
    const asset = page.locator('[data-component="candlestick"]').first();
    await asset.getByRole("button", { name: "Pause", exact: true }).click();
    for (const id of ["candlestick", "candlestick-binary"]) {
      const container = page.locator(`[data-component="${id}"]`).first();
      const frame = container.locator('[data-kind-ui="chart"]').first();
      await frame.focus();
      await frame.press("End");
      await expect(container.locator('[data-kind-ui="candlestick-content"]')).not.toBeEmpty();
      const layout = await container.locator(".preview-panel").evaluate((panel) => {
        const bounds = panel.getBoundingClientRect();
        const composition = panel.querySelector(".chart-example")?.getBoundingClientRect();
        return {
          bottom: bounds.bottom,
          contentBottom: composition?.bottom,
          width: bounds.width,
          scrollWidth: panel.scrollWidth,
        };
      });
      expect(layout.contentBottom).toBeLessThanOrEqual(layout.bottom + 1);
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1);
      const file = info.outputPath(`${id}-${theme}.png`);
      await container.screenshot({ path: file, animations: "disabled" });
      await info.attach(`${id}-${theme}`, { path: file, contentType: "image/png" });
    }
  });
}
