import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { publicPath } from "../lib/routing.mjs";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const origin = "http://127.0.0.1:6373";
  for (const slug of ["installation", "quickstart"]) {
    const canonical = await page.request.get(`${origin}${publicPath(`/markdown/${slug}.md`)}`);
    const alias = await page.request.get(`${origin}${publicPath(`/markdown/start/${slug}.md`)}`);
    assert.equal(canonical.status(), 200);
    assert.equal(alias.status(), 200);
    assert.equal(await alias.text(), await canonical.text());
  }
  for (const path of [
    "/",
    "/docs/",
    "/docs/installation/",
    "/docs/quickstart/",
    "/docs/start/installation/",
    "/docs/start/quickstart/",
  ]) {
    const response = await page.goto(`${origin}${publicPath(path)}`);
    assert.equal(response.status(), 200);
    assert.equal((await page.reload()).status(), 200);
    if (path === "/" || path === "/docs/") {
      assert.equal(await page.locator("h1").innerText(), "Introduction");
      assert.match(await page.title(), /^Introduction/);
    }
    assert.equal(
      await page.locator('#nd-sidebar > button[aria-haspopup="dialog"]').innerText(),
      "Get Started",
    );
    if (path.includes("start/")) {
      const slug = path.split("/").at(-2);
      assert.equal(
        await page.locator('link[rel="canonical"]').getAttribute("href"),
        publicPath(`/docs/${slug}`),
      );
      assert.equal(await page.locator("#docs-content").getAttribute("data-doc"), slug);
    }
  }
  for (const mobile of [false, true]) {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1080 },
    );
    await page.goto(`${origin}${publicPath("/docs/")}`);
    if (
      mobile &&
      (await page
        .getByRole("button", { name: "Open Sidebar", exact: true })
        .getAttribute("aria-expanded")) === "false"
    )
      await page.getByRole("button", { name: "Open Sidebar", exact: true }).click();
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
        publicPath(`/docs/${slug}/`),
      );
    }
    await intro.click();
    await page.locator("h1").filter({ hasText: "Introduction" }).waitFor();
    if (
      mobile &&
      (await page
        .getByRole("button", { name: "Open Sidebar", exact: true })
        .getAttribute("aria-expanded")) === "false"
    )
      await page.getByRole("button", { name: "Open Sidebar", exact: true }).click();
    const trigger = sidebar.locator('button[aria-haspopup="dialog"]:visible');
    await trigger.click();
    const options = page
      .getByRole("dialog")
      .filter({ has: page.getByRole("link", { name: "Get Started", exact: true }) })
      .getByRole("link");
    assert.deepEqual(await options.allTextContents(), [
      "Get Started",
      "Concepts",
      "Components",
      "Chart Components",
      "Guides",
      "Agents",
    ]);
    await options.filter({ hasText: /^Concepts$/ }).click();
    await page.waitForURL(`**${publicPath("/docs/concepts/composition/")}`);
    assert.match(await page.locator("h1").innerText(), /Composition/);
    if (
      mobile &&
      (await page
        .getByRole("button", { name: "Open Sidebar", exact: true })
        .getAttribute("aria-expanded")) === "false"
    )
      await page.getByRole("button", { name: "Open Sidebar", exact: true }).click();
    assert.equal(await trigger.innerText(), "Concepts");
  }
  assert.deepEqual(errors, []);
  console.log("Introduction root/deep reload and desktop/mobile Get Started links passed.");
} finally {
  await browser.close();
}
