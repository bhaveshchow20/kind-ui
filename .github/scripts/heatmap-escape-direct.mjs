// Temporary diagnosis only; never merge. No package/production edits.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const guard = process.env.KIND_HEATMAP_DIRECT_GUARD === "1";
const root = resolve(`artifacts/heatmap-escape-diagnostic/${guard ? "direct-guard" : "direct"}`);
mkdirSync(root, { recursive: true });
writeFileSync(resolve(root, "identity.json"), JSON.stringify({ sha: process.env.GITHUB_SHA ?? null, node: process.version, platform: process.platform, provenance: JSON.parse(readFileSync("vendor/provenance.json", "utf8")) }, null, 2));
const preview = spawn(process.execPath, ["scripts/serve.mjs"], { stdio: ["ignore", "pipe", "inherit"] });
let browser;
const results = [];
try {
  await new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error("Preview startup timeout")), 15000);
    preview.once("error", reject);
    preview.once("exit", code => reject(new Error(`Preview exited ${code}`)));
    preview.stdout.on("data", data => { if (data.toString().includes("Docs static preview")) { clearTimeout(timer); accept(); } });
  });
  browser = await chromium.launch({ ...(process.env.KIND_DOCS_CHROMIUM ? { executablePath: process.env.KIND_DOCS_CHROMIUM } : {}) });
  for (const width of [375, 1440]) {
    const repetitions = width === 375 ? 24 : 6;
    for (let iteration = 1; iteration <= repetitions; iteration++) {
      await runCase(width, iteration, false);
    }
  }
  await runCase(375, 1, true);
} finally {
  if (browser) await browser.close();
  preview.kill("SIGTERM");
  writeFileSync(resolve(root, "results.json"), JSON.stringify(results, null, 2));
}
if (results.some(result => !result.passed)) process.exitCode = 1;

