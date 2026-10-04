import { expect, test } from "@playwright/test";

test("public gate reveals no couple, date, or venue details", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.getByRole("heading", { level: 1, name: "Before we begin" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/Ruben|Andrea|Vienna|Wien|2027/i);
  await expect(page.locator("main img")).toHaveCount(0);
  await expect(page).toHaveTitle("A private invitation");
});

test("public entry keeps personalized wedding sections private", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.locator(".guest-gate .gate-card")).toHaveCount(1);
  await expect(page.getByRole("group", { name: "Choose your language" })).toBeVisible();
  await expect(page.getByLabel("Name, email, or phone number")).toHaveCount(0);
  await expect(page.locator(".day-story, .photo-story, .venues, .music-note, .gift-note, .rsvp-section")).toHaveCount(0);
});

test("progress indicator tracks the current gate step", async ({ page }) => {
  await page.goto("/?lang=en");

  const steps = page.getByRole("list", { name: "Steps to open your invitation" });
  await expect(steps.locator('[aria-current="step"]')).toHaveText("Language");
  await page.getByRole("group", { name: "Choose your language" }).getByRole("button", { name: "English" }).click();
  await expect(steps.locator('[aria-current="step"]')).toHaveText("Your details");
});

test("language selection advances to the separate lookup view and persists", async ({ page }) => {
  await page.goto("/?lang=en");

  await page.getByRole("group", { name: "Choose your language" }).getByRole("button", { name: "Español" }).click();

  await expect(page).toHaveURL(/\?lang=es$/);
  await expect(page.getByRole("heading", { name: "Encuentra tu invitación" })).toBeVisible();
  await expect(page.getByLabel("Nombre, correo o teléfono")).toBeVisible();
  await expect(page.getByRole("group", { name: "Elige tu idioma" })).toHaveCount(0);
});

test("invalid invitation token shows a safe not-found response", async ({ page }) => {
  const response = await page.goto("/i/not-a-real-token");

  expect(response?.status()).toBe(404);
});

test("lookup view can return to language selection", async ({ page }) => {
  await page.goto("/?lang=en");

  await page.getByRole("group", { name: "Choose your language" }).getByRole("button", { name: "English" }).click();
  await expect(page.getByLabel("Name, email, or phone number")).toBeVisible();
  await page.getByRole("button", { name: "Change language" }).click();

  await expect(page.getByRole("group", { name: "Choose your language" })).toBeVisible();
  await expect(page.getByLabel("Name, email, or phone number")).toHaveCount(0);
});

test("lookup form appears only after language selection", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.getByLabel("Name, email, or phone number")).toHaveCount(0);
  await page.getByRole("group", { name: "Choose your language" }).getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Find your invitation" })).toBeVisible();
  await expect(page.getByLabel("Name, email, or phone number")).toBeVisible();
  await expect(page.getByPlaceholder(/John Doe/)).toBeVisible();
});

test("admin sign-in renders translated labels and stays noindex", async ({ page }) => {
  const response = await page.goto("/admin");

  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(page.getByRole("heading", { name: /Sign in|Iniciar sesión/ })).toBeVisible();
  await expect(page.getByLabel(/Email address|Dirección de correo electrónico/)).toBeVisible();
});

test("guest gate fits mobile and desktop and honors reduced motion", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?lang=en");

    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
    await expect(page.locator(".guest-gate .gate-card")).toBeVisible();
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=en");

  const animationName = await page.locator(".gate-card__stage").evaluate((element) =>
    getComputedStyle(element).animationName,
  );
  expect(animationName).toBe("none");
});
