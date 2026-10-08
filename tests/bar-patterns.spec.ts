import { expect, test } from "./browser";
import { expectDimmedPaint } from "./interaction-paint";

for (const horizontal of [false, true]) {
  test(`patterns preserve ${horizontal ? "horizontal" : "vertical"} bars and scoped resources`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:4183/?patterns${horizontal ? "&horizontal" : ""}`);
    const marks = page.locator(".recharts-bar-rectangle path");
    await expect(marks).toHaveCount(8);
    const patterns = page.locator('[data-kind-ui="fill-pattern"]');
    await expect(patterns).toHaveCount(8);
    const geometry = await marks.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("d")),
    );
    for (const kind of ["hatch", "stripe", "duotone"]) {
      await page.getByRole("button", { name: kind, exact: true }).click();
      expect(
        await marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))),
      ).toEqual(geometry);
      const ids = await patterns.evaluateAll((nodes) => nodes.map((node) => node.id));
      expect(new Set(ids).size).toBe(8);
      expect(
        await marks.evaluateAll((nodes) =>
          nodes.every((node) => {
            const id = node.getAttribute("fill")?.match(/^url\(#(.+)\)$/)?.[1];
            return id && node.closest("svg")?.querySelector(`[id="${id}"]`);
          }),
        ),
      ).toBe(true);
    }
    await page.getByRole("button", { name: "Material", exact: true }).click();
    await expect(page.locator('[data-kind-ui="bar-material"]')).toHaveCount(2);
    expect(await marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")))).toEqual(
      geometry,
    );
    for (const mode of ["fill", "style", "shape", "active", "off"]) {
      await page.getByRole("combobox", { name: "Override" }).selectOption(mode);
      await expect(patterns).toHaveCount(6);
      await expect(marks.first()).not.toHaveAttribute("fill", /kind-ui-pattern/);
      if (mode === "fill")
        await expect(marks.first()).toHaveAttribute("fill", "url(#host-gradient-0)");
      if (mode === "style") await expect(marks.first()).toHaveCSS("fill", "rgb(18, 52, 86)");
    }
    await page.getByRole("combobox", { name: "Override" }).selectOption("cell");
    await expect(patterns).toHaveCount(8);
    await expect(marks.first()).toHaveAttribute("fill", "#123456");
    await expect(marks.nth(1)).toHaveAttribute("fill", /kind-ui-pattern/);
    await page.getByRole("combobox", { name: "Override" }).selectOption("none");
    await page.getByRole("button", { name: "Stack", exact: true }).click();
    await expect(marks).toHaveCount(8);
    await expect(marks.first()).toHaveAttribute("fill", /kind-ui-pattern/);
    await page.getByRole("button", { name: "hatch", exact: true }).click();
    await page.getByRole("button", { name: "Theme", exact: true }).click();
    await expect(patterns.first().locator("path")).toHaveCSS("stroke", "rgb(255, 255, 255)");
    for (const media of [
      { media: "print" as const },
      { reducedMotion: "reduce" as const },
      { forcedColors: "active" as const },
    ]) {
      await page.emulateMedia(media);
      await expect(marks.first()).toHaveAttribute("fill", /kind-ui-pattern/);
      await expect(patterns).toHaveCount(8);
      if ("forcedColors" in media) {
        const inks = await page.locator("section").evaluate((section) => {
          const probe = document.createElement("span");
          probe.style.forcedColorAdjust = "none";
          section.append(probe);
          probe.style.color = "Canvas";
          const canvas = getComputedStyle(probe).color;
          probe.style.color = "CanvasText";
          const text = getComputedStyle(probe).color;
          probe.remove();
          return { canvas, text };
        });
        expect(inks.canvas).not.toBe(inks.text);
        await expect(patterns.first().locator("rect").first()).toHaveCSS("fill", inks.canvas);
        await expect(patterns.first().locator("path")).toHaveCSS("stroke", inks.text);
      }
      await expect(page.locator("pattern animate, pattern animateTransform")).toHaveCount(0);
    }
    await page.getByRole("button", { name: "First", exact: true }).first().click();
    await expect(marks).toHaveCount(8);
    await expectDimmedPaint(marks.nth(2));
    expect(await marks.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")))).toEqual(
      geometry,
    );
    await page.getByRole("button", { name: "First", exact: true }).first().click();
    await expect(marks).toHaveCount(8);
    expect(errors).toEqual([]);
  });
}
