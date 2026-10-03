import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

mkdirSync("artifacts/screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:6373/docs/components/combo/", { waitUntil: "load" });
await page.locator(".recharts-bar-rectangle").first().waitFor();
await page.screenshot({ path: "artifacts/screenshots/combo-desktop.png", fullPage: true });
await page.goto("http://127.0.0.1:6373/docs/components/donut/", { waitUntil: "load" });
await page.locator(".recharts-pie-sector").first().waitFor();
await page.screenshot({ path: "artifacts/screenshots/donut-desktop.png", fullPage: true });
await page.setViewportSize({ width: 375, height: 812 });
await page.screenshot({ path: "artifacts/screenshots/donut-mobile.png", fullPage: true });
writeFileSync(
  "artifacts/slice-browser.json",
  JSON.stringify(
    {
      pageErrors: errors,
      screenshots: ["combo-desktop.png", "donut-desktop.png", "donut-mobile.png"],
    },
    null,
    2,
  ),
);
await context.close();
await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
