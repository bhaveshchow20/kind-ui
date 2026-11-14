import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Dialog retains edits, traps focus, closes nested menus and restores its trigger", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Edit working note", exact: true });
  await trigger.press("Enter");
  const dialog = page.getByRole("dialog", { name: "A useful next step", exact: true });
  const input = dialog.getByRole("textbox", { name: "Working note", exact: true });
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Save note", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  const actions = dialog.getByRole("button", { name: "Note actions", exact: true });
  await actions.press("ArrowDown");
  await expect(page.getByRole("menu", { name: "Note actions", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(actions).toBeFocused();
  await expect(dialog).toBeVisible();
  await input.fill("A focused shared brief");
  await dialog.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(input).toHaveValue("A focused shared brief");
  await expect(dialog).toHaveCSS("transition-property", "none");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("Combobox separates query and selection, honors cancellation and skips disabled items", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Project or region", exact: true });
  const status = page.locator('[data-slot="combobox-status"]');
  await input.fill("Atlas");
  await input.press("Enter");
  await expect(status).toHaveText("Selected: Atlas");
  await input.fill("Fieldnotes");
  const option = page.getByRole("option", { name: "Fieldnotes", exact: true });
  await option.evaluate((element) =>
    element.addEventListener("click", (event) => event.preventDefault(), { once: true }),
  );
  await option.click();
  await expect(status).toHaveText("Selected: Atlas");
  await option.click();
  await expect(status).toHaveText("Selected: Fieldnotes");
  await input.fill("Archive");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(status).toHaveText("Selected: Fieldnotes");
  await input.fill("no match");
  await expect(page.getByText("No destinations match your search.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear destination", exact: true }).click();
  await expect(input).toHaveValue("");
});

test("Popover and Menu dismiss with Escape, and hover previews retain native links", async ({
  page,
}) => {
  await page.goto("/");
  const popover = page.getByRole("button", { name: "Edit detail", exact: true });
  await popover.click();
  await expect(page.getByRole("textbox", { name: "Detail", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popover).toBeFocused();
  const menu = page.getByRole("button", { name: "More actions", exact: true });
  await menu.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Copy detail", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  const link = page.getByRole("link", { name: "a practical launch brief", exact: true });
  await link.hover();
  await expect(page.getByTestId("hover-card-state")).toHaveText("Preview open");
  await expect(link).toHaveAttribute("href", /^#/);
  await link.click();
  await expect(page.getByRole("article")).toBeVisible();
});

test("closed disclosure stays inert and Table fullscreen returns keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  const preview = page.locator('[data-slot="collapsible-preview-inner"]');
  await expect(preview).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Toggle preview", exact: true }).click();
  await expect(preview).not.toHaveAttribute("inert");
  const trigger = page.getByRole("button", { name: "View fullscreen", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("CodeBlock announces clipboard failure and allows retry", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new DOMException("Denied", "NotAllowedError")),
      },
    });
  });
  await page.goto("/");
  const copy = page.getByRole("button", { name: "Copy Code", exact: true });
  await copy.click();
  await expect(page.locator('[data-slot="code-block"]')).toContainText("Unable to copy");
  await expect(copy).toBeEnabled();
});

test("primitive-only styles fit narrow light and dark views without accessibility violations", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  for (const dark of [false, true]) {
    await page
      .locator("html")
      .evaluate((element, enabled) => element.classList.toggle("dark", enabled), dark);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const audit = await new AxeBuilder({ page }).analyze();
    expect(audit.violations).toEqual([]);
  }
  await expect(page.locator('[data-slot="code-block-pre"]')).toHaveCSS("font-size", "13px");
  await expect(page.locator('[data-slot="code-block-language"]')).toHaveCSS("font-size", "12px");
  expect(errors).toEqual([]);
});

test("preview mounted expanded keeps observing growth and shrinkage after closing", async ({
  page,
}) => {
  await page.goto("/?previewOpen");
  const preview = page.locator('[data-slot="collapsible-preview-inner"]');
  const content = preview.locator(":scope > div");
  await expect(preview).not.toHaveAttribute("inert");
  await content.evaluate((element) => {
    element.style.height = "24px";
    element.style.lineHeight = "24px";
  });
  await page.getByRole("button", { name: "Toggle preview", exact: true }).click();
  await expect(preview).not.toHaveAttribute("inert");
  await content.evaluate((element) => {
    element.style.height = "96px";
  });
  await expect(preview).toHaveAttribute("inert", "");
  await content.evaluate((element) => {
    element.style.height = "24px";
  });
  await expect(preview).not.toHaveAttribute("inert");
  await content.evaluate((element) => {
    element.style.height = "auto";
    element.textContent = "New streamed content ".repeat(30);
  });
  await expect(preview).toHaveAttribute("inert", "");
  await content.evaluate((element) => {
    element.textContent = "Short";
  });
  await expect(preview).not.toHaveAttribute("inert");
});

test("table copy keeps nested table text in its cell without adding nested rows or columns", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedTable: string }).copiedTable = text;
        },
      },
    });
  });
  await page.goto("/");
  const table = page.locator('[data-slot="table-viewport"] > table');
  await table.evaluate((element) => {
    const header = element.querySelector("thead th");
    const cell = element.querySelector("tbody td");
    if (!header || !cell) throw new Error("Missing outer table cells");
    for (const target of [header, cell]) {
      const nested = document.createElement("table");
      nested.innerHTML =
        "<thead><tr><th>Nested heading</th></tr></thead><tbody><tr><td>Nested value</td></tr></tbody>";
      target.append(nested);
    }
    const extraBody = document.createElement("tbody");
    extraBody.innerHTML = "<tr><th>South</th><td>2</td></tr>";
    element.append(extraBody);
  });
  await page.getByRole("button", { name: "Copy table", exact: true }).click();
  await page.getByRole("menuitem", { name: "Copy table as CSV", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { copiedTable: string }).copiedTable))
    .toBe("RegionNested headingNested value,Total\nNorthNested headingNested value,0\nSouth,2");
});
