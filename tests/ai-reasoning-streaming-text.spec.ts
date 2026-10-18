import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/?component=streaming-text");
});

test("StreamingText updates literal text immediately and retains its paragraph across state changes", async ({
  page,
}) => {
  const response = page.getByTestId("streaming-response");
  const original = await response.elementHandle();
  const caret = response.locator('[data-slot="streaming-text-caret"]');
  await expect(response).toHaveAttribute("aria-busy", "true");
  await expect(caret).toHaveAttribute("aria-hidden", "true");
  await page
    .getByRole("textbox", { name: "Response text", exact: true })
    .fill("  New\n\t世界 👩🏽‍💻 par <b>literal</b> & ");
  expect(await response.textContent()).toBe("  New\n\t世界 👩🏽‍💻 par <b>literal</b> & ");
  await expect(response.locator("b")).toHaveCount(0);
  for (const state of ["complete", "streaming", "interrupted", "complete"]) {
    await page.getByLabel("Response state").selectOption(state);
    await expect(response).toHaveAttribute("aria-busy", String(state === "streaming"));
    await expect(caret).toHaveCount(state === "streaming" ? 1 : 0);
    expect(await response.textContent()).toBe("  New\n\t世界 👩🏽‍💻 par <b>literal</b> & ");
    expect(await original?.evaluate((element) => element.isConnected)).toBe(true);
  }
});

test("StreamingText suppresses the caret on blank text, reset and consumer opt-out", async ({
  page,
}) => {
  const response = page.getByTestId("streaming-response");
  const caret = response.locator('[data-slot="streaming-text-caret"]');
  const input = page.getByRole("textbox", { name: "Response text", exact: true });
  await input.fill(" \n\t");
  await expect(caret).toHaveCount(0);
  expect(await response.textContent()).toBe(" \n\t");
  await expect(response).toHaveAttribute("aria-busy", "true");
  await input.fill("");
  await expect(caret).toHaveCount(0);
  expect(await response.textContent()).toBe("");
  await input.fill("Resumed partial");
  await expect(caret).toHaveCount(1);
  await page.getByLabel("Show caret").uncheck();
  await expect(caret).toHaveCount(0);
  expect(await response.textContent()).toBe("Resumed partial");
});

test("StreamingText forwards paragraph refs, native handlers and consumer accessibility", async ({
  page,
}) => {
  const response = page.getByTestId("streaming-response");
  expect(await response.evaluate((element) => element.tagName)).toBe("P");
  await expect(response).toHaveAttribute("id", "streaming-response");
  await expect(response).toHaveAttribute("title", "Current response");
  await expect(response).toHaveAttribute("lang", "en");
  await expect(response).toHaveAttribute("dir", "auto");
  await expect(response).toHaveClass(/consumer-text/);
  await expect(response).toHaveCSS("max-width", "100%");
  await expect(response).not.toHaveAttribute("role");
  await expect(response).not.toHaveAttribute("aria-live");
  await page.getByRole("button", { name: "Focus response" }).click();
  await expect(response).toBeFocused();
  await response.click();
  await expect(page.getByTestId("response-clicks")).toHaveText("1");
  await page.getByLabel("Override busy state").check();
  await expect(response).toHaveAttribute("aria-busy", "false");
  await expect(response.locator('[data-slot="streaming-text-caret"]')).toHaveCount(1);
});

test("StreamingText preserves line breaks and wraps long text in a narrow container", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const response = page.getByTestId("streaming-response");
  await page
    .getByRole("textbox", { name: "Response text", exact: true })
    .fill(`First\n  Second\n${"unbroken".repeat(70)}`);
  await expect(response).toHaveCSS("white-space", "pre-wrap");
  expect(await response.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
  await page.emulateMedia({ forcedColors: "active" });
  const caret = response.locator('[data-slot="streaming-text-caret"]');
  await expect(caret).toBeVisible();
  expect(
    await caret.evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        style.borderInlineStartStyle !== "none" &&
        Number.parseFloat(style.borderInlineStartWidth) > 0
      );
    }),
  ).toBe(true);
});

