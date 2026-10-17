import { expect, test } from "@playwright/test";

test("Prompt radios retain native ArrowLeft; the root keeps the step-back shortcut", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const prompt = page.locator('[data-slot="prompt"]');
  const first = page.getByRole("radio", { name: "Second A", exact: true });
  const second = page.getByRole("radio", { name: "Second B", exact: true });
  await second.check();
  await second.press("ArrowLeft");
  await expect(prompt).toHaveAttribute("data-step", "second");
  await expect(first).toBeChecked();
  await expect(first).toBeFocused();
  await first.press("ArrowRight");
  await expect(second).toBeChecked();
  await prompt.focus();
  await prompt.press("ArrowLeft");
  await expect(prompt).toHaveAttribute("data-step", "first");
});

for (const replacement of ["request", "state", "unmount"]) {
  test(`GeneratedImage ignores a stale rejection during ${replacement} commit`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: `Replace ${replacement}`, exact: true }).click();
    await expect(page.getByTestId("image-passive")).toHaveText(replacement);
    await expect(page.getByTestId("image-errors")).toHaveText("0");
    await expect(page.getByRole("alert")).toHaveCount(0);
    if (replacement === "request")
      await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeEnabled();
  });
}

test("GeneratedImage still reports current rejection and unlocks retry", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("button", { name: "Reject current action", exact: true }).click();
  await expect(page.getByTestId("image-errors")).toHaveText("1");
  await expect(page.getByRole("alert")).toHaveText("Request failed. Try again.");
  await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeEnabled();
});
