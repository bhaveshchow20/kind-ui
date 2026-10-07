import { expect, test } from "@playwright/test";

const families = [
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
];

for (const width of [375, 1280]) {
  for (const family of families) {
    test(`${family}: every example, control, legend and code copy at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (value: string) => {
              sessionStorage.setItem("copied-example", value);
            },
          },
        });
      });
      await page.goto("./");
      await page.getByRole("tab", { name: family, exact: true }).click();
      const examples = await page.locator(".tile-open").count();
      for (let index = 0; index < examples; index++) {
        const card = page.locator(".demo-grid .chart-card").nth(index);
        const legend = card.getByRole("checkbox").first();
        if (await legend.count()) {
          await legend.uncheck();
          await expect(legend).not.toBeChecked();
          await legend.check();
          await expect(legend).toBeChecked();
        }
        if (family === "Heatmap") {
          await expect(card.locator("caption")).toHaveCSS("clip-path", "inset(50%)");
        }
        const trigger = page.locator(".tile-open").nth(index);
        await trigger.click();
        const dialog = page.getByRole("dialog");
        const controls = dialog.locator(".demo-controls > div");
        const controlCount = (await dialog
          .getByRole("heading", { name: "Gauge Chart", exact: true })
          .count())
          ? 5
          : 4;
        await expect(controls).toHaveCount(controlCount);
        await expect(dialog.getByRole("link", { name: "Go to Documentation" })).toHaveAttribute(
          "href",
          /components\//,
        );
        await dialog.getByRole("tab", { name: "Code", exact: true }).click();
        const code = dialog.getByRole("region", { name: "Chart example code" });
        let previous = await code.textContent();
        for (let controlIndex = 0; controlIndex < controlCount; controlIndex++) {
          await dialog.getByRole("tab", { name: "Preview", exact: true }).click();
          const control = controls.nth(controlIndex);
          const slider = control.getByRole("slider");
          const toggle = control.getByRole("switch");
          if (await slider.count()) {
            const before = await slider.getAttribute("aria-valuenow");
            const max = await slider.getAttribute("aria-valuemax");
            await slider.press(before === max ? "Home" : "End");
            await expect(slider).not.toHaveAttribute("aria-valuenow", before ?? "");
          } else if (await toggle.count()) {
            const checked = await toggle.getAttribute("aria-checked");
            await toggle.click();
            await expect(toggle).not.toHaveAttribute("aria-checked", checked ?? "");
          } else {
            const choice = control.locator('[role="radio"][aria-checked="false"]').first();
            const label = await choice.getAttribute("aria-label");
            await choice.check();
            await expect(
              control.getByRole("radio", { name: label ?? "", exact: true }),
            ).toBeChecked();
          }
          await dialog.getByRole("tab", { name: "Code", exact: true }).click();
          await expect
            .poll(() => code.textContent(), {
              message: `${family} example ${index + 1}, control ${controlIndex + 1} changes exported code`,
            })
            .not.toBe(previous);
          previous = await code.textContent();
        }
        const copy = dialog.getByRole("button", { name: "Copy code", exact: true });
        await expect(copy).toBeVisible();
        await copy.click();
        await expect(dialog.locator('.playground-footer [role="status"]')).toHaveText(
          "Code copied",
        );
        const copied = await page.evaluate(() => sessionStorage.getItem("copied-example"));
        expect(copied).toContain("@kind-ui/charts");
        expect(copied).not.toContain("paddingAngle");
        expect(copied).toContain("export function");
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
      }
      expect(errors).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
}
