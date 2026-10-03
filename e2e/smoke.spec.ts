import { expect, test } from "@playwright/test";

test("homepage renders the invitation shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Ruben & Andrea" })).toBeVisible();
  await expect(page.getByText("A wedding in Vienna")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Privacy" }),
  ).toBeVisible();
});

test("invalid invitation token shows a safe not-found response", async ({ page }) => {
  const response = await page.goto("/i/not-a-real-token");

  expect(response?.status()).toBe(404);
});

test("language switcher updates the locale on the public page", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Español" }).click();

  await expect(page.getByText("Una boda en Viena")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Privacidad" }),
  ).toBeVisible();
});

test("admin sign-in renders translated labels and stays noindex", async ({ page }) => {
  const response = await page.goto("/admin");

  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
});
