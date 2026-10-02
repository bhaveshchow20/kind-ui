import { expect, test } from "./browser";

for (const phone of [false, true]) {
  test(`scatter recipes ${phone ? "phone" : "desktop"} show numeric relationships, bubbles and truthful raw size values`, async ({
    page,
  }, info) => {
    if (phone) await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/scatters.html");
    await expect(page.getByRole("heading", { name: "Relationships, at a glance." })).toBeVisible();
    const relationship = page.getByRole("application", { name: "Latency and acceptance by task" });
    const bubble = page.getByRole("application", {
      name: "Task latency acceptance and request volume",
    });
    const signed = page.getByRole("application", { name: "Cost and quality change by team" });
    const coverage = page.getByRole("application", { name: "Coverage and adoption by region" });
    await expect(relationship.locator(".recharts-scatter-symbol path:not(defs path)")).toHaveCount(
      11,
    );
    await expect(bubble.locator(".recharts-scatter-symbol path:not(defs path)")).toHaveCount(6);
    await expect(signed.locator(".recharts-scatter-symbol path:not(defs path)")).toHaveCount(7);
    await expect(coverage.locator(".recharts-scatter-symbol path:not(defs path)")).toHaveCount(4);
    const sizes = await bubble
      .locator(".recharts-scatter-symbol path:not(defs path)")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
    expect(new Set(sizes).size).toBe(6);
    await relationship.locator(".recharts-scatter-symbol path:not(defs path)").first().hover();
    let tip = page.locator('[data-kind-ui="chart-tooltip"]').first();
    await expect(tip).toContainText("Search");
    await expect(tip).toContainText("28 ms");
    await expect(tip).toContainText("84%");
    await page.getByRole("button", { name: "Weekend", exact: true }).click();
    await expect(relationship.locator(".recharts-scatter-symbol path:not(defs path)")).toHaveCount(
      6,
    );
    await page.getByRole("button", { name: "Weekend", exact: true }).click();
    await page.getByRole("button", { name: "Next week", exact: true }).click();
    await relationship.locator(".recharts-scatter-symbol path:not(defs path)").first().hover();
    await expect(tip).toContainText("25 ms");
    await expect(tip).toContainText("81%");
    await page.getByRole("button", { name: "Current week", exact: true }).click();
    await coverage.locator(".recharts-scatter-symbol path:not(defs path)").nth(0).hover();
    tip = page.locator('[data-kind-ui="chart-tooltip"]').last();
    await expect(tip).toContainText("North");
    await expect(tip).toContainText("0k");
    await coverage.locator(".recharts-scatter-symbol path:not(defs path)").nth(2).hover();
    await expect(tip).toContainText("South");
    await expect(tip).toContainText("No data");
    await page.getByText("View observations", { exact: true }).last().click();
    await expect(page.getByRole("row", { name: "Central 52 91 -12", exact: true })).toBeVisible();
    await page.getByText("View observations", { exact: true }).last().click();
    await page.getByRole("checkbox", { name: "Motion", exact: true }).check();
    await expect(page.locator('[data-kind-ui="line-frame"][data-motion="off"]')).toHaveCount(4);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBeTruthy();
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: info.outputPath(`scatter-recipes-${phone ? "phone" : "desktop"}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
