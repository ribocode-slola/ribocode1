/**
 * Test suite for parseColorFileContent utility.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Copilot, Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-06-11
 * @see https://github.com/ribocode-slola/ribocode1
 */
import fs from 'fs';
import path from 'path';
import { parseColorFileContent } from './colors';

describe('parseColorFileContent real input file', () => {
  it('parses mapping_with_colour_animal.txt into chain/color rows', async () => {
    const filePath = path.resolve(__dirname, '../../data/input/mapping_with_colour_animal.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    const file = new File([content], 'mapping_with_colour_animal.txt', { type: 'text/plain' });

    const parsed = await parseColorFileContent(content, file);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toHaveProperty('pdb_chain');
    expect(parsed[0]).toHaveProperty('color');
  });
});
