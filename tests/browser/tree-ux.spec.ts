import { test, expect } from "@playwright/test";

for (const device of [
  { name: "mobile", viewport: { width: 390, height: 844 } },
  { name: "iPad portrait", viewport: { width: 820, height: 1180 } },
  { name: "iPad landscape", viewport: { width: 1024, height: 768 } },
]) {
  test.describe(device.name, () => {
    test.use({ viewport: device.viewport });
    test("create a sample person, select a tree root and change tree options", async ({ page }) => {
      // Every test receives a fresh isolated browser context and local database.
      await page.goto("/#/individuals");
      await page.getByRole("button", { name: "Lägg till person" }).click();
      await page.getByRole("textbox", { name: "Förnamn" }).fill("UXTest");
      await page.getByRole("textbox", { name: "Efternamn" }).fill("Person");
      await page.getByRole("button", { name: "Spara", exact: true }).click();
      await expect(page.getByRole("button", { name: "Visa detaljer för UXTest Person" })).toBeVisible();

      await page.goto("/#/tree");
      await expect(page.getByTestId("tree-empty-message")).toBeVisible();
      await page.getByTestId("person-search-input").fill("UXTest");
      const match = page.locator('[data-testid^="person-search-result-"]').filter({ hasText: "UXTest Person" });
      await expect(match).toBeVisible();
      await match.click();
      await expect(page.getByTestId("tree-empty-message")).toBeHidden();
      await expect(page.getByText("Rot: UXTest Person")).toBeVisible();

      await page.getByTestId("tree-type-orthogonal").click();
      await expect(page.getByTestId("tree-type-orthogonal")).toHaveAttribute("aria-pressed", "true");
      await page.getByTestId("tree-option-mode-descendants").click();
      await expect(page.getByTestId("tree-option-mode-descendants")).toHaveAttribute("aria-pressed", "true");
      await page.getByTestId("tree-option-maxGenerations").focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByText(/Antal generationer: [4-9]/)).toBeVisible();
      const size = await page.getByTestId("tree-canvas-container").boundingBox();
      expect(size).not.toBeNull();
      expect(size!.height).toBeGreaterThan(100);
      expect(size!.width).toBeGreaterThan(100);
    });
  });
}
