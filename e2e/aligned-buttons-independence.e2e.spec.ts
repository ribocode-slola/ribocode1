/**
 * Playwright E2E test to ensure Aligned and AlignedTo buttons update independently.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT
 * @author Copilot
 * @version 1.0.0
 * @lastModified 2026-05-29
 */
import { test, expect } from '@playwright/test';
import path from 'path';

function dataPath(filename: string) {
  return path.resolve(__dirname, '../data/input', filename);
}

test('Aligned and AlignedTo buttons update independently', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Find and click the Load AlignedTo button, then upload file
  const alignedToBtn = page.getByRole('button', { name: /Load AlignedTo/i });
  await alignedToBtn.click();
  // The input is immediately after the button in the DOM
  const alignedToInput = alignedToBtn.locator('xpath=following-sibling::input[@type="file"]');
  await alignedToInput.setInputFiles(dataPath('4ug0.cif'));
  // Wait for the filename to appear, then check the button is removed from DOM
  await expect(page.getByText(/4ug0\.cif/)).toBeVisible();
  await expect(alignedToBtn).toHaveCount(0);

  // Find and click the Load Aligned button, then upload file
  const alignedBtn = page.getByRole('button', { name: /^Load Aligned$/i });
  await alignedBtn.click();
  const alignedInput = alignedBtn.locator('xpath=following-sibling::input[@type="file"]');
  await alignedInput.setInputFiles(dataPath('6xu8.cif'));
  await expect(page.getByText(/6xu8\.cif/)).toBeVisible();
  await expect(alignedBtn).toHaveCount(0);
  // Both file names should now be visible
  await expect(page.getByText(/4ug0\.cif/)).toBeVisible();
  await expect(page.getByText(/6xu8\.cif/)).toBeVisible();
});
