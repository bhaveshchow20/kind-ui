import { expect, test } from "@playwright/test";

for (const runtime of ["vite", "next"] as const) {
  test(`${runtime} Funnel packed boundary retains records, ratios and inspection`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(runtime === "next" ? String(testInfo.project.metadata.nextURL) : "/");
    const region = page.getByRole("region", { name: "Funnel integration" });
    const stages = region.locator('[data-kind-ui="funnel-stage"]');
    await expect(stages).toHaveCount(3);
    await stages.first().focus();
    await expect(region.getByRole("tooltip")).toContainText("Submitted");
    await expect(region.getByRole("tooltip")).toContainText("100%");
    await stages.first().press("ArrowDown");
    await expect(region.getByRole("tooltip")).toContainText("Reviewed");
    await expect(region.getByRole("tooltip")).toContainText("50%");
    await expect(region.getByRole("table", { name: "Application stages" })).toContainText(
      "Unknown",
    );
    await expect(stages.last()).toHaveAttribute("data-value-state", "unknown");
    await expect(stages.last().locator('[data-kind-ui="funnel-mark"]')).toHaveCount(0);
    await stages.first().focus();
    await stages.first().press("Enter");
    await expect(region.getByLabel("Funnel integration inspection")).toHaveText("submitted");
    expect(errors).toEqual([]);
  });
}
