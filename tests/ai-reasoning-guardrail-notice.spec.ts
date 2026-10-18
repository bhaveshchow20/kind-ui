import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?component=guardrail-notice");
});

test("guardrail choices request the exact current object once per pointer or keyboard activation without submitting", async ({
  page,
}) => {
  const root = page.getByTestId("notice");
  const summary = root.getByRole("button", { name: "A safe summary", exact: true });
  const example = root.getByRole("button", { name: "A safe example", exact: true });
  await expect(summary).toHaveAttribute("type", "button");
  await summary.click();
  await expect(page.getByTestId("picks")).toHaveText("1");
  await expect(page.getByTestId("picked")).toHaveText("summary:A safe summary");
  await expect(page.getByTestId("identity")).toHaveText("true");
  await summary.press("Enter");
  await expect(page.getByTestId("picks")).toHaveText("2");
  await summary.press("Space");
  await expect(page.getByTestId("picks")).toHaveText("3");
  await summary.press("Tab");
  await expect(example).toBeFocused();
  await example.press("Enter");
  await expect(page.getByTestId("picks")).toHaveText("4");
  await expect(page.getByTestId("picked")).toHaveText("example:A safe example");
  await expect(page.getByTestId("submits")).toHaveText("0");
});

test("guardrail choices respect global, individual and prevented activation while host busy state remains explicit", async ({
  page,
}) => {
  const root = page.getByTestId("notice");
  const summary = root.getByRole("button", { name: "A safe summary", exact: true });
  const blocked = root.getByRole("button", { name: "Unavailable choice", exact: true });
  await expect(blocked).toBeDisabled();
  await blocked.evaluate((element) => {
    if (element instanceof HTMLButtonElement) element.click();
  });
  await page.getByRole("button", { name: "Toggle disabled", exact: true }).click();
  for (const button of await root.getByRole("button").all()) await expect(button).toBeDisabled();
  await summary.evaluate((element) => {
    if (element instanceof HTMLButtonElement) element.click();
  });
  await expect(page.getByTestId("picks")).toHaveText("0");
  await page.getByRole("button", { name: "Toggle disabled", exact: true }).click();
  await page.getByRole("button", { name: "Toggle prevented activation", exact: true }).click();
  await summary.click();
  await expect(page.getByTestId("picks")).toHaveText("0");
  await page.getByRole("button", { name: "Toggle prevented activation", exact: true }).click();
  await page.getByRole("button", { name: "Toggle busy", exact: true }).click();
  await expect(root).toHaveAttribute("aria-busy", "true");
  await expect(summary).toBeEnabled();
  await summary.click();
  await summary.click();
  await expect(page.getByTestId("picks")).toHaveText("2");
  await expect(root).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Toggle busy", exact: true }).click();
  await expect(root).toHaveAttribute("aria-busy", "false");
});

test("guardrail controls retain focus and identity across reorder and text changes", async ({
  page,
}) => {
  const root = page.getByTestId("notice");
  const summary = root.getByRole("button", { name: "A safe summary", exact: true });
  const original = await summary.elementHandle();
  expect(original).not.toBeNull();
  await summary.focus();
  await page.getByRole("button", { name: "Reverse choices", exact: true }).evaluate((element) => {
    if (element instanceof HTMLButtonElement) element.click();
  });
  await expect(summary).toBeFocused();
  expect(
    await original?.evaluate(
      (element) => element.isConnected && element === document.activeElement,
    ),
  ).toBe(true);
  await expect(root.getByRole("listitem").first()).toHaveText("Unavailable choice");
  await page.getByRole("button", { name: "Update summary", exact: true }).evaluate((element) => {
    if (element instanceof HTMLButtonElement) element.click();
  });
  const updated = root.getByRole("button", { name: "Updated summary", exact: true });
  await expect(updated).toBeFocused();
  expect(
    await original?.evaluate(
      (element) => element.isConnected && element === document.activeElement,
    ),
  ).toBe(true);
  await updated.press("Enter");
  await expect(page.getByTestId("picked")).toHaveText("summary:Updated summary");
  await expect(page.getByTestId("identity")).toHaveText("true");
  await expect(page.getByTestId("picks")).toHaveText("1");
});

