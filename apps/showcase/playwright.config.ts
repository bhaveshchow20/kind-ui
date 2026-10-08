import { defineConfig, devices } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_SHOWCASE_BASE_PATH ?? "";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://127.0.0.1:7273${basePath}/`, trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.KIND_UI_CHROMIUM_PATH
          ? { launchOptions: { executablePath: process.env.KIND_UI_CHROMIUM_PATH } }
          : {}),
      },
    },
    {
      name: "webkit-desktop",
      testMatch: ["headline-layout.spec.ts", "tooltip-layout.spec.ts"],
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "webkit-mobile",
      testMatch: [
        "responsive-cards.spec.ts",
        "activity-colors.spec.ts",
        "headline-layout.spec.ts",
        "mobile-theme.spec.ts",
        "tooltip-layout.spec.ts",
      ],
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 7273",
    url: "http://127.0.0.1:7273",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
