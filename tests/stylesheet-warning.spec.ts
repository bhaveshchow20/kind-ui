import { expect, test } from "@playwright/test";

const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
for (const [mode, port] of [
  ["development", 4200],
  ["production", 4201],
] as const) {
  test(`Tailwind source setup styles packed SSR roots in ${mode}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.text().includes("Kind UI chart styles"))
        errors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port + offset}`);
    await expect(page.locator("body")).toHaveAttribute("data-hydrated", "true");
    const roots = page.locator('[data-kind-ui="chart"]');
    await expect(roots).toHaveCount(2);
    await expect(roots.first()).toHaveCSS("min-width", "0px");
    await expect(roots.first()).toHaveCSS(
      "width",
      await roots.first().evaluate((el) => `${el.parentElement!.clientWidth}px`),
    );
    await page.getByRole("button", { name: "Unmount", exact: true }).click();
    await expect(roots).toHaveCount(0);
    await page.getByRole("button", { name: "Mount", exact: true }).click();
    await expect(roots).toHaveCount(2);
    await expect(roots.first()).toHaveCSS("min-width", "0px");
    expect(errors).toEqual([]);
  });
}
