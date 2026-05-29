/**
 * Playwright E2E test: Save/Load session with real datasets
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const inputDir = path.resolve(__dirname, '../data/input');
const alignedToFile = path.join(inputDir, '4ug0.cif');
const alignedFile = path.join(inputDir, '6xu8.cif');

test.describe('Session Save/Load E2E', () => {
  test('can load, save, and reload session with real data', async ({ page, context }) => {
    // Go to app
    await page.goto('http://localhost:5173/'); // Adjust port as needed

    // Use robust IDs and clarify expected display names (uppercase for molecule names)
    // Example selectors and assertions for E2E test
    // Update selectors to use data-testid or id attributes that are unique and consistent

    // Example: Set file inputs using robust IDs
    await page.setInputFiles('#viewer-column-A-load-btn + input[type="file"]', alignedToFile);
    await page.setInputFiles('#viewer-column-B-load-btn + input[type="file"]', alignedFile);

    // Open Session menu
    await page.click('#session-menu-btn');
    // Save session
    await page.click('#session-menu-dropdown .session-menu-item:has-text("Save")');
    // (Optionally check for download, or stub download behavior)

    // Open Session menu again
    await page.click('#session-menu-btn');
    // Load session
    await page.click('#session-menu-dropdown .session-menu-item:has-text("Load")');
    // Interact with modal: upload required files using robust IDs
    await page.setInputFiles('#session-modal-alignedto-input', alignedToFile);
    await page.setInputFiles('#session-modal-aligned-input', alignedFile);
    // Click Load Session in modal
    await page.click('#session-modal-load-btn');

    // Assert that the molecule names (not filenames) are displayed in uppercase
    await expect(page.getByText('4UG0')).toBeVisible();
    await expect(page.getByText('6XU8')).toBeVisible();

    // Add comments to clarify that these are display names, not filenames
    // If the UI is meant to show filenames, adjust the assertion accordingly
  });
});
