import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?component=loader");
});

test("Loader preserves native refs, render handlers and host cancellation", async ({ page }) => {
  await expect(page.getByTestId("loader-refs")).toHaveText("SPAN,P,BUTTON");
  const action = page.getByRole("button", { name: "Host action" });
  await action.click();
  await expect(page.getByTestId("loader-calls")).toHaveText("1");
  await expect(page.getByTestId("loader-render-calls")).toHaveText("1");
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("loader-calls")).toHaveText("2");
  await expect(page.getByTestId("loader-render-calls")).toHaveText("2");
  await page.getByRole("link", { name: "Host navigation" }).click();
  await expect(page.getByTestId("loader-cancelled")).toHaveText("true");
  await expect(page).not.toHaveURL(/#/);
  await page.getByLabel("Cancel navigation").uncheck();
  await page.getByRole("link", { name: "Host navigation" }).click();
  await expect(page).toHaveURL(/#loader-action$/);
});

test("Loader derives string labels and immediately preserves rich and numeric content", async ({
  page,
}) => {
  const loader = page.getByTestId("controlled-loader");
  await expect(loader).toHaveAccessibleName("Searching");
  await loader.evaluate((element) => element.setAttribute("data-identity", "retained"));
  await page.getByLabel("Loader content").fill("Searching the next source");
  await expect(loader).toHaveAccessibleName("Searching the next source");
  await page.getByLabel("Rich content").check();
  await expect(loader).not.toHaveAttribute("aria-label");
  await expect(loader.locator("strong")).toHaveText("Searching the next source");
  await expect(loader).toHaveAttribute("data-identity", "retained");
  await expect(page.getByTestId("numeric-loader")).toHaveText("0");
  await expect(page.getByTestId("numeric-loader")).not.toHaveAttribute("aria-label");
  await expect(page.getByTestId("rich-loader")).not.toHaveAttribute("aria-label");
  await expect(page.getByTestId("named-loader")).toHaveAccessibleName("Host named progress");
  await expect(page.getByTestId("native-loader")).toHaveAttribute("role", "note");
  await expect(page.getByTestId("native-loader")).toHaveAccessibleName("Host label");
  await expect(page.getByTestId("native-loader")).toHaveAttribute("aria-live", "off");
  await expect(page.getByTestId("dots-loader").locator('[aria-hidden="true"]')).toHaveCount(1);
});

test("Loader and Shimmer keep invalid values and overflow out of owned inline styles", async ({
  page,
}) => {
  const loader = page.getByTestId("controlled-loader");
  const shimmer = page.getByTestId("controlled-shimmer");
  for (const numericCase of ["nan", "infinity", "negativeInfinity"]) {
    await page.getByLabel("Numeric case").selectOption(numericCase);
    await expect(loader).toHaveCSS("--kind-loader-duration", "1.4s");
    await expect(loader).toHaveCSS("--kind-loader-spread", "40%");
    await expect(shimmer).toHaveCSS("--kind-loader-duration", "2s");
    await expect(shimmer).toHaveCSS("--kind-loader-spread", "8px");
  }
  await page.getByLabel("Numeric case").selectOption("negative");
  await expect(loader).toHaveCSS("--kind-loader-duration", "0.1s");
  await expect(loader).toHaveCSS("--kind-loader-spread", "0%");
  await expect(shimmer).toHaveCSS("--kind-loader-spread", "0px");
  await page.getByLabel("Numeric case").selectOption("overflow");
  await expect(loader).toHaveCSS("--kind-loader-spread", "100%");
  await expect(shimmer).toHaveCSS("--kind-loader-spread", "8px");
  await expect(shimmer).not.toHaveAttribute("style", /NaN|Infinity/);
  await expect(loader).not.toHaveAttribute("style", /NaN|Infinity/);
  await expect(page.getByTestId("styled-loader")).toHaveCSS("--kind-loader-duration", "7s");
  await expect(page.getByTestId("styled-loader")).toHaveCSS("--kind-loader-spread", "12px");
  await expect(page.getByTestId("styled-loader")).toHaveCSS("color", "rgb(255, 99, 71)");
  await expect(page.getByTestId("styled-shimmer")).toHaveCSS("--kind-loader-duration", "8s");
  await expect(page.getByTestId("styled-shimmer")).toHaveCSS("--kind-loader-spread", "14px");
});

test("pulse honors normalized duration while shimmer and decorative dots keep their variants", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const [id, duration] of [
    ["pulse-default", "1.4s"],
    ["pulse-controlled", "3s"],
    ["pulse-invalid", "1.4s"],
    ["pulse-minimum", "0.1s"],
    ["styled-loader", "7s"],
  ] as const) {
    await expect(page.getByTestId(id)).toHaveCSS("animation-name", "pulse");
    await expect(page.getByTestId(id)).toHaveCSS("animation-duration", duration);
  }
  for (const [id, duration] of [
    ["shimmer-default", "2.2s"],
    ["shimmer-explicit", "3.6s"],
    ["shimmer-dots", "3.6s"],
    ["text-shimmer-default", "2s"],
    ["text-shimmer-explicit", "4s"],
    ["styled-shimmer", "8s"],
  ] as const) {
    await expect(page.getByTestId(id)).toHaveCSS("animation-name", "kind-shimmer");
    await expect(page.getByTestId(id)).toHaveCSS("animation-duration", duration);
  }
  for (const id of ["pulse-dots", "null-default", "null-dots"]) {
    await expect(page.getByTestId(id)).toHaveCSS("animation-name", "none");
  }
  const controlled = page.getByTestId("pulse-controlled");
  await controlled.evaluate((element) => element.setAttribute("data-identity", "retained"));
  await page.getByLabel("Pulse duration", { exact: true }).fill("0.75");
  await expect(controlled).toHaveCSS("animation-duration", "0.75s");
  await expect(controlled).toHaveAttribute("data-identity", "retained");
  for (const id of ["pulse-dots", "shimmer-dots", "null-dots"]) {
    const dots = page.getByTestId(id).locator('[data-slot="thinking-dots"]');
    await expect(dots).toHaveAttribute("aria-hidden", "true");
    await expect(dots.locator("span")).toHaveCount(3);
    await expect
      .poll(() =>
        dots.evaluate((element) =>
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.effect?.getTiming().duration)
            .some((duration) => duration === 1200),
        ),
      )
      .toBe(true);
  }
});

