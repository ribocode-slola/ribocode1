/**
 * Playwright E2E test for full session load workflow in Ribocode
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { test, expect } from '@playwright/test';
import path from 'path';

// Helper to get absolute path to test data
function dataPath(filename: string) {
  return path.resolve(__dirname, '../data/input', filename);
}

test('Session load prompts for required files and loads data', async ({ page }) => {
  // 1. Go to the app
  await page.goto('http://localhost:5173/'); // Adjust if your dev server runs elsewhere

  // 2. Open Session menu and click Load
  await page.click('button:has-text("Session")');
  await page.click('text=Load');

  // 3. Upload a session file with required filenames
  // Prepare a session JSON file dynamically
  const sessionJson = {
    viewerA: { alignedTo: { filename: '4ug0.cif' } },
    viewerB: { aligned: { filename: '6xu8.cif' } }
  };
  const sessionFilePath = path.resolve(__dirname, 'test-session.json');
  const fs = require('fs');
  fs.writeFileSync(sessionFilePath, JSON.stringify(sessionJson, null, 2));

  // Set the session file in the hidden file input
  await page.setInputFiles('#session-menu-file-input', sessionFilePath);

  // 4. Wait for the "Load Session: Select Required Files" dialog
  await expect(page.getByText('Load Session: Select Required Files')).toBeVisible();
  await expect(page.getByText('4ug0.cif')).toBeVisible();
  await expect(page.getByText('6xu8.cif')).toBeVisible();

  // 5. Upload the required files in the modal
  // Find all file inputs in the modal (should be two)
  const fileInputs = await page.$$('input[type="file"]');
  // Upload the correct files by filename
  for (const input of fileInputs) {
    const label = await input.evaluate(el => el.parentElement?.textContent || '');
    if (label.includes('4ug0.cif')) {
      await input.setInputFiles(dataPath('4ug0.cif'));
    } else if (label.includes('6xu8.cif')) {
      await input.setInputFiles(dataPath('6xu8.cif'));
    }
  }

  // 6. Click the Load Session button in the modal
  await page.click('button:has-text("Load Session")');

  // 7. Assert that the viewers are updated (e.g., check for molecule names or representations)
  // Adjust selectors as needed for your UI
  await expect(page.locator('#viewer-column-A-molstar-container')).toBeVisible();
  await expect(page.locator('#viewer-column-B-molstar-container')).toBeVisible();
  // Optionally, check for molecule names or representations in the UI
  // await expect(page.getByText('4ug0')).toBeVisible();
  // await expect(page.getByText('6xu8')).toBeVisible();

  // 8. Assert that the fallback error dialog does NOT appear
  await expect(page.locator('text=Session loaded, but could not automatically reload datasets')).toHaveCount(0);

  // Cleanup: remove the temporary session file
  fs.unlinkSync(sessionFilePath);
});
