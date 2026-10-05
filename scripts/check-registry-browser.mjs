import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, "artifacts/registry");
const { consumer } = JSON.parse(await readFile(resolve(output, "consumer.json"), "utf8"));
const require = createRequire(
  process.env.REGISTRY_TOOL_ROOT
    ? resolve(process.env.REGISTRY_TOOL_ROOT, "package.json")
    : new URL("../package.json", import.meta.url),
);
const { chromium, expect } = require("@playwright/test");
const host = spawn(
  process.execPath,
  [
    resolve(consumer, "node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "7374",
    "--strictPort",
  ],
  { cwd: consumer, stdio: "pipe" },
);
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (
      await fetch("http://127.0.0.1:7374")
        .then((r) => r.ok)
        .catch(() => false)
    ) {
      ready = true;
      break;
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  assert.ok(ready, "Consumer preview did not start");
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("http://127.0.0.1:7374");
  await expect(page.locator(".kind-recipe svg.recharts-surface")).toHaveCount(3);
  await expect(page.locator(".kind-recipe-line .recharts-line-curve")).toHaveCount(2);
  await expect(page.locator(".kind-recipe-area .recharts-area-area")).toHaveCount(2);
  await expect(page.locator(".kind-recipe-bar .recharts-bar-rectangle")).toHaveCount(12);
  assert.equal(
    await page
      .locator(".kind-recipe")
      .first()
      .evaluate((e) => getComputedStyle(e).backgroundColor),
    "rgb(255, 254, 249)",
  );
  assert.equal(
    await page
      .locator(".kind-recipe-line .recharts-line-curve")
      .first()
      .evaluate((e) => getComputedStyle(e).stroke),
    "rgb(57, 107, 87)",
  );
  const legend = page.locator(".kind-recipe-line").getByRole("button", { name: "This year" });
  await legend.focus();
  await page.keyboard.press("Enter");
  await expect(legend).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".kind-recipe-line .recharts-line-curve")).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(legend).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".kind-recipe-line .recharts-line-curve")).toHaveCount(2);
  const linePlot = page.locator(".kind-recipe-line svg.recharts-surface");
  await linePlot.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".kind-recipe-line [data-kind-ui='chart-tooltip']")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator(".kind-recipe-values summary").first().click();
  await expect(page.locator(".kind-recipe-line tbody tr")).toHaveCount(6);
  await page.getByLabel("Reporting period").selectOption("quarter");
  await expect(page.locator(".kind-recipe-line tbody tr")).toHaveCount(3);
  await expect(page.locator(".kind-recipe-line .kind-recipe-metric")).toContainText("213");
  await expect(page.locator(".kind-recipe-bar .recharts-bar-rectangle")).toHaveCount(6);
  await page.getByLabel("Reporting period").selectOption("half");
  await page.screenshot({ path: resolve(output, "dashboard-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "Page overflows mobile viewport",
  );
  const boxes = await page.locator(".kind-recipe").evaluateAll((nodes) =>
    nodes.map((e) => ({
      x: e.getBoundingClientRect().x,
      width: e.getBoundingClientRect().width,
    })),
  );
  assert.equal(boxes[0].x, boxes[1].x);
  assert.ok(boxes.every((box) => box.width > 250 && box.width < 390));
  await page.screenshot({ path: resolve(output, "dashboard-mobile.png"), fullPage: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".kind-recipe svg.recharts-surface")).toHaveCount(3);
  await expect(page.locator("[data-area-reveal]")).toHaveCount(0);
  await expect(page.locator(".kind-recipe-line .recharts-line-curve")).toHaveCount(2);
  assert.deepEqual(errors, []);
  const evidence = {
    passed: [
      "3 rendered charts and series",
      "scoped card and series colors",
      "keyboard legend visibility",
      "keyboard chart inspection",
      "native data alternative",
      "reporting period filter",
      "mobile layout without page overflow",
      "reduced-motion rendering",
      "no browser errors",
    ],
    screenshots: ["dashboard-desktop.png", "dashboard-mobile.png"],
    consumer,
  };
  await writeFile(resolve(output, "browser.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log("Registry consumer browser checks passed.");
} finally {
  await browser?.close();
  host.kill("SIGTERM");
}