test("guardrail static recovery, optional policy and literal strings retain supplied content", async ({
  page,
}) => {
  const root = page.getByTestId("notice");
  await page.getByRole("button", { name: "Toggle actions", exact: true }).click();
  await expect(root.getByRole("button")).toHaveCount(0);
  await expect(root.getByRole("listitem")).toHaveCount(3);
  await expect(root.getByRole("listitem").first()).toHaveText("A safe summary");
  await page.getByRole("button", { name: "Empty policy", exact: true }).click();
  await expect(root.locator('[data-slot="badge"]')).toHaveCount(1);
  await expect(root.locator('[data-slot="badge"]')).toHaveText("");
  await page.getByRole("button", { name: "Omit policy", exact: true }).click();
  await expect(root.locator('[data-slot="badge"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Literal content", exact: true }).click();
  await expect(root.locator('[data-slot="guardrail-notice-title"]')).toHaveText(
    "<b>Literal title</b>",
  );
  await expect(root.locator('[data-slot="guardrail-notice-explanation"]')).toHaveText(
    "<em>Literal explanation</em>",
  );
  await expect(root.locator('[data-slot="badge"]')).toHaveText("<i>Literal policy</i>");
  await expect(root.getByRole("listitem")).toHaveText("<script>Literal choice</script>");
  await expect(root.locator("b, em, i, strong, script")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear choices", exact: true }).click();
  await expect(root.locator('[data-slot="guardrail-notice-alternatives"]')).toHaveCount(0);
  await expect(root.getByRole("list")).toHaveCount(0);
});

test("guardrail native refs, naming, role and render handlers compose with Callout", async ({
  page,
}) => {
  const root = page.getByTestId("notice");
  await expect(root).toHaveAttribute("role", "note");
  await expect(root).toHaveAccessibleName("Request warning");
  await expect(root).not.toHaveAttribute("aria-live");
  await expect(root).toHaveAttribute("data-slot", "callout");
  await expect(root).toHaveAttribute("data-tone", "warning");
  await expect(root).toHaveAttribute("data-guardrail-notice", "");
  await expect(root).toHaveAttribute("id", "host-notice");
  await expect(root).toHaveClass(/host-notice-class/);
  await expect(root).toHaveCSS("outline-color", "rgb(1, 2, 3)");
  await expect(root.locator('[data-slot="callout-icon"]')).toHaveAttribute("aria-hidden", "true");
  await expect(root.locator('[data-slot="callout-content"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Focus notice ref", exact: true }).click();
  await expect(page.getByTestId("ref-tag")).toHaveText("DIV");
  await expect(root).toBeFocused();
  await root.locator('[data-slot="guardrail-notice-title"]').click();
  await expect(page.getByTestId("clicks")).toHaveText("1");
  const composed = page.getByTestId("composed-notice");
  expect(await composed.evaluate((element) => element.tagName)).toBe("SECTION");
  await expect(composed).toHaveAttribute("role", "alert");
  await expect(composed).toHaveAttribute("aria-live", "assertive");
  await expect(composed).toHaveAccessibleName("Composed warning");
  await composed.click();
  await expect(page.getByTestId("clicks")).toHaveText("2");
  await expect(page.getByTestId("render-clicks")).toHaveText("1");
  expect(await page.getByTestId("function-notice").evaluate((element) => element.tagName)).toBe(
    "ARTICLE",
  );
});

test("guardrail literal content and recovery controls wrap in a narrow container and forced colors", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole("button", { name: "Long content", exact: true }).click();
  const root = page.getByTestId("notice");
  for (const locator of [
    root,
    root.locator('[data-slot="callout-content"]'),
    root.locator('[data-slot="guardrail-notice-title"]'),
    root.locator('[data-slot="guardrail-notice-explanation"]'),
    root.locator('[data-slot="badge"]'),
    root.getByRole("button"),
  ]) {
    const geometry = await locator.evaluate((element) => ({
      width: element.getBoundingClientRect().width,
      scroll: element.scrollWidth,
      client: element.clientWidth,
      overflow: getComputedStyle(element).textOverflow,
    }));
    expect(geometry.width).toBeLessThanOrEqual(240);
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
    expect(geometry.overflow).not.toBe("ellipsis");
  }
  await page.emulateMedia({ forcedColors: "active" });
  const choice = root.getByRole("button");
  await expect(choice).toBeVisible();
  await choice.focus();
  await expect(choice).toBeFocused();
  await choice.press("Enter");
  await expect(page.getByTestId("picks")).toHaveText("1");
});

for (const initialPreference of ["no-preference", "reduce"] as const) {
  test(`guardrail actions inherit Button feedback with initial ${initialPreference} and live reduced-motion updates`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: initialPreference });
    await page.reload();
    const root = page.getByTestId("notice");
    const original = await root.elementHandle();
    const summary = root.getByRole("button", { name: "A safe summary", exact: true });
    let picks = 0;

    for (const reducedMotion of [initialPreference, "reduce", "no-preference", "reduce"] as const) {
      await page.emulateMedia({ reducedMotion });
      await expect(root).toHaveCSS("animation-name", "none");
      await expect(root).toHaveCSS("transform", "none");
      await expect(root).toHaveCSS("opacity", "1");
      await summary.focus();
      await summary.scrollIntoViewIfNeeded();
      const box = await summary.boundingBox();
      if (!box) throw new Error("Missing recovery button geometry");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      if (reducedMotion === "reduce") {
        await expect(summary).toHaveCSS("transform", "none");
        await expect(summary).toHaveCSS("transition-property", "none");
      } else {
        await expect
          .poll(() =>
            summary.evaluate(
              (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
            ),
          )
          .toBeLessThan(0.999);
      }
      await expect(page.getByTestId("picks")).toHaveText(String(picks));
      await page.mouse.up();
      picks += 1;
      await expect(page.getByTestId("picks")).toHaveText(String(picks));
      await expect(summary).toBeFocused();
      await expect(root).toHaveAttribute("role", "note");
      await expect(root).toHaveAttribute("aria-busy", "false");
      await expect(page.getByTestId("picked")).toHaveText("summary:A safe summary");
      expect(await original?.evaluate((element) => element.isConnected)).toBe(true);
    }
  });
}
