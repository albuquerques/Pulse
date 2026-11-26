import { expect, test } from "@playwright/test";

test("a home mostra o resultado de /api/health", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Pulse" })).toBeVisible();
  // Same origin: the page asks for a relative /api/health and the server answers.
  await expect(page.getByTestId("health")).toHaveText(/^API ok · versão \d+\.\d+\.\d+$/);
});
