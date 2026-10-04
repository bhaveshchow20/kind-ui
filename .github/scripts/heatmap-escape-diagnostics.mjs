// Temporary Linux diagnosis only. Never merge this branch.
// Import the original check without altering its actions or assertions.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const mode = process.env.KIND_HEATMAP_DIAGNOSTIC_MODE ?? "reference";
const artifacts = resolve(
  "artifacts/heatmap-escape-diagnostic",
  process.env.KIND_HEATMAP_DIAGNOSTIC_LABEL ?? mode,
);
mkdirSync(artifacts, { recursive: true });
writeFileSync(
  resolve(artifacts, "identity.json"),
  JSON.stringify(
    {
      node: process.version,
      platform: process.platform,
      sha: process.env.GITHUB_SHA ?? null,
      checkSha256: createHash("sha256")
        .update(readFileSync("scripts/check-heatmap-browser.mjs"))
        .digest("hex"),
      provenance: JSON.parse(readFileSync("vendor/provenance.json", "utf8")),
    },
    null,
    2,
  ),
);

const saved = new WeakSet();
const labels = new WeakMap();
let contextCount = 0;
async function saveContext(context) {
  if (mode === "retry") return;
  if (saved.has(context)) return;
  saved.add(context);
  const label = labels.get(context);
  const observations = [];
  for (const page of context.pages()) {
    if (!page.isClosed()) {
      try {
        observations.push(await page.evaluate(() => window.__kindHeatmapEscapeDiagnostic ?? []));
      } catch (error) {
        observations.push({ captureError: error.message });
      }
    }
  }
  writeFileSync(resolve(artifacts, `events-${label}.json`), JSON.stringify(observations, null, 2));
  try {
    await context.tracing.stop({ path: resolve(artifacts, `trace-${label}.zip`) });
  } catch (error) {
    writeFileSync(resolve(artifacts, `trace-error-${label}.txt`), error.stack ?? String(error));
  }
}