async function runCase(width, iteration, negative) {
  const label = `${negative ? "negative" : "stationary"}-${width}-${iteration}`;
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce", hasTouch: true, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let failure;
  let stage = "navigation";
  try {
    await page.addInitScript(({ negative, guard }) => {
      const events = [];
      window.__kindHeatmapDirect = events;
      let pointer = null;
      let serial = 0;
      const describe = node => node instanceof Element ? { tag: node.tagName, cell: node.closest("td[data-cell-key]")?.getAttribute("data-cell-key") ?? null, label: node.closest("td[data-cell-key]")?.getAttribute("aria-label") ?? node.getAttribute("aria-label"), kind: node.getAttribute("data-kind-ui") } : null;
      const primary = () => document.querySelector('[data-component="heatmap"]');
      const tooltip = () => primary()?.querySelector('[data-kind-ui="heatmap-tooltip"]');
      const record = (type, event, extra = {}) => {
        if (!tooltip() || events.length >= 4000) return;
        if (event?.clientX !== undefined) pointer = { x: event.clientX, y: event.clientY, pointerType: event.pointerType ?? null };
        events.push({ sequence: ++serial, at: performance.now(), type, key: event?.key ?? null, ctrlKey: event?.ctrlKey ?? null, target: describe(event?.target), focus: describe(document.activeElement), prevented: event?.defaultPrevented ?? null, trusted: event?.isTrusted ?? null, pointer, hidden: tooltip().hidden, text: tooltip().textContent, ...extra });
      };
      let observed = false;
      const resize = new ResizeObserver(entries => {
        for (const entry of entries) record("resize", null, { target: describe(entry.target), className: entry.target.className, width: entry.contentRect.width, height: entry.contentRect.height });
      });
      const observe = () => {
        if (observed || !tooltip()) return;
        const node = primary();
        for (const item of [node, node.querySelector(".preview-panel"), node.querySelector(".preview-panel")?.firstElementChild, node.querySelector('[data-kind-ui="heatmap"]'), node.querySelector('[data-kind-ui="heatmap-scroll"]'), tooltip()]) if (item) resize.observe(item);
        observed = true;
      };
      const mutations = (records, delivery) => {
        observe();
        for (let i = 0; i < records.length; i++) {
          const mutation = records[i];
          const next = records.slice(i + 1).find(item => item.target === mutation.target && item.type === "attributes" && item.attributeName === mutation.attributeName);
          const newValue = next ? next.oldValue : mutation.target instanceof Element && mutation.attributeName ? mutation.target.getAttribute(mutation.attributeName) : null;
          const node = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
          if (node === tooltip() && mutation.attributeName === "hidden") record("hidden-mutation", null, { oldValue: mutation.oldValue, newValue, currentValue: node.getAttribute("hidden"), delivery });
          else if (node === primary() && mutation.attributeName === "style") record("frame-style", null, { oldValue: mutation.oldValue, currentValue: node.getAttribute("style"), delivery });
          else if (node?.closest('[data-kind-ui="heatmap-tooltip"]') === tooltip()) record("tooltip-content", null, { delivery });
        }
      };
      const observer = new MutationObserver(records => mutations(records, "callback"));
      observer.observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["hidden", "style"], attributeOldValue: true });
      for (const key of ["keydown", "keyup"]) {
        document.addEventListener(key, event => { mutations(observer.takeRecords(), "before-key-capture"); record(`${key}:capture`, event); }, true);
        document.addEventListener(key, event => record(`${key}:bubble`, event));
        window.addEventListener(key, event => record(`${key}:window-bubble`, event));
      }
      for (const type of ["pointerover", "pointerout", "pointermove", "pointerdown", "focusin", "focusout"]) document.addEventListener(type, event => record(type, event), true);
      document.addEventListener("scroll", event => {
        if (event.target instanceof Element && event.target.closest('[data-component="heatmap"]')) record("scroll", event, { left: event.target.scrollLeft, top: event.target.scrollTop });
      }, true);
      if (guard) {
        let dismissedPointer = null;
        window.addEventListener("keydown", event => {
          if (event.key === "Escape" && pointer?.pointerType === "mouse") dismissedPointer = { ...pointer };
        }, true);
        for (const type of ["pointerover", "pointerout"]) window.addEventListener(type, event => {
          if (!dismissedPointer) return;
          if (event.clientX !== dismissedPointer.x || event.clientY !== dismissedPointer.y) { dismissedPointer = null; return; }
          const destination = type === "pointerout" ? event.relatedTarget : event.target;
          if (destination instanceof Element && destination.closest('[data-component="heatmap"] td[data-cell-key]')) {
            record("suppressed-passive-boundary", event, { destination: describe(destination), nativeType: type });
            event.stopPropagation();
          }
        }, true);
      }
      if (negative) window.addEventListener("keydown", event => {
        if (event.key === "Escape") { mutations(observer.takeRecords(), "before-disabled-key"); record("disabled-escape", event); event.stopImmediatePropagation(); }
      }, true);
    }, { negative, guard });
    await page.goto("http://127.0.0.1:6373/docs/components/heatmap/");
    const primary = page.locator('[data-component="heatmap"]');
    const grid = primary.locator('[data-kind-ui="heatmap-grid"]');
    await grid.waitFor();
    assert.equal(await grid.locator("td").count(), 24);
    const cell = grid.locator("td").first();
    // The original touch/focus/hover setup; geometry is only required to deliver touch.
    const target = await cell.boundingBox();
    await page.touchscreen.tap(target.x + target.width / 2, target.y + target.height / 2);
    await cell.focus();
    const tip = primary.getByRole("tooltip");
    await tip.waitFor({ state: "visible" });
    assert.equal(await tip.textContent(), "Mon, 08:00: 12");
    await cell.hover();
    assert.equal(await tip.textContent(), "Mon, 08:00: 12");
    await page.waitForTimeout(80); // Original pre-navigation settling step, unchanged.
    stage = "keyboard";
    for (const [key, label] of [["ArrowRight", "Mon, 10:00: 34"], ["ArrowDown", "Tue, 10:00: 42"], ["End", "Tue, 18:00: 0"], ["Control+End", "Thu, 18:00: No report"]]) {
      await page.keyboard.press(key);
      assert.equal(await page.locator("td:focus").getAttribute("aria-label"), label);
    }
    stage = "escape-hidden";
    await page.keyboard.press("Escape");
    await tip.waitFor({ state: "hidden", timeout: 1000 });
    stage = "passive-observation";
    // Observe frames without subsequent intentional input; this is no dismissal delay.
    await page.evaluate(async () => {
      const start = performance.now();
      while (performance.now() - start < 1000) await new Promise(requestAnimationFrame);
    });
    assert.equal(await tip.isVisible(), false, "Escape must stay dismissed without new input");
    assert.equal(await page.evaluate(() => {
      const events = window.__kindHeatmapDirect;
      const escape = events.findLast(event => event.type === "keydown:capture" && event.key === "Escape");
      return events.some(event => event.sequence > escape.sequence && event.type === "hidden-mutation" && event.newValue === null);
    }), false, "Escape must not transiently reopen without deliberate input");
    assert.equal(await page.locator("td:focus").getAttribute("aria-label"), "Thu, 18:00: No report");
    if (guard) {
      await page.mouse.move(1, 1);
      await cell.hover();
      await tip.waitFor({ state: "visible", timeout: 1000 });
      assert.equal(await tip.textContent(), "Mon, 08:00: 12", "Deliberate hover must reactivate");
    }
    assert.deepEqual(errors, []);
  } catch (error) {
    failure = error.stack ?? String(error);
  } finally {
    const events = await page.evaluate(() => window.__kindHeatmapDirect ?? []).catch(error => [{ captureError: error.message }]);
    writeFileSync(resolve(root, `${label}-events.json`), JSON.stringify(events, null, 2));
    if (failure) writeFileSync(resolve(root, `${label}-failure.txt`), failure);
    const passed = negative ? stage === "escape-hidden" && failure?.includes("locator.waitFor: Timeout 1000ms exceeded") && events.some(e => e.type === "disabled-escape") : !failure;
    results.push({ label, width, iteration, negative, passed: !!passed, stage, failure: failure ?? null, errors });
    console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
}
