import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { canonicalDocURL } from "../../indexing.mjs";
import { publicPath } from "../lib/routing.mjs";

const browser = await chromium.launch(
  process.env.KIND_UI_CHROMIUM_PATH ? { executablePath: process.env.KIND_UI_CHROMIUM_PATH } : {},
);
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const origin = process.env.KIND_DOCS_BROWSER_ORIGIN || "http://127.0.0.1:6373";
  const canonical = await page.request.get(`${origin}${publicPath("/markdown/installation.md")}`);
  assert.equal(canonical.status(), 200);
  const installationMarkdown = await canonical.text();
  for (const slug of [
    "start/installation",
    "quickstart",
    "start/quickstart",
    "concepts/composition",
  ]) {
    const alias = await page.request.get(`${origin}${publicPath(`/markdown/${slug}.md`)}`);
    assert.equal(alias.status(), 200);
    assert.equal(await alias.text(), installationMarkdown);
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
    if (path.includes("quickstart"))
      await page.waitForURL(`**${publicPath("/docs/installation/#build-your-first-chart")}`);
    assert.equal((await page.reload()).status(), 200);
    if (path === "/" || path === "/docs/") {
      assert.equal(await page.locator("h1").innerText(), "Introduction");
      assert.match(await page.title(), /^Introduction/);
    }
    assert.equal(
      await page.locator('#nd-sidebar > button[aria-haspopup="dialog"]').innerText(),
      "Get Started",
    );
    if (path.includes("start/") || path.includes("quickstart")) {
      const slug = "installation";
      assert.equal(
        await page.locator('link[rel="canonical"]').getAttribute("href"),
        canonicalDocURL([slug]),
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
      /Get Started\s+Introduction\s+Installation\s+AI agents/,
    );
    const intro = sidebar.getByRole("link", { name: "Introduction", exact: true });
    assert.equal(await intro.count(), 1);
    assert.equal(await intro.getAttribute("href"), publicPath("/docs/"));
    for (const [name, slug] of [
      ["Installation", "installation"],
      ["AI agents", "agents/consumer"],
    ]) {
      assert.equal(
        await sidebar.getByRole("link", { name, exact: true }).getAttribute("href"),
        publicPath(`/docs/${slug}/`),
      );
    }
    assert.equal(await sidebar.getByRole("link", { name: "Quickstart", exact: true }).count(), 0);
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
    ]);
    await options.filter({ hasText: /^Concepts$/ }).click();
    await page.waitForURL(`**${publicPath("/docs/concepts/identity/")}`);
    assert.match(await page.locator("h1").innerText(), /Identity and colors/);
    if (
      mobile &&
      (await page
        .getByRole("button", { name: "Open Sidebar", exact: true })
        .getAttribute("aria-expanded")) === "false"
    )
      await page.getByRole("button", { name: "Open Sidebar", exact: true }).click();
    assert.equal(await trigger.innerText(), "Concepts");
  }
  for (const [legacy, destination] of [
    ["/docs/quickstart/#use-your-own-data", "/docs/installation/#use-your-own-data"],
    ["/docs/start/quickstart/#render-the-chart", "/docs/installation/#render-the-chart"],
    ["/docs/concepts/composition/", "/docs/installation/#composition"],
  ]) {
    assert.equal((await page.goto(`${origin}${publicPath(legacy)}`)).status(), 200);
    await page.waitForURL(`**${publicPath(destination)}`);
    assert.equal(await page.locator("h1").innerText(), "Installation");
  }
  assert.deepEqual(errors, []);
  console.log(
    "Installation first-chart merge, legacy redirects/Markdown, and desktop/mobile Get Started links passed.",
  );
} finally {
  await browser.close();
}
