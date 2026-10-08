import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "@playwright/test";
import { analyticsScript } from "../apps/analytics.mjs";

test("analytics is omitted outside production and validates public IDs", () => {
  assert.equal(
    analyticsScript({ KIND_UI_DEPLOYMENT_ENV: "preview", NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST" }),
    null,
  );
  assert.equal(
    analyticsScript({ KIND_UI_DEPLOYMENT_ENV: "production", NEXT_PUBLIC_GA_MEASUREMENT_ID: "" }),
    null,
  );
  assert.throws(() =>
    analyticsScript({
      KIND_UI_DEPLOYMENT_ENV: "production",
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'bad"<script>',
    }),
  );
});

test("opt-in analytics protects contents, deduplicates routes, and supports withdrawal", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const requests = [];
    await page.route("https://www.googletagmanager.com/**", async (route) => {
      requests.push(route.request().url());
      await route.fulfill({ body: "", contentType: "text/javascript" });
    });
    await page.route("https://kindui.dev/**", (route) =>
      route.fulfill({
        body: '<title>Charts</title><a href="/charts/docs/installation/?private=value">Docs</a><a href="https://github.com/bhaveshchow20/kind-ui">GitHub</a>',
        contentType: "text/html",
      }),
    );
    await page.goto("https://kindui.dev/charts?secret=value#private");
    await page.evaluate(
      analyticsScript({
        KIND_UI_DEPLOYMENT_ENV: "production",
        NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST",
      }),
    );
    await page.getByRole("button", { name: "Decline", exact: true }).click();
    assert.equal(requests.length, 0);
    assert.equal(await page.evaluate(() => window.dataLayer), undefined);
    await page.getByRole("button", { name: "Analytics preferences", exact: true }).click();
    await page.getByRole("button", { name: "Allow", exact: true }).click();
    await page.waitForFunction(() => window.dataLayer?.some((entry) => entry[1] === "page_view"));
    await page.evaluate(() => {
      history.pushState({}, "", "/charts/docs/installation/?email=private#secret");
      history.replaceState({}, "", "/charts/docs/installation/?other=secret");
      window.dispatchEvent(new CustomEvent("kind-ui-copy", { detail: "prompt" }));
      window.dispatchEvent(new CustomEvent("kind-ui-copy", { detail: "PRIVATE PROMPT CONTENT" }));
      document
        .querySelector('a[href^="https://github"]')
        .addEventListener("click", (event) => event.preventDefault());
      document.querySelector('a[href^="https://github"]').click();
    });
    await page.waitForFunction(
      () => window.dataLayer.filter((entry) => entry[1] === "page_view").length === 2,
    );
    const queue = await page.evaluate(() => window.dataLayer.map((entry) => Array.from(entry)));
    assert.equal(queue.filter((entry) => entry[1] === "copy_example").length, 1);
    assert.equal(queue.filter((entry) => entry[1] === "github_click").length, 1);
    assert.ok(!JSON.stringify(queue).includes("private"));
    assert.ok(!JSON.stringify(queue).includes("secret"));
    assert.ok(!JSON.stringify(queue).includes("PRIVATE PROMPT"));
    await page.getByRole("button", { name: "Analytics preferences", exact: true }).click();
    await page.getByRole("button", { name: "Decline", exact: true }).click();
    await page.waitForLoadState();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("kind-ui-analytics-consent")),
      "denied",
    );
    const context = await browser.newContext();
    await context.addInitScript(() =>
      Object.defineProperty(navigator, "globalPrivacyControl", { value: true }),
    );
    const privatePage = await context.newPage();
    await privatePage.route("https://kindui.dev/**", (route) =>
      route.fulfill({ body: "<title>Private</title>", contentType: "text/html" }),
    );
    await privatePage.goto("https://kindui.dev/charts");
    await privatePage.evaluate(() => localStorage.setItem("kind-ui-analytics-consent", "granted"));
    await privatePage.evaluate(
      analyticsScript({
        KIND_UI_DEPLOYMENT_ENV: "production",
        NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST",
      }),
    );
    assert.equal(await privatePage.evaluate(() => window.dataLayer), undefined);
    await context.close();
  } finally {
    await browser.close();
  }
});
