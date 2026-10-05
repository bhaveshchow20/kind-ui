import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { basePath, publicPath } from "../lib/routing.mjs";

async function finishTransitions(page) {
  await page.evaluate(async () => {
    await Promise.all(
      (window.themeTransitions ?? []).map((transition) => transition.finished.catch(() => {})),
    );
    await new Promise(requestAnimationFrame);
  });
}

export async function checkThemeSwitch(browser, origin) {
  const records = [];
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push({ name: error.name, message: error.message }));
    await page.addInitScript(() => {
      const start = document.startViewTransition?.bind(document);
      window.themeStarts = 0;
      window.themeTransitions = [];
      if (!start) return;
      document.startViewTransition = (callback) => {
        window.themeStarts++;
        const transition = start(async () => {
          await callback();
          window.themeUpdated = true;
          if (window.failThemeUpdate) throw new Error("Intentional theme update failure");
          if (window.holdThemeUpdate)
            await new Promise((resolve) => (window.releaseThemeUpdate = resolve));
        });
        window.themeTransitions.push(transition);
        return transition;
      };
    });
    await page.goto(origin + publicPath("/docs/components/line/"));
    await page.getByRole("button", { name: "Toggle Theme", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => typeof document.startViewTransition), "function");
    await page.evaluate(() => (window.holdThemeUpdate = true));
    await page.getByRole("button", { name: "Toggle Theme", exact: true }).click();
    await page.waitForFunction(() => window.themeUpdated && window.releaseThemeUpdate, null, {
      polling: 10,
    });
    await page.setViewportSize({ width: 320, height: 812 });
    await page.evaluate(() => {
      window.holdThemeUpdate = false;
      window.releaseThemeUpdate();
    });
    await finishTransitions(page);
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("dark")),
      true,
    );
    assert.deepEqual(errors, []);
    records.push({
      check: "native viewport cancellation preserves theme and has no page error",
      passed: true,
    });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => {
      const toggle = document.querySelector("[data-theme-toggle]");
      toggle.click();
      toggle.click();
    });
    await finishTransitions(page);
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("dark")),
      true,
    );
    assert.ok(await page.evaluate(() => window.themeStarts >= 3));
    assert.deepEqual(errors, []);
    await page.getByRole("button", { name: "Toggle Theme", exact: true }).focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(() => !document.documentElement.classList.contains("dark"));
    await page.evaluate(() => {
      document.querySelector("[data-theme-toggle]").click();
      document.querySelector('a[href$="/components/heatmap/"]').click();
    });
    await page.waitForURL((url) => url.pathname === publicPath("/docs/components/heatmap/"));
    await page.getByRole("heading", { name: "Heatmap", level: 1 }).waitFor();
    await page.setViewportSize({ width: 375, height: 900 });
    await finishTransitions(page);
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("dark")),
      true,
    );
    assert.deepEqual(errors, []);
    records.push({
      check: "rapid switches, keyboard and client navigation plus resize",
      passed: true,
    });

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => (window.failThemeUpdate = true));
    await page.getByRole("button", { name: "Toggle Theme", exact: true }).click();
    await finishTransitions(page);
    assert.deepEqual(errors, [{ name: "Error", message: "Intentional theme update failure" }]);
    records.push({
      check: "updateCallbackDone failure remains a page error",
      passed: true,
      expectedErrors: [...errors],
    });
  } finally {
    await context.close();
  }

  const reduced = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  try {
    const page = await reduced.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const start = document.startViewTransition?.bind(document);
      window.themeStarts = 0;
      if (start)
        document.startViewTransition = (callback) => {
          window.themeStarts++;
          return start(callback);
        };
    });
    await page.goto(origin + publicPath("/docs/components/line/"));
    await page.getByRole("button", { name: "Toggle Theme", exact: true }).click();
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
    await page.setViewportSize({ width: 320, height: 812 });
    assert.equal(await page.evaluate(() => window.themeStarts), 0);
    assert.deepEqual(errors, []);
    records.push({ check: "reduced motion updates theme without a view transition", passed: true });
  } finally {
    await reduced.close();
  }

  const invalid = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "no-preference",
  });
  try {
    const page = await invalid.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push({ name: error.name, message: error.message }));
    await page.addInitScript(() => {
      const start = document.startViewTransition?.bind(document);
      window.themeTransitions = [];
      if (start)
        document.startViewTransition = (callback) => {
          const transition = start(callback);
          window.themeTransitions.push(transition);
          return transition;
        };
    });
    await page.goto(origin + publicPath("/docs/components/line/"));
    await page.evaluate(() => {
      for (let i = 0; i < 2; i++) {
        const node = document.createElement("div");
        node.style.cssText = `position:fixed;top:${i * 15}px;left:0;width:10px;height:10px;view-transition-name:theme-negative-control`;
        document.body.append(node);
      }
    });
    await page.getByRole("button", { name: "Toggle Theme", exact: true }).click();
    await finishTransitions(page);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].name, "InvalidStateError");
    assert.ok(!errors[0].message.includes("Viewport size changed"));
    records.push({
      check: "unexpected snapshot failure remains visible",
      passed: true,
      expectedErrors: errors,
    });
  } finally {
    await invalid.close();
  }
  mkdirSync("artifacts", { recursive: true });
  writeFileSync(
    `artifacts/theme-switch${basePath ? "-prefix" : "-default"}.json`,
    JSON.stringify({ origin, basePath, workers: 1, records }, null, 2),
  );
  console.log(
    "Theme cancellation, rapid switches, resize, reduced motion and failure controls passed.",
  );
}
