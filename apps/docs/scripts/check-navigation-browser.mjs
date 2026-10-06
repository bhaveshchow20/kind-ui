import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { publicPath } from "../lib/routing.mjs";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const origin = "http://127.0.0.1:6373";
  for (const path of ["/", "/docs/", "/docs/start/installation/", "/docs/start/quickstart/"]) {
    const response = await page.goto(`${origin}${publicPath(path)}`);
    assert.equal(response.status(), 200);
    assert.equal((await page.reload()).status(), 200);
    if (path === "/" || path === "/docs/") {
      assert.equal(await page.locator("h1").innerText(), "Introduction");
      assert.match(await page.title(), /^Introduction/);
    }
  }
  for (const mobile of [false, true]) {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1080 },
    );
    await page.goto(`${origin}${publicPath("/docs/")}`);
    if (mobile) await page.getByRole("button", { name: "Open Sidebar", exact: true }).click();
    const sidebar = page.locator(mobile ? "#nd-sidebar-mobile" : "#nd-sidebar");
    await sidebar.waitFor({ state: "visible" });
    assert.match(
      await sidebar.innerText(),
      /Get Started\s+Introduction\s+Installation\s+Quickstart/,
    );
    const intro = sidebar.getByRole("link", { name: "Introduction", exact: true });
    assert.equal(await intro.count(), 1);
    assert.equal(await intro.getAttribute("href"), publicPath("/docs/"));
    for (const [name, slug] of [
      ["Installation", "installation"],
      ["Quickstart", "quickstart"],
    ]) {
      assert.equal(
        await sidebar.getByRole("link", { name, exact: true }).getAttribute("href"),
        publicPath(`/docs/start/${slug}/`),
      );
    }
    await intro.click();
    await page.locator("h1").filter({ hasText: "Introduction" }).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log("Introduction root/deep reload and desktop/mobile Get Started links passed.");
} finally {
  await browser.close();
}
