import { expect, type Locator, test } from "@playwright/test";

function dotsIn(typing: Locator) {
  return typing.locator('[data-slot="thinking-dots"] > span');
}

async function samples(dots: Locator) {
  return dots.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return `${style.transform};${style.opacity}`;
    }),
  );
}

async function expectMoving(dots: Locator) {
  const before = await samples(dots);
  await expect.poll(() => samples(dots)).not.toEqual(before);
}

async function expectSteady(dots: Locator) {
  await expect(dots).toHaveCount(3);
  for (const dot of await dots.all()) {
    await expect(dot).toHaveCSS("opacity", "0.7");
    await expect(dot).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  }
  const before = await samples(dots);
  await dots.evaluateAll(async () => {
    for (let frame = 0; frame < 8; frame++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  });
  expect(await samples(dots)).toEqual(before);
}

test("TypingIndicator supplies one status and honors native naming and role overrides", async ({
  page,
}) => {
  await page.goto("/?component=typing-indicator");
  const primary = page.getByRole("region", { name: "Default typing activity" });
  await expect(primary.getByRole("status")).toHaveCount(1);
  await expect(page.getByTestId("typing")).toHaveAccessibleName("Assistant is typing");
  await expect(page.getByTestId("typing").locator('[data-slot="thinking-dots"]')).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(dotsIn(page.getByTestId("typing"))).toHaveCount(3);
  await expect(page.getByTestId("renamed-typing")).toHaveAccessibleName("Drafting a reply");
  await expect(page.getByTestId("labelled-typing")).toHaveAccessibleName("Composing a suggestion");
  await expect(page.getByTestId("host-role-typing")).toHaveAttribute("role", "note");
  await expect(page.getByTestId("host-role-typing")).toHaveAttribute("aria-live", "off");
  await expect(page.getByTestId("host-role-typing")).toHaveAccessibleName("Host activity");
  await expect(page.getByTestId("surface-typing")).toHaveClass(/kind-surface/);
});

test("activity components preserve native refs, attributes, classes, styles and handlers", async ({
  page,
}) => {
  await page.goto("/?component=typing-indicator");
  await page.getByRole("button", { name: "Inspect activity refs" }).click();
  await expect(page.getByTestId("activity-refs")).toHaveText("DIV,SPAN");
  const typing = page.getByTestId("typing");
  await expect(typing).toHaveAttribute("id", "host-typing");
  await expect(typing).toHaveAttribute("title", "Host typing activity");
  await expect(typing).toHaveClass("host-typing");
  await expect(typing).toHaveCSS("outline-color", "rgb(1, 2, 3)");
  await typing.focus();
  await expect(typing).toBeFocused();
  await typing.click();
  await expect(page.getByTestId("activity-clicks")).toHaveText("1");
  const dots = page.getByTestId("native-dots");
  await expect(dots).toHaveAttribute("id", "host-dots");
  await expect(dots).toHaveAttribute("title", "Host dots");
  await expect(dots).toHaveAttribute("aria-hidden", "true");
  await expect(dots).toHaveClass(/host-dots/);
  await expect(dots).toHaveCSS("color", "rgb(4, 5, 6)");
  await expect(dots).toHaveCSS("width", "30px");
  await dots.click();
  await expect(page.getByTestId("activity-clicks")).toHaveText("2");
  await expect(page.getByTestId("subpath-dots").locator(":scope > span")).toHaveCount(3);
});

test("initial reduced motion keeps every dot steady", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?component=typing-indicator");
  await expectSteady(dotsIn(page.getByTestId("typing")));
  await expect(page.getByTestId("typing")).toHaveAccessibleName("Assistant is typing");
});

test("live reduced motion stops and restarts the existing staggered activity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?component=typing-indicator");
  const dots = dotsIn(page.getByTestId("typing"));
  await expect(dots).toHaveCount(3);
  await expectMoving(dots);
  await expect.poll(async () => new Set(await samples(dots)).size).toBeGreaterThan(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expectSteady(dots);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expectMoving(dots);
  await expect(page.getByTestId("typing")).toHaveAttribute("role", "status");
});

test("unmount stops detached dots and remount starts a fresh indicator", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?component=typing-indicator");
  const typing = page.getByTestId("typing");
  const dots = dotsIn(typing);
  await expectMoving(dots);
  const oldDot = await dots.first().elementHandle();
  expect(oldDot).not.toBeNull();
  await page.getByRole("button", { name: "Toggle typing activity" }).click();
  await expect(typing).toHaveCount(0);
  expect(await oldDot?.evaluate((element) => element.isConnected)).toBe(false);
  const stoppedStyle = await oldDot?.evaluate((element) => element.getAttribute("style"));
  await page.evaluate(async () => {
    for (let frame = 0; frame < 8; frame++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  });
  expect(await oldDot?.evaluate((element) => element.getAttribute("style"))).toBe(stoppedStyle);
  await page.getByRole("button", { name: "Toggle typing activity" }).click();
  await expect(typing).toHaveAccessibleName("Assistant is typing");
  await expectMoving(dotsIn(typing));
  expect(await oldDot?.evaluate((element) => element.isConnected)).toBe(false);
});
