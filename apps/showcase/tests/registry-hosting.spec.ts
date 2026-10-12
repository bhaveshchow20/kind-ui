import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";

test.skip(process.env.KIND_UI_DOMAIN_ROOT !== "1", "Requires the prepared domain-root host");

test("root registry serves the exact generated JSON independently of app mounts", async ({
  request,
  baseURL,
}) => {
  if (!baseURL) throw new Error("Hosting checks require a configured server");
  const origin = new URL(baseURL).origin;
  const directory = path.resolve("../../artifacts/registry/r");
  for (const filename of await readdir(directory)) {
    const response = await request.get(`${origin}/r/${filename}`, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(await response.text()).toBe(await readFile(path.join(directory, filename), "utf8"));
  }
  for (const pathname of ["/r", "/r/"]) {
    const response = await request.get(`${origin}${pathname}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(await response.text()).toBe(
      await readFile(path.join(directory, "registry.json"), "utf8"),
    );
  }
  for (const pathname of [
    "/r/missing.json",
    "/charts/r/line-chart.json",
    "/charts/docs/r/line-chart.json",
  ]) {
    expect((await request.get(`${origin}${pathname}`)).status()).toBe(404);
  }
});

test("combined host preserves chart and nested Docs routes and their assets", async ({
  page,
  request,
  baseURL,
}) => {
  if (!baseURL) throw new Error("Hosting checks require a configured server");
  const origin = new URL(baseURL).origin;
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400)
      failures.push(response.url());
  });
  await page.goto(`${origin}/charts`);
  await expect(page.locator(".wordmark")).toHaveAttribute("href", "/charts");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const pathname of ["/charts/docs/", "/charts/docs/components/line/"]) {
    const response = await request.get(`${origin}${pathname}`, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain(`href="https://kindui.dev${pathname}"`);
    expect(body).not.toContain("noindex");
    const stylesheet = /<link[^>]+href="([^"]+\.css(?:\?[^"]*)?)"/.exec(body)?.[1];
    if (!stylesheet) throw new Error(`Docs route ${pathname} has no stylesheet`);
    const asset = await request.get(new URL(stylesheet, origin).href);
    expect(asset.status()).toBe(200);
    expect(asset.headers()["content-type"]).toContain("text/css");
  }
  await page.goto(`${origin}/charts/docs/components/line/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Line");
  await page.getByRole("link", { name: "Area Chart", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Area");
  expect(failures).toEqual([]);
});
