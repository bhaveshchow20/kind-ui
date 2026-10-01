import { expect, type Locator, test } from "@playwright/test";

async function alpha(path: Locator) {
  return path.evaluate((node) => {
    let opacity = 1;
    for (
      let current: Element | null = node;
      current && current instanceof SVGElement;
      current = current.parentElement
    )
      opacity *= Number(getComputedStyle(current).opacity);
    return opacity;
  });
}

test("packed restored series have a visibility transition in both toggle orders", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("http://127.0.0.1:4176/motion.html");
  await page.clock.runFor(1200);
  for (const [name, selector] of [
    ["Other", ".recharts-line-curve:not(.host-shape)"],
    ["Value", ".host-shape"],
  ] as const) {
    const button = page.getByRole("button", { name, exact: true });
    await button.evaluate((node) => (node as HTMLButtonElement).click());
    await page.clock.runFor(400);
    await expect(page.locator(selector)).toHaveCount(0);
    await button.evaluate((node) => (node as HTMLButtonElement).click());
    await page.clock.runFor(40);
    expect(await alpha(page.locator(selector))).toBeGreaterThan(0);
    expect(await alpha(page.locator(selector))).toBeLessThan(1);
    await page.clock.runFor(400);
    expect(await alpha(page.locator(selector))).toBe(1);
  }
});

test("comparison chart stays mounted through all-hidden recovery", async ({ page }) => {
  await page.goto("/recipes.html");
  const comparison = page.getByRole("region", { name: "Week over week" });
  const svg = await comparison.getByRole("application").elementHandle();
  if (!svg) throw new Error("Missing chart SVG");
  await comparison.getByRole("button", { name: "This week", exact: true }).click();
  await comparison.getByRole("button", { name: "Last week", exact: true }).click();
  expect(await svg.evaluate((node) => node.isConnected)).toBe(true);
  await expect(comparison.getByRole("status")).toHaveText("Select a series to show it.");
});
