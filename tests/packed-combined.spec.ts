import { expect, test } from "@playwright/test";

for (const material of ["paper", "clay", "glow"]) {
  test(`packed area/bar ${material} filters and visibility remain independent`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4184/combined.html");
    const area = page.getByRole("region", { name: "area", exact: true });
    const bar = page.getByRole("region", { name: "bar", exact: true });
    const geometry = () =>
      page
        .locator(".recharts-area-area, .recharts-bar-rectangle path")
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    const before = await geometry();
    await area.getByRole("combobox").selectOption(material);
    await bar.getByRole("combobox").selectOption(material);
    await expect(page.locator("filter")).toHaveCount(4);
    expect(await geometry()).toEqual(before);
    const ids = await page.locator("filter").evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(4);
    expect(
      await page.locator(".recharts-area-area, .recharts-bar-rectangle path").evaluateAll((nodes) =>
        nodes.every((node) => {
          const id = node.getAttribute("filter")?.match(/^url\(#(.+)\)$/)?.[1];
          return Boolean(id && node.closest("svg")?.querySelector(`[id="${id}"]`));
        }),
      ),
    ).toBe(true);
    await area.getByRole("button", { name: "Value", exact: true }).click();
    await expect(area.locator(".recharts-area-area")).toHaveCount(1);
    await expect(bar.locator(".recharts-bar")).toHaveCount(2);
    await bar.getByRole("button", { name: "Other", exact: true }).click();
    await expect(bar.locator(".recharts-bar")).toHaveCount(1);
    await expect(area.locator(".recharts-area-area")).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}
