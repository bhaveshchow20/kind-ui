import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR", String(e)));
for (const theme of ["light", "dark"])
  for (const width of [1100, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`http://127.0.0.1:6073/glass.html?theme=${theme}`);
    await page.waitForTimeout(700);
    await page.locator("[data-finish=glass] .recharts-rectangle").first().hover();
    await page.waitForTimeout(150);
    await page.screenshot({ path: `artifacts/glass/${theme}-${width}.png`, fullPage: true });
    console.log(
      theme,
      width,
      await page.locator("svg").count(),
      await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
        filters: [...document.querySelectorAll("filter")].map((e) => e.id),
      })),
    );
  }
await page.setViewportSize({ width: 2245, height: 500 });
const files = ["light-1100", "dark-1100", "light-320", "dark-320"];
const images = await Promise.all(
  files.map(
    async (f) =>
      `data:image/png;base64,${(await readFile(`artifacts/glass/${f}.png`)).toString("base64")}`,
  ),
);
await page.setContent(
  `<body style="margin:0;background:#dfe5ee;font:18px system-ui"><div style="display:flex;gap:15px;padding:20px">${images.map((src, i) => `<section style="width:${i < 2 ? 760 : 320}px;flex-shrink:0"><h2 style="font-size:18px">${["Desktop / Light", "Desktop / Dark", "320 px / Light", "320 px / Dark"][i]}</h2><img style="width:100%" src="${src}"></section>`).join("")}</div></body>`,
);
await page.screenshot({ path: "artifacts/glass/glass-contact-sheet.png", fullPage: true });
await browser.close();
