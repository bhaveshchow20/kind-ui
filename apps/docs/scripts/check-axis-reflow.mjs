import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "../../../node_modules/@playwright/test/index.mjs";

const dir = new URL("../artifacts/axis-reflow/", import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evidence = {
  scope: "Only revised Combo component desktop/mobile and 200% axis text",
  scenarios: [],
  errors: [],
};
async function bounds(page) {
  return page.locator(".combo-demo").evaluate((root) => {
    const svg = root.querySelector(".recharts-surface");
    const box = svg.getBoundingClientRect();
    const ticks = [...svg.querySelectorAll(".recharts-cartesian-axis-tick-value")].map((node) => {
      const r = node.getBoundingClientRect();
      return {
        text: node.textContent,
        fontSize: parseFloat(getComputedStyle(node).fontSize),
        left: r.left - box.left,
        right: r.right - box.left,
        top: r.top - box.top,
        bottom: r.bottom - box.top,
      };
    });
    return {
      width: box.width,
      height: box.height,
      ticks,
      clipped: ticks.filter(
        (t) =>
          t.left < -0.5 || t.right > box.width + 0.5 || t.top < -0.5 || t.bottom > box.height + 0.5,
      ),
    };
  });
}
async function settled(page, size) {
  await page.waitForFunction(
    ({ size }) => {
      const svg = document.querySelector(".combo-demo .recharts-surface");
      if (!svg) return false;
      const r = svg.getBoundingClientRect();
      const ticks = [...svg.querySelectorAll(".recharts-cartesian-axis-tick-value")];
      return (
        ticks.length > 6 &&
        ticks.every((n) => {
          const t = n.getBoundingClientRect();
          return (
            Math.abs(parseFloat(getComputedStyle(n).fontSize) - size) < 0.1 &&
            t.left >= r.left - 0.5 &&
            t.right <= r.right + 0.5 &&
            t.top >= r.top - 0.5 &&
            t.bottom <= r.bottom + 0.5
          );
        })
      );
    },
    { size },
    { timeout: 10000 },
  );
}
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 1080 },
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => evidence.errors.push(e.message));
    await page.goto("http://127.0.0.1:6373/docs/components/combo/", { waitUntil: "networkidle" });
    await settled(page, 12);
    const normal = await bounds(page);
    evidence.diagnostic = { width, normal };
    assert.ok(normal.ticks.some((t) => t.text === "80"));
    assert.ok(normal.ticks.some((t) => t.text === "400"));
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    if (width === 1440)
      await page.screenshot({ path: `${dir}/components-combo-dark-desktop.png`, fullPage: false });
    if (width === 390)
      await page.screenshot({ path: `${dir}/components-combo-dark-mobile.png`, fullPage: false });
    await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
    await settled(page, 24);
    const enlarged = await bounds(page);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    assert.deepEqual(enlarged.clipped, []);
    assert.ok(enlarged.ticks.some((t) => t.text === "80"));
    assert.ok(enlarged.ticks.some((t) => t.text === "400"));
    await page
      .locator(".combo-plot")
      .screenshot({ path: `${dir}/combo-${width}-200-percent-plot.png` });
    await page.getByRole("tab", { name: "Code", exact: true }).click();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.getByRole("tab", { name: "Preview", exact: true }).click();
    await page.getByRole("button", { name: "Queued", exact: true }).click();
    await settled(page, 24);
    await page.getByText("View data", { exact: true }).click();
    await page.getByRole("table").waitFor();
    assert.equal(await page.getByRole("table").locator("tbody tr").count(), 6);
    assert.deepEqual(
      await page
        .getByRole("table")
        .locator("tbody tr")
        .filter({ hasText: "12:00" })
        .locator("td")
        .allTextContents(),
      ["0", "0", "110"],
    );
    if (width < 900) {
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await page.getByRole("dialog", { name: "Documentation navigation", exact: true }).waitFor();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      );
      await page.getByRole("button", { name: "Close navigation", exact: true }).click();
    }
    evidence.scenarios.push({
      width,
      normal,
      enlarged,
      checks: [
        "Axis fonts12→24px",
        "Every visible tick fits inside SVG in both dimensions",
        "Domains0–80 tasks and0–400ms retained",
        "No viewport overflow",
        "Tabs and legend visibility operable",
        "Six-row data alternative retains noon zero",
      ],
    });
    await context.close();
  }
  const initial = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  await initial.addInitScript(() => {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        document.documentElement.style.fontSize = "200%";
      },
      { once: true },
    );
  });
  const ip = await initial.newPage();
  await ip.goto("http://127.0.0.1:6373/docs/components/combo/", { waitUntil: "networkidle" });
  await settled(ip, 24);
  evidence.initial200 = await bounds(ip);
  await initial.close();
  assert.deepEqual(evidence.errors, []);
  evidence.status = "passed";
} catch (error) {
  evidence.status = "failed";
  evidence.error = error.stack;
  throw error;
} finally {
  writeFileSync(`${dir}/evidence.json`, JSON.stringify(evidence, null, 2) + "\n");
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      status: evidence.status,
      scenarioWidths: evidence.scenarios.map((s) => s.width),
      initial200: evidence.initial200?.clipped,
      pageErrors: evidence.errors,
    },
    null,
    2,
  ),
);