test("StreamingText caret motion is opt-in and follows live reduced-motion changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const response = page.getByTestId("streaming-response");
  const caret = response.locator('[data-slot="streaming-text-caret"]');
  const text = "  First\n  partial 👩🏽‍💻 <b>literal</b>";
  await expect(caret).toHaveCSS("animation-name", "none");
  await page.getByLabel("Animate caret").check();
  await expect(caret).toHaveCSS("animation-name", "pulse");
  await expect(response).toHaveCSS("animation-name", "none");
  expect(await response.textContent()).toBe(text);
  for (const reducedMotion of ["reduce", "no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion });
    await expect(caret).toHaveCSS("animation-name", reducedMotion === "reduce" ? "none" : "pulse");
    if (reducedMotion === "reduce") await expect(caret).toHaveCSS("opacity", "1");
    expect(await response.textContent()).toBe(text);
    await expect(response).toHaveAttribute("aria-busy", "true");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByLabel("Animate caret").uncheck();
  await expect(caret).toHaveCSS("animation-name", "none");
  await page.getByLabel("Animate caret").check();
  for (const state of ["complete", "interrupted"]) {
    await page.getByLabel("Response state").selectOption(state);
    await expect(caret).toHaveCount(0);
    await expect(response).toHaveAttribute("aria-busy", "false");
    expect(await response.textContent()).toBe(text);
    await page.getByLabel("Response state").selectOption("streaming");
    await expect(caret).toHaveCSS("animation-name", "pulse");
  }
  await page.getByRole("textbox", { name: "Response text", exact: true }).fill("");
  await expect(caret).toHaveCount(0);
  expect(await response.textContent()).toBe("");
});

test("StreamingText starts with a steady caret when reduced motion is already enabled", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?component=streaming-text");
  await page.getByLabel("Animate caret").check();
  const caret = page
    .getByTestId("streaming-response")
    .locator('[data-slot="streaming-text-caret"]');
  await expect(caret).toHaveCSS("animation-name", "none");
  await expect(caret).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(caret).toHaveCSS("animation-name", "pulse");
});

test("StreamingText preserves focus and the selected literal text across state and caret changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const response = page.getByTestId("streaming-response");
  const original = await response.elementHandle();
  await response.focus();
  await response.evaluate((element) => {
    const text = element.firstChild;
    if (!text || text.nodeType !== Node.TEXT_NODE) throw new Error("Missing response text node");
    const range = document.createRange();
    range.setStart(text, 2);
    range.setEnd(text, 7);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  const assertRetained = async () => {
    await expect(response).toBeFocused();
    expect(await original?.evaluate((element) => element.isConnected)).toBe(true);
    expect(await response.textContent()).toBe("  First\n  partial 👩🏽‍💻 <b>literal</b>");
    expect(
      await response.evaluate((element) => {
        const selection = window.getSelection();
        return {
          text: selection?.toString(),
          anchorIsText: selection?.anchorNode === element.firstChild,
          focusIsText: selection?.focusNode === element.firstChild,
        };
      }),
    ).toEqual({ text: "First", anchorIsText: true, focusIsText: true });
  };
  await assertRetained();
  for (const state of ["complete", "streaming", "interrupted", "streaming"]) {
    await page.getByLabel("Response state").evaluate((element, next) => {
      if (!(element instanceof HTMLSelectElement))
        throw new Error("Missing response state control");
      element.value = next;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, state);
    await expect(response).toHaveAttribute("aria-busy", String(state === "streaming"));
    await assertRetained();
  }
  for (const [label, count, animation] of [
    ["Show caret", 0, "none"],
    ["Show caret", 1, "none"],
    ["Animate caret", 1, "pulse"],
    ["Animate caret", 1, "none"],
  ] as const) {
    await page.getByLabel(label).evaluate((element) => {
      if (!(element instanceof HTMLInputElement)) throw new Error("Missing caret control");
      element.click();
    });
    const caret = response.locator('[data-slot="streaming-text-caret"]');
    await expect(caret).toHaveCount(count);
    if (count) await expect(caret).toHaveCSS("animation-name", animation);
    await assertRetained();
  }
});
