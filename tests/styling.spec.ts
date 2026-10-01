import { expect, test } from "@playwright/test";

test("packed production CSS supplies defaults and permits plain CSS and native overrides", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4174");
  const defaults = page.getByRole("region", { name: "Defaults" });
  const custom = page.getByRole("region", { name: "Overrides" });
  const part = (name: string) => `[data-kind-ui="chart-${name}"]`;
  await expect(defaults.locator(part("legend"))).toHaveCSS("display", "flex");
  await expect(defaults.locator(part("legend"))).toHaveCSS("gap", "12px");
  await expect(defaults.getByRole("button", { name: "Alpha", exact: true })).toHaveCSS(
    "padding",
    "4px 8px",
  );
  await expect(defaults.locator(part("tooltip"))).toHaveCSS("padding", "7px 9px");
  await expect(defaults.locator(part("tooltip"))).toHaveCSS("font-size", "12px");
  await expect(defaults.locator(`${part("legend")} ${part("indicator")}`).first()).toHaveCSS(
    "width",
    "8px",
  );
  await expect(defaults.locator(`${part("tooltip")} ${part("indicator")}`).first()).toHaveCSS(
    "width",
    "3px",
  );

  await expect(custom.locator('[data-kind-ui="chart"]')).toHaveCSS("width", "320px");
  await expect(custom.locator(part("legend"))).toHaveCSS("row-gap", "19px");
  await expect(custom.locator(part("legend"))).toHaveCSS("column-gap", "17px");
  const alpha = custom.getByRole("button", { name: "Alpha", exact: true });
  await expect(alpha).toHaveCSS("padding", "3px 7px");
  await expect(alpha).toHaveCSS("border-width", "2px");
  await expect(alpha).toHaveCSS("border-color", "rgb(120, 40, 80)");
  await expect(alpha).toHaveCSS("background-color", "rgb(220, 230, 240)");
  await expect(alpha).toHaveCSS("border-radius", "11px");
  await expect(custom.locator(part("tooltip"))).toHaveCSS("padding-top", "3px");
  await expect(custom.locator(part("tooltip"))).toHaveCSS("padding-bottom", "5px");
  await expect(custom.locator(part("tooltip"))).toHaveCSS("font-size", "19px");
  await expect(custom.locator(part("tooltip"))).toHaveCSS("background-color", "rgb(240, 245, 250)");
  await custom.getByRole("button", { name: "Reverse series" }).click();
  await expect(custom.locator(`${part("legend")} button`)).toHaveText(["Beta", "Alpha"]);
  for (const marker of await custom.locator(`[data-series="alpha"] ${part("indicator")}`).all()) {
    await expect(marker).toHaveCSS("border-radius", "50%");
    await expect(marker).toHaveCSS("background-color", "rgb(51, 68, 85)");
  }
  await alpha.focus();
  await page.keyboard.press("Space");
  await expect(alpha).toBeFocused();
  await expect(alpha).toHaveAttribute("aria-pressed", "false");
  await expect(alpha).toHaveCSS("text-decoration-line", "line-through");
  await expect(custom.locator(`${part("tooltip")} [data-series="alpha"]`)).toHaveCount(0);
});

test("Tailwind utility layer overrides component defaults without important rules", async ({
  page,
}) => {
  await page.goto("/contracts.html");
  const a = page.getByRole("region", { name: "A", exact: true });
  const legend = a.getByRole("list");
  await expect(legend).toHaveCSS("gap", "19px");
  await expect(legend).toHaveCSS("padding", "7px");
  await expect(legend).toHaveCSS("font-size", "17px");
  const button = a.getByRole("button", { name: "A tasks" });
  await expect(button).toHaveCSS("padding", "3px");
  await a.getByLabel("Hold A changes").uncheck();
  await button.click();
  await a.getByRole("application").focus();
  await page.keyboard.press("ArrowRight");
  const tooltip = a.getByRole("status", { name: "A tooltip" });
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS("padding", "5px");
  await expect(tooltip).toHaveCSS("font-size", "18px");
});
