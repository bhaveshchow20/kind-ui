import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./browser";

const url = `http://127.0.0.1:${4205 + Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173}`;
test("visible zoom controls propose controlled windows and preserve native veto", async ({
  page,
}) => {
  await page.goto(`${url}/?navigation`);
  const zoom = page.getByRole("button", { name: "Zoom in", exact: true });
  await zoom.click();
  await expect(page.getByLabel("Reason")).toHaveText("zoom");
  const window = ((await page.getByLabel("Window", { exact: true }).textContent()) ?? "")
    .split(",")
    .map(Number);
  expect((window[1] ?? 0) - (window[0] ?? 0)).toBeCloseTo(5 / 1.5);
  await page.getByRole("button", { name: "Zoom out", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,4.5");
  await expect(page.getByLabel("Selected time", { exact: true })).toHaveText("None");
  await expect(page.getByLabel("Inspection", { exact: true })).toHaveText("None");
  await page.getByRole("button", { name: "History window", exact: true }).click();
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,4.5");
  await expect(page.getByLabel("Reason")).toHaveText("reset");
  await zoom.focus();
  await page.keyboard.press(" ");
  await expect(page.getByLabel("Selected time", { exact: true })).toHaveText("None");
  await expect(page.getByLabel("Inspection", { exact: true })).toHaveText("None");
  await page.goto(`${url}/?navigation&controls-veto`);
  await zoom.click();
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,4.5");
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(zoom).toBeDisabled();
  await expect(page.getByRole("button", { name: "Reset view", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Load observations", exact: true }).click();
  await page.getByRole("button", { name: "Loading", exact: true }).click();
  await expect(page.locator('[data-kind-ui="candlestick-controls"]')).toHaveAttribute(
    "disabled",
    "",
  );
  await expect(page.locator('[data-kind-ui="candlestick-controls"] button').first()).toBeDisabled();
  await expect(page.locator('[data-kind-ui="candlestick-history-navigator"]')).toHaveAttribute(
    "disabled",
    "",
  );
  await expect(page.locator('[data-kind-ui="candlestick-history-navigator"]')).toHaveAttribute(
    "inert",
    "",
  );
});

test("discrete zoom animates displayed coordinates while controlled callbacks fire once; reduced motion snaps", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto(`${url}/?navigation&viewport-motion`);
  await page.clock.runFor(500);
  const wick = page.locator(
    '[data-kind-ui="candlestick-mark"][aria-label^="2026-03-10:"] [data-candle-part="wick"]',
  );
  const before = Number(await wick.getAttribute("x1"));
  const area = page.locator('clipPath[id$="-price"] rect');
  const target =
    Number(await area.getAttribute("x")) + Number(await area.getAttribute("width")) * 0.8;
  const callbacks = Number(await page.getByLabel("Window changes", { exact: true }).textContent());
  await page.getByRole("button", { name: "Zoom in", exact: true }).dispatchEvent("click");
  await page.clock.runFor(48);
  const intermediate = Number(await wick.getAttribute("x1"));
  expect(intermediate).toBeGreaterThan(before);
  expect(intermediate).toBeLessThan(target);
  await page.clock.runFor(250);
  await expect.poll(async () => Number(await wick.getAttribute("x1"))).toBeCloseTo(target, 1);
  await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(
    String(callbacks + 1),
  );
  await page.getByRole("button", { name: "Reset view", exact: true }).dispatchEvent("click");
  await page.clock.runFor(48);
  await page.getByRole("button", { name: "Replace", exact: true }).dispatchEvent("click");
  await page.clock.runFor(16);
  await expect.poll(async () => Number(await wick.getAttribute("x1"))).toBeCloseTo(before, 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${url}/?navigation&viewport-motion`);
  await page.clock.runFor(500);
  await page.getByRole("button", { name: "Zoom in", exact: true }).dispatchEvent("click");
  await page.clock.runFor(16);
  await expect.poll(async () => Number(await wick.getAttribute("x1"))).toBeCloseTo(target, 1);
  await expect(page.getByLabel("Window changes", { exact: true })).toHaveText("1");
});
test("historical overview stays below price and volume and native handles control the window", async ({
  page,
}) => {
  await page.goto(`${url}/?navigation&legend-top`);
  const nav = page.locator('[data-kind-ui="candlestick-history-navigator"]');
  const plot = await page.locator("svg.recharts-surface").first().boundingBox();
  const navigator = await nav.boundingBox();
  if (!plot || !navigator) throw new Error("Missing overview geometry");
  expect(navigator.y).toBeGreaterThanOrEqual(plot.y + plot.height);
  await expect(nav.locator(".recharts-line-curve")).toHaveCount(1);
  const start = nav.getByRole("slider", { name: "Historical window start", exact: true });
  const end = nav.getByRole("slider", { name: "Historical window end", exact: true });
  await expect(start).toHaveAttribute("aria-valuenow", "0");
  await expect(end).toHaveAttribute("aria-valuenow", "4");
  const changes = Number(await page.getByLabel("Window changes", { exact: true }).textContent());
  await start.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,4.5");
  await expect(page.getByLabel("Reason")).toHaveText("pan");
  await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(String(changes + 1));
  await expect(page.getByLabel("Inspection", { exact: true })).toHaveText("None");
  await end.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,3.5");
  await expect(start).toHaveAttribute("aria-valuenow", "1");
  await expect(end).toHaveAttribute("aria-valuenow", "3");
  await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(String(changes + 2));
  await expect(page.getByLabel("Inspection", { exact: true })).toHaveText("None");
  const before = await page.getByLabel("Window", { exact: true }).textContent();
  await page.getByRole("button", { name: "Append", exact: true }).click();
  await expect(page.getByLabel("Window", { exact: true })).toHaveText(before ?? "");
  await page.getByRole("button", { name: "Follow latest", exact: true }).click();
  await end.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,5.5");
  await page
    .getByRole("button", { name: "Append next observation", exact: true })
    .dispatchEvent("click");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("1.5,6.5");
  await expect(end).toBeFocused();
  await page.getByRole("button", { name: "Prepend", exact: true }).dispatchEvent("click");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("2.5,7.5");
  await expect(end).toBeFocused();
  const axe = await new AxeBuilder({ page })
    .include('[data-kind-ui="candlestick-history-navigator"]')
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 900 });
  await expect
    .poll(() => nav.evaluate((node) => node.getBoundingClientRect().width))
    .toBeLessThanOrEqual(320);
  await expect
    .poll(() => nav.evaluate((node) => node.scrollWidth - node.clientWidth))
    .toBeLessThanOrEqual(1);
});

test("forming-row corrections update the overview without resetting focused handles or cancelling a drag", async ({
  page,
}) => {
  await page.goto(`${url}/?navigation`);
  await page.getByRole("button", { name: "History window", exact: true }).click();
  const nav = page.locator('[data-kind-ui="candlestick-history-navigator"]');
  const start = nav.getByRole("slider", { name: "Historical window start", exact: true });
  const end = nav.getByRole("slider", { name: "Historical window end", exact: true });
  const curve = nav.locator(".recharts-line-curve");
  const beforeCurve = await curve.getAttribute("d");
  await end.focus();
  await page.getByRole("button", { name: "Replace", exact: true }).dispatchEvent("click");
  await expect(end).toBeFocused();
  await expect(curve).not.toHaveAttribute("d", beforeCurve ?? "");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,4.5");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,3.5");
  const a = await start.boundingBox();
  const b = await end.boundingBox();
  const slide = await nav.locator(".recharts-brush-slide").boundingBox();
  if (!a || !b || !slide) throw new Error("Missing native brush geometry");
  const handle = await start.elementHandle();
  await page.mouse.move(slide.x + slide.width / 2, slide.y + slide.height / 2);
  await page.mouse.down();
  await page.getByRole("button", { name: "Replace", exact: true }).dispatchEvent("click");
  await expect.poll(() => handle?.evaluate((node) => node.isConnected) ?? false).toBe(true);
  await page.mouse.move(
    slide.x + slide.width / 2 - (b.x - a.x) / 2 - 2,
    slide.y + slide.height / 2,
  );
  await page.mouse.up();
  await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,2.5");
});

for (const mode of ["normal", "prevent", "stop", "capture-stop", "throw"]) {
  test(`history cancellation preserves native consumer capture/bubble ordering (${mode})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}/?navigation&navigation-cancel&cancel-${mode}`);
    await page.getByRole("button", { name: "History window", exact: true }).click();
    await page.evaluate(async () => {
      for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    });
    const callbacks = Number(
      await page.getByLabel("Window changes", { exact: true }).textContent(),
    );
    await page.evaluate(() => {
      const target = document.querySelector("[data-cancel-traveller]");
      if (!target) throw new Error("Missing consumer traveller");
      const rect = target.getBoundingClientRect();
      const touch = new Touch({
        identifier: 1,
        target,
        clientX: rect.x + 2,
        clientY: rect.y + 10,
        pageX: rect.x + 2,
        pageY: rect.y + 10,
      });
      target.dispatchEvent(
        new TouchEvent("touchstart", { bubbles: true, changedTouches: [touch], touches: [touch] }),
      );
    });
    await page.evaluate(() => {
      const target = document.querySelector("[data-cancel-traveller]");
      if (!target) throw new Error("Missing consumer traveller");
      const rect = target.getBoundingClientRect();
      const touch = new Touch({
        identifier: 1,
        target,
        clientX: rect.x + 2,
        clientY: rect.y + 10,
        pageX: rect.x + 2,
        pageY: rect.y + 10,
      });
      target.dispatchEvent(
        new TouchEvent("touchcancel", {
          bubbles: true,
          cancelable: true,
          changedTouches: [touch],
          touches: [],
        }),
      );
    });
    await expect(page.getByLabel("Navigator cancel events", { exact: true })).toHaveText(
      mode === "capture-stop"
        ? "fieldset capture"
        : mode === "stop"
          ? "fieldset capture,traveller capture,traveller bubble"
          : "fieldset capture,traveller capture,traveller bubble,fieldset bubble",
    );
    expect(errors).toEqual(mode === "throw" ? ["Consumer touchcancel error"] : []);
    await page.evaluate(
      (stopped) => {
        // A consumer stopping propagation owns the veto. Native touchend still
        // releases its gesture; otherwise even a thrown callback must allow reset.
        const target = stopped ? document.body : document.querySelector("[data-cancel-traveller]");
        if (!target) throw new Error("Missing subsequent touch target");
        const rect = target.getBoundingClientRect();
        const touch = new Touch({
          identifier: 2,
          target,
          clientX: rect.x - 200,
          clientY: rect.y + 10,
          pageX: rect.x - 200,
          pageY: rect.y + 10,
        });
        target.dispatchEvent(
          new TouchEvent(stopped ? "touchend" : "touchmove", {
            bubbles: true,
            changedTouches: [touch],
            touches: stopped ? [] : [touch],
          }),
        );
      },
      mode === "stop" || mode === "capture-stop",
    );
    await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(String(callbacks));
    const end = page
      .locator('[data-kind-ui="candlestick-history-navigator"]')
      .getByRole("slider", { name: "Historical window end", exact: true });
    await end.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,4.5");
  });
}

for (const immediate of [false, true]) {
  test(`cancelled native history touch gestures cannot drag from ${immediate ? "immediate" : "later"} unrelated touch moves`, async ({
    page,
  }) => {
    await page.goto(`${url}/?navigation`);
    await page.getByRole("button", { name: "History window", exact: true }).click();
    const nav = page.locator('[data-kind-ui="candlestick-history-navigator"]');
    const start = await nav
      .getByRole("slider", { name: "Historical window start", exact: true })
      .boundingBox();
    const end = await nav
      .getByRole("slider", { name: "Historical window end", exact: true })
      .boundingBox();
    const slide = await nav.locator(".recharts-brush-slide").boundingBox();
    if (!start || !end || !slide) throw new Error("Missing native touch geometry");
    await page.evaluate(async () => {
      for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    });
    const x = slide.x + slide.width / 2;
    const y = slide.y + slide.height / 2;
    const movedX = x - (end.x - start.x) / 2 - 2;
    const dispatchTouch = async (
      type: string,
      target: "slide" | "body",
      pageX: number,
      nextEvents: { type: string; target: "slide" | "body"; pageX: number }[] = [],
    ) => {
      await page.evaluate(
        ({ type, target, pageX, y, nextEvents }) => {
          for (const event of [{ type, target, pageX }, ...nextEvents]) {
            const { type, target, pageX } = event;
            const element =
              target === "slide"
                ? document.querySelector(
                    '[data-kind-ui="candlestick-history-navigator"] .recharts-brush-slide',
                  )
                : document.body;
            if (!element) throw new Error("Missing touch target");
            const touch = new Touch({
              identifier: 1,
              target: element,
              clientX: pageX,
              clientY: y,
              pageX,
              pageY: y,
            });
            element.dispatchEvent(
              new TouchEvent(type, {
                bubbles: true,
                cancelable: true,
                changedTouches: [touch],
                touches: type === "touchend" || type === "touchcancel" ? [] : [touch],
              }),
            );
          }
        },
        { type, target, pageX, y, nextEvents },
      );
    };
    const callbacks = Number(
      await page.getByLabel("Window changes", { exact: true }).textContent(),
    );
    const focusTarget = immediate
      ? nav.getByRole("slider", { name: "Historical window end", exact: true })
      : page.getByRole("button", { name: "History window", exact: true });
    await focusTarget.focus();
    await dispatchTouch("touchstart", "slide", x);
    // A new touch starts outside Brush, then moves over its overview. Native
    // touchmove is local to Brush. Dispatch all three in one browser task so no
    // animation frame or deferred React commit can hide cancelled moving state.
    if (immediate) {
      await dispatchTouch("touchcancel", "slide", x, [
        { type: "touchstart", target: "body", pageX: x },
        { type: "touchmove", target: "slide", pageX: movedX },
      ]);
    } else {
      await dispatchTouch("touchcancel", "slide", x);
      await page.evaluate(async () => {
        for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
      });
      await dispatchTouch("touchstart", "body", x);
      await dispatchTouch("touchmove", "slide", movedX);
    }
    await expect(page.getByLabel("Window", { exact: true })).toHaveText("0.5,3.5");
    await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(String(callbacks));
    await expect(focusTarget).toBeFocused();
    await dispatchTouch("touchstart", "slide", x);
    await dispatchTouch("touchmove", "slide", movedX);
    await dispatchTouch("touchend", "slide", movedX);
    await expect(page.getByLabel("Window", { exact: true })).toHaveText("-0.5,2.5");
    await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(
      String(callbacks + 1),
    );
  });
}

for (const interruption of ["empty", "loading"]) {
  test(`history drag interrupted by ${interruption} reconciles the current timeline before resuming`, async ({
    page,
  }) => {
    await page.goto(`${url}/?navigation`);
    await page.getByRole("button", { name: "Append next observation", exact: true }).click();
    await page.getByRole("button", { name: "History window", exact: true }).click();
    const nav = page.locator('[data-kind-ui="candlestick-history-navigator"]');
    const end = nav.getByRole("slider", { name: "Historical window end", exact: true });
    const slide = await nav.locator(".recharts-brush-slide").boundingBox();
    if (!slide) throw new Error("Missing native drag geometry");
    await page.mouse.move(slide.x + slide.width / 2, slide.y + slide.height / 2);
    await page.mouse.down();
    await page
      .getByRole("button", { name: interruption === "empty" ? "Empty" : "Loading", exact: true })
      .dispatchEvent("click");
    if (interruption === "empty") {
      await expect(nav).toContainText("No history available");
      await page
        .getByRole("button", { name: "Load observations", exact: true })
        .dispatchEvent("click");
    } else {
      await expect(nav).toHaveAttribute("inert", "");
      await page.getByRole("button", { name: "Prepend", exact: true }).dispatchEvent("click");
      await page.getByRole("button", { name: "Loading", exact: true }).dispatchEvent("click");
    }
    await page.mouse.up();
    await expect(end).toHaveAttribute("aria-valuemax", interruption === "empty" ? "4" : "6");
    await page.getByRole("button", { name: "History window", exact: true }).click();
    const before = ((await page.getByLabel("Window", { exact: true }).textContent()) ?? "")
      .split(",")
      .map(Number);
    const callbacks = Number(
      await page.getByLabel("Window changes", { exact: true }).textContent(),
    );
    await end.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByLabel("Window", { exact: true })).toHaveText(
      `${before[0]},${(before[1] ?? 0) - 1}`,
    );
    await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(
      String(callbacks + 1),
    );
    await expect(end).toBeFocused();
  });
}

for (const update of ["Append next observation", "Prepend"]) {
  for (const drag of ["slide", "handle"]) {
    test(`${update} during a native history drag (${drag}) preserves the gesture and maps its next move by identity`, async ({
      page,
    }) => {
      await page.goto(`${url}/?navigation`);
      await page.getByRole("button", { name: "History window", exact: true }).click();
      const nav = page.locator('[data-kind-ui="candlestick-history-navigator"]');
      const start = nav.getByRole("slider", { name: "Historical window start", exact: true });
      const end = nav.getByRole("slider", { name: "Historical window end", exact: true });
      await end.focus();
      const handle = await start.elementHandle();
      const a = await start.boundingBox();
      const b = await end.boundingBox();
      const slide = await nav.locator(".recharts-brush-slide").boundingBox();
      if (!a || !b || !slide || !handle) throw new Error("Missing native drag geometry");
      const x = drag === "slide" ? slide.x + slide.width / 2 : b.x + b.width / 2;
      const y = slide.y + slide.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      // Pointer activation of the slide does not itself retain keyboard focus.
      // Keep an endpoint focused to verify the deferred geometry refresh restores it.
      await end.focus();
      const overview = nav.locator(".recharts-line-curve");
      const pricesBeforeUpdate = await overview.getAttribute("d");
      if (!pricesBeforeUpdate) throw new Error("Missing historical close overview");
      await page.getByRole("button", { name: update, exact: true }).dispatchEvent("click");
      await page.evaluate(async () => {
        for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
      });
      expect(await handle.evaluate((node) => node.isConnected)).toBe(true);
      // The frozen timeline still resolves the same observations after a prepend.
      await expect(overview).toHaveAttribute("d", pricesBeforeUpdate);
      const callbacks = Number(
        await page.getByLabel("Window changes", { exact: true }).textContent(),
      );
      // Native travellers floor to the preceding observation; stay just above
      // that boundary, while the slide crosses it to move its whole window.
      await page.mouse.move(x - (b.x - a.x) / 2 + (drag === "handle" ? 2 : -2), y);
      const from = drag === "slide" ? -0.5 : 0.5;
      const shift = update === "Prepend" ? 1 : 0;
      const expected = `${from + shift},${2.5 + shift}`;
      await expect(page.getByLabel("Window", { exact: true })).toHaveText(expected);
      await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(
        String(callbacks + 1),
      );
      await page.mouse.up();
      await expect(page.getByLabel("Window", { exact: true })).toHaveText(expected);
      await expect(page.getByLabel("Window changes", { exact: true })).toHaveText(
        String(callbacks + 1),
      );
      await expect(end).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByLabel("Window", { exact: true })).toHaveText(
        `${from + shift},${3.5 + shift}`,
      );
    });
  }
}