const launch = chromium.launch.bind(chromium);
chromium.launch = async (...args) => {
  const browser = await launch(...args);
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async (...contextArgs) => {
    const context = await newContext(...contextArgs);
    // Candidate repetitions change only the assertion, without tracing or event probes.
    if (mode === "retry") return context;
    labels.set(
      context,
      `${++contextCount}-${contextArgs[0]?.viewport?.width ?? "unknown"}-${contextArgs[0]?.reducedMotion ?? "default"}`,
    );
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    await context.addInitScript((mode) => {
      if (mode === "negative") {
        window.addEventListener(
          "keydown",
          (event) => {
            if (event.key === "Escape") event.stopImmediatePropagation();
          },
          true,
        );
      }
      const events = [];
      Object.defineProperty(window, "__kindHeatmapEscapeDiagnostic", { value: events });
      const describe = (node) =>
        node instanceof Element
          ? {
              tag: node.tagName,
              id: node.id,
              cell: node.getAttribute("data-cell-key"),
              kind: node.getAttribute("data-kind-ui"),
              label: node.getAttribute("aria-label"),
            }
          : null;
      const record = (type, event) => {
        const tooltip = document.querySelector(
          '[data-component="heatmap"] [data-kind-ui="heatmap-tooltip"]',
        );
        if (!tooltip || events.length >= 1000) return;
        events.push({
          at: performance.now(),
          type,
          key: event?.key ?? null,
          prevented: event?.defaultPrevented ?? null,
          target: describe(event?.target),
          focus: describe(document.activeElement),
          hidden: tooltip.hidden,
          display: getComputedStyle(tooltip).display,
          text: tooltip.textContent,
        });
      };
      for (const name of ["keydown", "keyup"]) {
        document.addEventListener(name, (event) => record(`${name}:capture`, event), true);
        document.addEventListener(name, (event) => record(`${name}:bubble`, event));
      }
      for (const name of ["focusin", "focusout", "pointerover", "pointerout", "pointermove"]) {
        document.addEventListener(name, (event) => record(name, event), true);
      }
      new MutationObserver((records) => {
        if (
          records.some((record) => {
            const node =
              record.target instanceof Element ? record.target : record.target.parentElement;
            return node?.closest('[data-kind-ui="heatmap-tooltip"]');
          })
        ) {
          record("tooltip-mutation");
        }
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden"],
        childList: true,
        characterData: true,
      });
    }, mode);
    if (mode === "snapshot") {
      const newPage = context.newPage.bind(context);
      context.newPage = async (...args) => {
        const page = await newPage(...args);
        const press = page.keyboard.press.bind(page.keyboard);
        let escapeCount = 0;
        page.keyboard.press = async (key, ...args) => {
          if (key !== "Escape") return press(key, ...args);
          const snapshot = await page.evaluate(() => {
            const target = document.activeElement;
            const tooltip = document.querySelector(
              '[data-component="heatmap"] [data-kind-ui="heatmap-tooltip"]',
            );
            const beforeHidden = tooltip.hidden;
            target.dispatchEvent(
              new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
            );
            const immediatelyHidden = tooltip.hidden;
            target.dispatchEvent(
              new KeyboardEvent("keyup", { key: "Escape", bubbles: true, cancelable: true }),
            );
            return {
              beforeHidden,
              immediatelyHidden,
              focusedCell: target.getAttribute("data-cell-key"),
            };
          });
          // Only the first Escape targets the primary tooltip; later examples differ.
          if (escapeCount === 0) {
            assert.equal(snapshot.beforeHidden, false);
            assert.equal(snapshot.immediatelyHidden, false);
          }
          writeFileSync(
            resolve(artifacts, `synchronous-${labels.get(context)}-${++escapeCount}.json`),
            JSON.stringify(snapshot, null, 2),
          );
        };
        return page;
      };
    }
    const close = context.close.bind(context);
    context.close = async (...closeArgs) => {
      try {
        await saveContext(context);
      } finally {
        await close(...closeArgs);
      }
    };
    return context;
  };
  const close = browser.close.bind(browser);
  browser.close = async (...closeArgs) => {
    try {
      for (const context of browser.contexts()) await saveContext(context);
    } finally {
      await close(...closeArgs);
    }
  };
  return browser;
};

const originalPath = resolve("scripts/check-heatmap-browser.mjs");
const temporaryPath = resolve("scripts/.heatmap-diagnostic-check.mjs");
const snapshotAssertion = "assert.equal(await tooltip.isVisible(), false);";
const hiddenAssertion = 'await tooltip.waitFor({ state: "hidden", timeout: 1000 });';
let checkPath = originalPath;
if (["retry", "negative", "snapshot"].includes(mode)) {
  const original = readFileSync(originalPath, "utf8");
  if (original.split(snapshotAssertion).length !== 2)
    throw new Error("Expected exactly one Escape snapshot assertion");
  writeFileSync(temporaryPath, original.replace(snapshotAssertion, hiddenAssertion));
  checkPath = temporaryPath;
}
const preview = spawn(process.execPath, ["scripts/serve.mjs"], {
  stdio: ["ignore", "pipe", "inherit"],
});
try {
  await new Promise((accept, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Preview did not start in 15 seconds")),
      15000,
    );
    preview.once("error", reject);
    preview.once("exit", (code) => reject(new Error(`Preview exited with ${code}`)));
    preview.stdout.on("data", (data) => {
      if (data.toString().includes("Docs static preview")) {
        clearTimeout(timeout);
        accept();
      }
    });
  });
  await import(checkPath);
} catch (error) {
  writeFileSync(resolve(artifacts, "failure.txt"), error.stack ?? String(error));
  throw error;
} finally {
  preview.kill("SIGTERM");
  if (checkPath === temporaryPath) unlinkSync(temporaryPath);
}
