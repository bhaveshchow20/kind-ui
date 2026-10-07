import { expect, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
for (const packed of [false, true]) {
  for (const width of [1000, 320]) {
    test(`${packed ? "packed" : "recipe"} materials at ${width}: exact centers, bounded paint and repeated interactions`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(packed ? `http://127.0.0.1:${4190 + offset}` : "/heatmaps.html");
      const grid = page.getByRole("grid", { name: "Weekly latency" });
      const cells = grid.getByRole("gridcell");
      const activity = page.getByRole("grid", { name: "Deployment activity" });
      const select = page.getByRole("combobox", { name: "Cell material" });
      const capture = () =>
        cells.evaluateAll((nodes) =>
          nodes.map((node) => {
            const css = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return [
              css.backgroundColor,
              css.opacity,
              css.filter,
              rect.x - (node.closest("table")?.getBoundingClientRect().x ?? 0),
              rect.y - (node.closest("table")?.getBoundingClientRect().y ?? 0),
              rect.width,
              rect.height,
            ];
          }),
        );
      // Screenshots await webfonts; geometry must use the same settled font metrics.
      await page.evaluate(() => document.fonts.ready);
      const geometry = await capture();
      const plain = (await cells.first().screenshot()).toString("base64");
      const missing = await cells.nth(4).evaluate((node) => {
        const css = getComputedStyle(node);
        return [css.backgroundColor, css.backgroundImage, css.backgroundSize, css.backgroundRepeat];
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      const gap = width === 1000 ? await cells.first().boundingBox() : null;
      const gapClip = gap
        ? {
            x: Math.ceil(gap.x + gap.width),
            y: Math.ceil(gap.y + 4),
            width: 2,
            height: Math.floor(gap.height - 8),
          }
        : null;
      const plainGap = gapClip
        ? (await page.screenshot({ clip: gapClip })).toString("base64")
        : null;
      const ramp = await page
        .locator('[data-kind-ui="heatmap-ramp"]')
        .first()
        .getAttribute("style");
      for (const material of ["clay", "glow", "plain", "glow", "clay", "plain"]) {
        await select.selectOption(material);
        await page.evaluate(() => window.scrollTo(0, 0));
        expect(await capture()).toEqual(geometry);
        await expect(cells.first()).toHaveAttribute("data-material", material);
        await expect(cells.nth(4)).not.toHaveAttribute("data-material");
        expect(
          await cells.nth(4).evaluate((node) => {
            const css = getComputedStyle(node);
            return [
              css.backgroundColor,
              css.backgroundImage,
              css.backgroundSize,
              css.backgroundRepeat,
            ];
          }),
        ).toEqual(missing);
        expect(
          await page.locator('[data-kind-ui="heatmap-ramp"]').first().getAttribute("style"),
        ).toEqual(ramp);
        if (gapClip)
          expect((await page.screenshot({ clip: gapClip })).toString("base64")).toEqual(plainGap);
        const finished = (await cells.first().screenshot()).toString("base64");
        const pixels = await page.evaluate(
          async ({ plain, finished }) => {
            const read = async (png: string) => {
              const img = new Image();
              img.src = `data:image/png;base64,${png}`;
              await img.decode();
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const context = canvas.getContext("2d");
              if (!context) throw new Error("Canvas unavailable");
              context.drawImage(img, 0, 0);
              return {
                width: img.width,
                height: img.height,
                data: context.getImageData(0, 0, img.width, img.height).data,
              };
            };
            const a = await read(plain);
            const b = await read(finished);
            let centerChanges = 0;
            let edgeChanges = 0;
            for (let y = 0; y < a.height; y++)
              for (let x = 0; x < a.width; x++) {
                const i = (y * a.width + x) * 4;
                const changed = [0, 1, 2, 3].some((c) => a.data[i + c] !== b.data[i + c]);
                // One-pixel safety margin excludes rasterization at the 8% boundary.
                if (
                  x >= Math.ceil(a.width * 0.08) + 1 &&
                  x < Math.floor(a.width * 0.92) - 1 &&
                  y >= Math.ceil(a.height * 0.08) + 1 &&
                  y < Math.floor(a.height * 0.92) - 1
                ) {
                  if (changed) centerChanges++;
                } else if (changed) edgeChanges++;
              }
            return { centerChanges, edgeChanges };
          },
          { plain, finished },
        );
        expect(pixels.centerChanges).toBe(0);
        if (material === "plain") expect(pixels.edgeChanges).toBe(0);
        else expect(pixels.edgeChanges).toBeGreaterThan(40);
        // Actual raster colors for a negative value and measured zero, away from text.
        for (const index of [1, 2]) {
          const cell = cells.nth(index);
          const expected = await cell.evaluate((node) => getComputedStyle(node).backgroundColor);
          const png = (await cell.screenshot()).toString("base64");
          const actual = await page.evaluate(async (png) => {
            const img = new Image();
            img.src = `data:image/png;base64,${png}`;
            await img.decode();
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas unavailable");
            ctx.drawImage(img, 0, 0);
            return Array.from(
              ctx.getImageData(Math.floor(img.width / 2), Math.floor(img.height / 4), 1, 1).data,
            );
          }, png);
          expect(actual).toEqual([...(expected.match(/\d+/g) ?? []).map(Number), 255]);
        }
        await activity.getByRole("gridcell").first().focus();
        await page.keyboard.press("ArrowRight");
        await expect(activity.getByRole("gridcell").nth(1)).toBeFocused();
        await page.keyboard.press("Escape");
        await page.mouse.move(0, 0);
        await cells.first().focus();
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowRight");
        await expect(page.getByRole("tooltip").first()).toHaveText("Platform, Europe: 0");
        await page.keyboard.press("End");
        await expect(page.getByRole("tooltip").first()).toHaveText("Platform, Oceania: No sample");
        await page.keyboard.press("Escape");
        await page.mouse.move(0, 0);
        await select.focus();
        await page.locator('[data-kind-ui="heatmap-scroll"]').evaluateAll((nodes) => {
          for (const node of nodes) node.scrollLeft = 0;
        });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: info.outputPath(`heatmap-${material}-${width}.png`),
          // Chromium full-page capture can relayout native table headers.
          // Capture the tested viewport without mutating later geometry checks.
          fullPage: false,
        });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
      await select.selectOption("clay");
      await cells.first().focus();
      await page
        .getByRole("button", { name: "Update values" })
        .evaluate((node: HTMLButtonElement) => node.click());
      await expect(cells.first()).toHaveAttribute("aria-label", "Platform, US East: -12");
      await page
        .getByRole("button", { name: "Reorder domains" })
        .evaluate((node: HTMLButtonElement) => node.click());
      await expect(cells.last()).toBeFocused();
      await expect(cells.last()).toHaveAttribute("data-material", "clay");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(page.locator('[data-kind-ui="heatmap-entrance"]').first()).toHaveCSS(
        "transform",
        "none",
      );
      await page.setViewportSize({ width: width === 320 ? 1000 : 320, height: 900 });
      await expect(cells.last()).toHaveAttribute("aria-label", "Platform, US East: -12");
      await page.getByRole("button", { name: "Toggle empty" }).click();
      await expect(cells).toHaveCount(0);
    });
  }
}

test("packed edge materials preserve native refs, filters, cancelable events and missing-to-zero", async ({
  page,
}) => {
  await page.goto(`http://127.0.0.1:${4190 + offset}`);
  const grid = page.getByRole("grid", { name: "Constant and missing grid" });
  const cells = grid.getByRole("gridcell");
  const materials = ["clay", "glow", "plain"] as const;
  for (const [index, material] of materials.entries()) {
    await page.getByRole("combobox", { name: "Edge material" }).selectOption(material);
    await expect(cells.first()).toHaveCSS("filter", "brightness(1)");
    await expect(cells.first()).toHaveAttribute("data-ref-ready", "yes");
    await expect(cells.first()).toHaveCSS("background-color", "rgb(128, 128, 128)");
    await cells.nth(1).click();
    await expect(page.getByLabel("Handled events")).toHaveText(String(index + 1));
    await page.keyboard.press("ArrowLeft");
    await expect(cells.nth(1)).toBeFocused();
  }
  await expect(page.getByLabel("Handled events")).toHaveText(String(materials.length));
  await page
    .getByRole("button", { name: "Patch edge data" })
    .evaluate((node: HTMLButtonElement) => node.click());
  await expect(cells.nth(1)).toHaveAttribute("data-material", "plain");
  await expect(page.getByRole("tooltip").last()).toHaveText("A, Y: 0");
  // Explicit consumer background paint overrides the optional treatment.
  await page.getByRole("combobox", { name: "Edge material" }).selectOption("clay");
  await cells.first().evaluate((node: HTMLElement) => {
    node.style.backgroundImage = "none";
  });
  await expect(cells.first()).toHaveCSS("background-image", "none");
});
