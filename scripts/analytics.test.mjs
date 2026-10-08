import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { chromium } from "@playwright/test";
import { webAnalytics } from "../apps/analytics.mjs";

const production = { KIND_UI_DEPLOYMENT_ENV: "production" };
test("Cloudflare analytics is production-only and validates its public token", () => {
  assert.equal(webAnalytics({ KIND_UI_DEPLOYMENT_ENV: "preview" }), null);
  assert.equal(webAnalytics({}), null);
  assert.equal(webAnalytics({ ...production, NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: "" }), null);
  assert.throws(() =>
    webAnalytics({ ...production, NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: 'bad"<script>' }),
  );
  const analytics = webAnalytics(production);
  assert.equal(analytics.src, "https://static.cloudflareinsights.com/beacon.min.js");
  assert.match(JSON.parse(analytics.beacon).token, /^[a-f0-9]{32}$/);
});

test("both app layouts use one external beacon and have no consent initializer", () => {
  for (const app of ["showcase", "docs"]) {
    const source = readFileSync(new URL(`../apps/${app}/app/layout.tsx`, import.meta.url), "utf8");
    assert.equal(source.match(/id="kind-ui-web-analytics"/g)?.length, 1);
    assert.match(source, /src=\{analytics.src\}/);
    assert.match(source, /data-cf-beacon=\{analytics.beacon\}/);
    assert.doesNotMatch(source, /analyticsScript|initializeAnalytics|googletagmanager/);
  }
});

test("analytics loads only the Cloudflare beacon without adding UI or browser storage", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const requests = [];
    await page.route("https://kindui.dev/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<body><main>Charts</main></body>" }),
    );
    await page.route("https://static.cloudflareinsights.com/**", (route) => {
      requests.push(route.request().url());
      return route.fulfill({ contentType: "text/javascript", body: "window.beaconLoaded = true;" });
    });
    await page.goto("https://kindui.dev/charts");
    const analytics = webAnalytics(production);
    await page.evaluate((analytics) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = analytics.src;
      script.dataset.cfBeacon = analytics.beacon;
      document.body.append(script);
    }, analytics);
    await page.waitForFunction(() => window.beaconLoaded);
    assert.deepEqual(requests, [analytics.src]);
    assert.equal(await page.locator("button,dialog,[role=dialog]").count(), 0);
    assert.equal(await page.locator("main").textContent(), "Charts");
    assert.equal(await page.evaluate(() => localStorage.length), 0);
    assert.equal((await page.context().cookies()).length, 0);
  } finally {
    await browser.close();
  }
});