test("initial and live reduced motion keep Loader and Shimmer text readable and restore activity", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const ids = [
    "pulse-default",
    "pulse-controlled",
    "shimmer-default",
    "shimmer-dots",
    "text-shimmer-default",
  ];
  for (const id of ids) {
    await expect(page.getByTestId(id)).toHaveCSS("animation-name", "none");
    await expect(page.getByTestId(id)).toBeVisible();
  }
  for (const id of ["shimmer-default", "shimmer-dots", "text-shimmer-default"]) {
    await expect(page.getByTestId(id)).toHaveCSS("background-image", "none");
    await expect(page.getByTestId(id)).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.getByTestId("pulse-default")).toHaveCSS("animation-name", "pulse");
  await expect(page.getByTestId("pulse-default")).toHaveCSS("animation-duration", "1.4s");
  await expect(page.getByTestId("shimmer-default")).toHaveCSS("animation-name", "kind-shimmer");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const id of ids) await expect(page.getByTestId(id)).toHaveCSS("animation-name", "none");
  await page.getByLabel("Loader content").fill("Updated during reduced motion");
  await expect(page.getByTestId("controlled-loader")).toHaveText("Updated during reduced motion");
});

test("forced colors preserve readable Loader and text shimmer labels", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "no-preference" });
  for (const id of [
    "shimmer-default",
    "shimmer-explicit",
    "shimmer-dots",
    "text-shimmer-default",
    "text-shimmer-explicit",
  ]) {
    const shimmer = page.getByTestId(id);
    await expect(shimmer).toBeVisible();
    await expect(shimmer).toHaveCSS("background-image", "none");
    await expect(shimmer).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
  }
});

test("standalone Loader recipe retains its pulse duration without component variables", async ({
  page,
}) => {
  const helper = page.getByTestId("standalone-loader-helper");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(helper).toHaveClass(/host-loader-helper/);
  await expect(helper).toHaveCSS("--kind-loader-duration", "");
  await expect(helper).toHaveCSS("animation-name", "pulse");
  await expect(helper).toHaveCSS("animation-duration", "2s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(helper).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(helper).toHaveCSS("animation-duration", "2s");
});
