import { expect, type Page, test } from "@playwright/test";

const port = 4196 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
const families = ["bar", "histogram", "box", "waterfall"] as const;

async function sample(page: Page) {
  return page.locator('[data-kind-ui="bar-reveal"]').evaluate((node) => {
    // A clipPath is not painted DOM, so its client rectangle is empty. Transform
    // its SVG geometry into the same screen coordinates as the painted marks.
    const rect = node as SVGRectElement;
    const box = rect.getBBox();
    const transform = rect.getScreenCTM();
    if (!transform) throw new Error("Missing clip transform");
    const start = new DOMPoint(box.x, box.y).matrixTransform(transform);
    const end = new DOMPoint(box.x + box.width, box.y + box.height).matrixTransform(transform);
    const clip = {
      left: start.x,
      top: start.y,
      right: end.x,
      bottom: end.y,
      height: end.y - start.y,
    };
    const paintedBounds = [...document.querySelectorAll(".recharts-bar-rectangle")].map((mark) => {
      const bounds = mark.getBoundingClientRect();
      return (
        Math.max(0, Math.min(clip.right, bounds.right) - Math.max(clip.left, bounds.left)) *
        Math.max(0, Math.min(clip.bottom, bounds.bottom) - Math.max(clip.top, bounds.top))
      );
    });
    return {
      height: clip.height,
      intersection: paintedBounds.reduce((sum, area) => sum + area, 0),
    };
  });
}

for (const family of families) {
  for (const fixed of [false, true]) {
    for (const labels of ["", "&long&serif", "&long&webfont"]) {
      test(`${family} ${fixed ? "fixed" : "auto"} axis ${labels.includes("webfont") ? "loaded webfont" : labels ? "long serif labels" : "short labels"} entrance progresses on activation and replay`, async ({
        page,
      }, info) => {
        await page.clock.install();
        await page.clock.pauseAt(new Date());
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.goto(
          `http://127.0.0.1:${port}/entrance.html?family=${family}&deferred${fixed ? "&fixed" : ""}${labels}`,
        );
        await page.evaluate(() => document.fonts.ready);
        if (labels.includes("webfont")) {
          await page.evaluate(async () => {
            await document.fonts.load('12px "Entrance Font"', "980 fulfilled orders");
          });
        }
        await page.getByRole("button", { name: "Activate", exact: true }).click();
        const clip = page.locator('[data-kind-ui="bar-reveal"]');
        for (const phase of ["activation", "replay"]) {
          if (phase === "replay")
            await page.getByRole("button", { name: "Replay", exact: true }).click();
          // ResponsiveContainer mounts the chart asynchronously. Start the
          // animation clock only after that mount, rather than racing its observer.
          await expect(clip).toHaveCount(1, { timeout: 1000 });
          await page.clock.runFor(240);
          await expect(clip).toHaveCount(1, { timeout: 1000 });
          const early = await sample(page);
          expect(early.height).toBeGreaterThan(0);
          expect(early.height).toBeLessThan(200);
          await page.screenshot({ path: info.outputPath(`${phase}-early.png`) });
          await page.clock.runFor(300);
          const later = await sample(page);
          expect(later.height).toBeGreaterThan(early.height);
          expect(later.height).toBeLessThan(200);
          expect(later.intersection).toBeGreaterThan(early.intersection);
          await page.screenshot({ path: info.outputPath(`${phase}-later.png`) });
          await page.clock.runFor(1000);
          await expect(clip).toHaveCount(0);
          await expect(page.locator(".recharts-bar")).toHaveCSS("clip-path", "none");
        }
      });
    }
  }
  test(`${family} genuine interruptions settle the entrance immediately`, async ({ page }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    for (const action of [
      "Data",
      "Visibility",
      "Resize",
      "pointer",
      "keyboard",
      "reduced",
      "early data",
      "early visibility",
      "early resize",
    ]) {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(`http://127.0.0.1:${port}/entrance.html?family=${family}&deferred`);
      await page.getByRole("button", { name: "Activate", exact: true }).click();
      const clip = page.locator('[data-kind-ui="bar-reveal"]');
      await expect(clip).toHaveCount(1);
      if (!action.startsWith("early")) await page.clock.runFor(240);
      if (action === "reduced") await page.emulateMedia({ reducedMotion: "reduce" });
      else if (action === "pointer") {
        const chart = await page.getByRole("application", { name: "Entrance proof" }).boundingBox();
        if (!chart) throw new Error("Missing chart");
        await page.mouse.move(chart.x + chart.width / 2, chart.y + chart.height / 2);
      } else if (action === "keyboard")
        await page.getByRole("application", { name: "Entrance proof" }).focus();
      else
        await page
          .getByRole("button", {
            name: action.startsWith("early")
              ? action.slice(6).replace(/^./, (letter) => letter.toUpperCase())
              : action,
            exact: true,
          })
          .click();
      // Flush ResponsiveContainer's observer-driven update, without advancing the entrance.
      await page.clock.runFor(32);
      await expect(clip).toHaveCount(0);
    }
  });
  test(`${family} an initially zero-width responsive host begins when measured`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`http://127.0.0.1:${port}/entrance.html?family=${family}&zero`);
    await page.clock.runFor(1200);
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Expand", exact: true }).click();
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(1);
    await page.clock.runFor(240);
    await expect(page.locator('[data-kind-ui="bar-reveal"]')).toHaveCount(1);
    const early = await sample(page);
    await page.clock.runFor(300);
    expect((await sample(page)).height).toBeGreaterThan(early.height);
  });
  test(`${family} label and font measurements after the first frame settle immediately`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    for (const action of ["Labels", "Font"]) {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(`http://127.0.0.1:${port}/entrance.html?family=${family}&long&deferred`);
      await page.getByRole("button", { name: "Activate", exact: true }).click();
      const clip = page.locator('[data-kind-ui="bar-reveal"]');
      await expect(clip).toHaveCount(1);
      await page.clock.runFor(240);
      await page.getByRole("button", { name: action, exact: true }).click();
      await expect(clip).toHaveCount(0);
    }
  });
}
