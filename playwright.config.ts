import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const port = new URL(baseURL).port || "3000";
const serverMode = process.env.PLAYWRIGHT_SERVER_MODE === "production" ? "start" : "dev";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL,
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `node ./node_modules/next/dist/bin/next ${serverMode} --hostname localhost --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
      },
});