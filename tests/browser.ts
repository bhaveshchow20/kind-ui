import { test as base } from "@playwright/test";

export * from "@playwright/test";

// Run the unchanged packed-consumer routes on isolated ports when workers share a host.
export const test = base.extend({
  page: async ({ page }, use) => {
    const offset = Number(process.env.KIND_UI_TEST_PORT_BASE ?? 4173) - 4173;
    if (offset !== 0) {
      const navigate = page.goto.bind(page);
      page.goto = (address, options) => {
        if (!/^https?:\/\//.test(address)) return navigate(address, options);
        const url = new URL(address, "http://127.0.0.1");
        const port = Number(url.port);
        if (url.hostname === "127.0.0.1" && port >= 4173 && port <= 4193)
          url.port = String(port + offset);
        return navigate(url.href, options);
      };
    }
    await use(page);
  },
});
