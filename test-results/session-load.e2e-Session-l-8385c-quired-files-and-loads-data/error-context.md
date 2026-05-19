# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-load.e2e.spec.ts >> Session load prompts for required files and loads data
- Location: e2e/session-load.e2e.spec.ts:18:5

# Error details

```
Error: page.goto: Target page, context or browser has been closed
```

# Test source

```ts
  1  | /**
  2  |  * Playwright E2E test for full session load workflow in Ribocode
  3  |  * 
  4  |  * Copyright (c) 2024-now Ribocode contributors, licensed under MIT
  5  |  * @author Andy Turner <agdturner@gmail.com>
  6  |  * @version 1.0.0
  7  |  * @lastModified 2026-04-24
  8  |  * @see https://github.com/ribocode-slola/ribocode1
  9  |  */
  10 | import { test, expect } from '@playwright/test';
  11 | import path from 'path';
  12 | 
  13 | // Helper to get absolute path to test data
  14 | function dataPath(filename: string) {
  15 |   return path.resolve(__dirname, '../data/input', filename);
  16 | }
  17 | 
  18 | test('Session load prompts for required files and loads data', async ({ page }) => {
  19 |   // 1. Go to the app
> 20 |   await page.goto('http://localhost:5173/'); // Adjust if your dev server runs elsewhere
     |              ^ Error: page.goto: Target page, context or browser has been closed
  21 | 
  22 |   // 2. Open Session menu and click Load (wait for dropdown)
  23 |   await page.click('button#session-menu-btn');
  24 |   // Wait for the dropdown to be visible and stable
  25 |   await page.waitForSelector('#session-menu-dropdown', { state: 'visible' });
  26 |   // Add a short wait to ensure menu is stable (fixes flakiness due to blur/timeout)
  27 |   await page.waitForTimeout(200);
  28 |   // Click the Load menu item specifically in the dropdown
  29 |   await page.click('#session-menu-dropdown .session-menu-item:has-text("Load")');
  30 | 
  31 |   // 3. Upload a session file with required filenames
  32 |   // Prepare a session JSON file dynamically
  33 |   const sessionJson = {
  34 |     viewerA: { alignedTo: { filename: '4ug0.cif' } },
  35 |     viewerB: { aligned: { filename: '6xu8.cif' } }
  36 |   };
  37 |   const sessionFilePath = path.resolve(__dirname, 'test-session.json');
  38 |   const fs = require('fs');
  39 |   fs.writeFileSync(sessionFilePath, JSON.stringify(sessionJson, null, 2));
  40 | 
  41 |   // Set the session file in the hidden file input
  42 |   await page.setInputFiles('#session-menu-file-input', sessionFilePath);
  43 | 
  44 |   // 4. Wait for the "Load Session: Select Required Files" dialog
  45 |   await expect(page.getByText('Load Session: Select Required Files')).toBeVisible();
  46 |   await expect(page.getByText('4ug0.cif')).toBeVisible();
  47 |   await expect(page.getByText('6xu8.cif')).toBeVisible();
  48 | 
  49 |   // 5. Upload the required files in the modal
  50 |   // Find all file inputs in the modal (should be two)
  51 |   const fileInputs = await page.$$('input[type="file"]');
  52 |   // Upload the correct files by filename
  53 |   for (const input of fileInputs) {
  54 |     const label = await input.evaluate(el => el.parentElement?.textContent || '');
  55 |     if (label.includes('4ug0.cif')) {
  56 |       await input.setInputFiles(dataPath('4ug0.cif'));
  57 |     } else if (label.includes('6xu8.cif')) {
  58 |       await input.setInputFiles(dataPath('6xu8.cif'));
  59 |     }
  60 |   }
  61 | 
  62 |   // 6. Click the Load Session button in the modal
  63 |   await page.click('button:has-text("Load Session")');
  64 | 
  65 |   // 7. Assert that the viewers are updated (e.g., check for molecule names or representations)
  66 |   await expect(page.locator('#viewer-column-A-molstar-container')).toBeVisible();
  67 |   await expect(page.locator('#viewer-column-B-molstar-container')).toBeVisible();
  68 |   // Check for molecule names or representations in the UI (upper case)
  69 |   await expect(page.getByText('4UG0')).toBeVisible();
  70 |   await expect(page.getByText('6XU8')).toBeVisible();
  71 | 
  72 |   // 8. Assert that the fallback error dialog does NOT appear
  73 |   await expect(page.locator('text=Session loaded, but could not automatically reload datasets')).toHaveCount(0);
  74 | 
  75 |   // Cleanup: remove the temporary session file
  76 |   fs.unlinkSync(sessionFilePath);
  77 | });
  78 | 
```