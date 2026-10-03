import { expect, test } from "@playwright/test";

test("homepage renders the invitation shell", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.getByRole("heading", { name: "Ruben & Andrea" })).toBeVisible();
  await expect(page.getByText("A wedding in Vienna")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Privacy" }),
  ).toBeVisible();
});

test("public entry keeps personalized wedding sections private", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.locator(".guest-entry .lookup-section")).toHaveCount(1);
  await expect(page.locator(".day-story, .photo-story, .venues, .music-note, .gift-note, .rsvp-section")).toHaveCount(0);
});

test("entry navigation targets guest lookup", async ({ page }) => {
  await page.goto("/?lang=en");

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Find invitation" }).click();

  await expect(page).toHaveURL(/#lookup-section$/);
  await expect(page.getByRole("heading", { name: "Find Your Invitation" })).toBeVisible();
});

test("invalid invitation token shows a safe not-found response", async ({ page }) => {
  const response = await page.goto("/i/not-a-real-token");

  expect(response?.status()).toBe(404);
});

test("language switcher updates the locale on the public page", async ({ page }) => {
  await page.goto("/?lang=en");

  await page.getByRole("button", { name: "Español" }).first().click();

  await expect(page.getByText("Una boda en Viena")).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Privacidad" }),
  ).toBeVisible();
});

test("homepage renders invitation lookup card with language selector", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.getByRole("heading", { name: "Find Your Invitation" })).toBeVisible();
  await expect(page.getByLabel("Your name, email, or phone number")).toBeVisible();
  await expect(page.getByPlaceholder(/John Doe/)).toBeVisible();
});

test("admin sign-in renders translated labels and stays noindex", async ({ page }) => {
  const response = await page.goto("/admin");

  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(page.getByRole("heading", { name: /Sign in|Iniciar sesión/ })).toBeVisible();
  await expect(page.getByLabel(/Email address|Dirección de correo electrónico/)).toBeVisible();
});

test("guest entry fits mobile and desktop and honors reduced motion", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?lang=en");

    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
    await expect(page.locator(".guest-entry .lookup-section")).toBeVisible();
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=en");
  await expect(page.getByRole("heading", { name: "Ruben & Andrea" })).toBeVisible();

  const animationDuration = await page.locator(".hero__copy").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).animationDuration),
  );
  expect(animationDuration).toBeLessThan(0.001);
});


