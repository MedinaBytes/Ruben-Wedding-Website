import { expect, test } from "@playwright/test";

test("homepage renders the invitation shell", async ({ page }) => {
  await page.goto("/?lang=en");

  await expect(page.getByRole("heading", { name: "Ruben & Andrea" })).toBeVisible();
  await expect(page.getByText("A wedding in Vienna")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Privacy" }),
  ).toBeVisible();
});

test("day navigation targets the shared timeline", async ({ page }) => {
  await page.goto("/?lang=en");

  const continueBtn = page.getByRole("button", { name: /Continue to Wedding Details|Continuar a los detalles/ });
  if (await continueBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await continueBtn.click();
  }

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "The day" }).click();

  await expect(page).toHaveURL(/#event-note$/);
  await expect(page.getByRole("heading", { name: "The day, together" })).toBeVisible();
});

test("invalid invitation token shows a safe not-found response", async ({ page }) => {
  const response = await page.goto("/i/not-a-real-token");

  expect(response?.status()).toBe(404);
});

test("language switcher updates the locale on the public page", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Español" }).first().click();

  await expect(page.getByText("Una boda en Viena")).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Privacidad" }),
  ).toBeVisible();
});

test("admin sign-in renders translated labels and stays noindex", async ({ page }) => {
  const response = await page.goto("/admin");

  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(page.getByRole("heading", { name: /Sign in|Iniciar sesión/ })).toBeVisible();
  await expect(page.getByLabel(/Email address|Dirección de correo electrónico/)).toBeVisible();
});

test("photo story gallery spans the full row at tablet width", async ({ page }) => {
  await page.setViewportSize({ width: 905, height: 800 });
  await page.goto("/");

  const bounds = await page.locator(".photo-story").evaluate((section) => {
    const intro = section.querySelector(".photo-story__intro")?.getBoundingClientRect();
    const gallery = section.querySelector(".photo-story__gallery")?.getBoundingClientRect();
    const bento = section.querySelector(".bento-gallery-block")?.getBoundingClientRect();

    return {
      introWidth: intro?.width ?? 0,
      galleryWidth: gallery?.width ?? 0,
      bentoWidth: bento?.width ?? 0,
    };
  });

  expect(bounds.bentoWidth).toBeGreaterThan(bounds.galleryWidth);
  expect(bounds.bentoWidth).toBeGreaterThan(bounds.introWidth + bounds.galleryWidth * 0.7);
});

test("venue map exposes localized controls and OpenStreetMap attribution", async ({ page }) => {
  await page.goto("/");

  const map = page.getByRole("region", { name: "Interactive map of the wedding venues in Vienna" });
  await map.scrollIntoViewIfNeeded();
  await expect(map).toHaveAttribute("aria-busy", "false", { timeout: 15000 });
  await expect(page.getByRole("button", { name: "View both venues" })).toBeEnabled();
  await expect(page.locator(".leaflet-control-attribution")).toContainText("OpenStreetMap contributors");

  const ceremonyControl = page.getByRole("button", { name: "Ceremony: Catholic Church of Altmannsdorf (St. Oswald)" });
  await ceremonyControl.click();
  await expect(ceremonyControl).toHaveAttribute("aria-pressed", "true");
  const selectedColors = await ceremonyControl.evaluate((button) => {
    const styles = getComputedStyle(button);
    return { background: styles.backgroundColor, foreground: styles.color };
  });
  expect(selectedColors.foreground).not.toBe(selectedColors.background);
});

test("photo archive filters and restores focus after keyboard viewing", async ({ page }) => {
  await page.goto("/");

  const filters = page.getByRole("group", { name: "Filter memories" });
  const adventuresFilter = filters.getByRole("button", { name: "Adventures & Sea" });
  await adventuresFilter.click();
  await expect(adventuresFilter).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".bento-tag").first()).toHaveCSS("text-transform", "none");
  await expect(page.locator(".bento-tag").first()).toHaveCSS("border-radius", "0px");

  const firstPhoto = page.getByRole("button", { name: /^Open photo:/ }).first();
  await firstPhoto.focus();
  await page.keyboard.press("Enter");

  const viewer = page.getByRole("dialog", { name: "Photo viewer" });
  await expect(viewer).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(viewer.locator(".lightbox-counter")).toContainText("2 of");
  await page.keyboard.press("Escape");
  await expect(viewer).not.toBeVisible();
  await expect(firstPhoto).toBeFocused();
});

test("hero and photo story fit mobile and desktop and honor reduced motion", async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ruben & Andrea" })).toBeVisible();

  const animationDuration = await page.locator(".hero__copy").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).animationDuration),
  );
  expect(animationDuration).toBeLessThan(0.001);
});


