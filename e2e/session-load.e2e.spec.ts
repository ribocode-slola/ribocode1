/**
 * Playwright E2E test for full session load workflow in Ribocode
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT
 * @author Copilot, Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import type { Page } from '@playwright/test';

// Helper to get absolute path to test data
function dataPath(filename: string) {
  return path.resolve(__dirname, '../data/input', filename);
}

async function loadSessionAndRequiredFiles(page: Page, sessionFixtureFile: string) {
  await page.click('button#session-menu-btn');
  await page.waitForSelector('#session-menu-dropdown', { state: 'visible' });
  await page.waitForTimeout(200);
  await page.click('#session-menu-dropdown .session-menu-item:has-text("Load")');

  const sessionFilePath = path.resolve(__dirname, sessionFixtureFile);
  await page.setInputFiles('#session-menu-file-input', sessionFilePath);

  await expect(page.getByText('Load Session: Select Required Files')).toBeVisible();
  await expect(page.getByText('4ug0.cif')).toBeVisible();
  await expect(page.getByText('6xu8.cif')).toBeVisible();

  const fileInputs = await page.$$('input[type="file"]');
  for (const input of fileInputs) {
    const label = await input.evaluate((el: HTMLInputElement) => el.parentElement?.textContent || '');
    if (label.includes('4ug0.cif')) {
      await input.setInputFiles(dataPath('4ug0.cif'));
    } else if (label.includes('6xu8.cif')) {
      await input.setInputFiles(dataPath('6xu8.cif'));
    }
  }

  await page.click('button:has-text("Load Session")');
}

test('Session load prompts for required files and loads data', async ({ page }) => {
  // 1. Go to the app
  await page.goto('http://localhost:5173/'); // Adjust if your dev server runs elsewhere

  await loadSessionAndRequiredFiles(page, 'test-session.json');

  // 7. Assert that the viewers are updated (e.g., check for molecule names or representations)
  await expect(page.locator('#viewer-column-A-molstar-container')).toBeVisible();
  await expect(page.locator('#viewer-column-B-molstar-container')).toBeVisible();
  await expect(page.locator('#viewer-column-A-alignedto-filename-label')).toHaveText(/4ug0\.cif/i);
  await expect(page.locator('#viewer-column-B-aligned-load-btn')).toHaveCount(0, { timeout: 10000 });

  // 8. Assert that the fallback error dialog does NOT appear
  await expect(page.locator('text=Session loaded, but could not automatically reload datasets')).toHaveCount(0);

});

test('Session load restores saved cartoon representations', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  await loadSessionAndRequiredFiles(page, 'test-session.json');
  await expect(page.locator('#viewer-column-B-aligned-load-btn')).toHaveCount(0, { timeout: 10000 });
  const baselineCartoonCount = await page.locator('button[aria-label="Toggle visibility for cartoon representation"]').count();

  await page.reload();
  await loadSessionAndRequiredFiles(page, 'test-session-with-representations.json');

  await expect(page.locator('#viewer-column-A-molstar-container')).toBeVisible();
  await expect(page.locator('#viewer-column-B-molstar-container')).toBeVisible();
  await expect(page.locator('#viewer-column-A-alignedto-filename-label')).toHaveText(/4ug0\.cif/i);
  await expect(page.locator('#viewer-column-B-aligned-load-btn')).toHaveCount(0, { timeout: 10000 });

  await expect(async () => {
    const restoredCartoonCount = await page.locator('button[aria-label="Toggle visibility for cartoon representation"]').count();
    expect(restoredCartoonCount).toBeGreaterThan(baselineCartoonCount);
  }).toPass({ timeout: 10000 });

  await expect(page.locator('text=Session loaded, but could not automatically reload datasets')).toHaveCount(0);
});
