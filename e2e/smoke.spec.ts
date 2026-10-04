import { expect, test } from "@playwright/test";

test("neutral landing page renders couple initials and instructs personal link usage", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.getByRole("heading", { level: 1, name: /Ruben.*Andrea/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin Portal" })).toBeVisible();
  await expect(page.getByText(/Personal Invitation/i)).toBeVisible();
});

test("neutral landing page is fully responsive across mobile and desktop", async ({ page }) => {
  for (const width of [320, 375, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?lang=en");

    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
    await expect(page.locator(".guest-gate__card")).toBeVisible();
  }
});

test("botanical dev preview showcases all custom botanical artwork", async ({ page }) => {
  await page.goto("/dev/botanical");

  await expect(page.getByRole("heading", { name: /Contemporary Botanical Minimalist Artwork Suite/i })).toBeVisible();
  await expect(page.locator("#orchid-stem-cascade")).toBeVisible();
  await expect(page.locator("#orchid-single-bloom")).toBeVisible();
  await expect(page.locator("#orchid-linework")).toBeVisible();
  await expect(page.locator("#orchid-corner")).toBeVisible();
  await expect(page.locator("#seal-monogram")).toBeVisible();
});

test("admin login portal renders email and password fields", async ({ page }) => {
  await page.goto("/admin/login");

  await expect(page.getByRole("heading", { name: "Admin Sign In" })).toBeVisible();
  await expect(page.getByLabel("Admin Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In to Dashboard" })).toBeVisible();
});

test("invalid invitation token renders safe not-found recovery page", async ({ page }) => {
  await page.goto("/i/not-a-real-token-xyz");

  await expect(page.getByRole("heading", { name: /Invitation Link Not Found/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to Home" })).toBeVisible();
});
