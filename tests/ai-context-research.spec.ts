import { expect, test } from "@playwright/test";

test("disabled citation anchors block navigation and retain consumer cancellation", async ({
  page,
}) => {
  await page.goto("/");
  const index = page.getByTestId("carousel-index");
  await expect(index).toHaveAttribute("data-ready", "true");
  await page.getByRole("link", { name: "Next source" }).click();
  await expect(index).toHaveText("0");
  await expect(page.getByTestId("carousel-calls")).toHaveText("0");
  await expect(page).not.toHaveURL(/#/);
  await page.getByLabel("Disabled controls").uncheck();
  await page.getByRole("link", { name: "Previous source" }).click();
  await expect(index).toHaveText("0");
  await expect(page).not.toHaveURL(/#/);
  await page.getByLabel("Cancel consumer action").check();
  await page.getByRole("link", { name: "Next source" }).click();
  await expect(page.getByTestId("carousel-calls")).toHaveText("1");
  await expect(index).toHaveText("0");
  await expect(page).not.toHaveURL(/#/);
  await page.getByLabel("Cancel consumer action").uncheck();
  await page.getByRole("link", { name: "Next source" }).click();
  await expect(index).toHaveText("1");
  await page.getByLabel("Disabled controls").check();
  await page.getByRole("link", { name: "Previous source" }).click();
  await expect(index).toHaveText("1");
  await expect(page.getByTestId("carousel-calls")).toHaveText("2");
  await expect(page).toHaveURL(/#next$/);
});

test("iframe selection ignores inside outside-press and still dismisses outside content", async ({
  page,
}) => {
  await page.goto("/");
  const frame = page.frameLocator('iframe[title="Selection document"]');
  const passage = frame.getByTestId("selection-text");
  await passage.evaluate((element) => {
    const document = element.ownerDocument;
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
  const toolbar = frame.getByRole("dialog", { name: "Selection actions" });
  await expect(toolbar).toBeVisible();
  await expect(page.getByTestId("selection-changes")).toHaveText("[true]");
  expect(
    await page.evaluate(
      () => document.querySelector("iframe")?.contentDocument?.querySelector("p") instanceof Node,
    ),
  ).toBe(false);
  await passage.dispatchEvent("click", { button: 0 });
  await expect(toolbar).toBeVisible();
  await expect(page.getByTestId("selection-changes")).toHaveText("[true]");
  await frame.getByTestId("outside-selection").dispatchEvent("click", { button: 0 });
  await expect(toolbar).toHaveCount(0);
  await expect(page.getByTestId("selection-changes")).toHaveText("[true,false]");
});
