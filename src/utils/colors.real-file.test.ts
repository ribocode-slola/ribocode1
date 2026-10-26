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
import { inferColorThemeKind, parseColorFileContent } from './colors';

describe('parseColorFileContent real input file', () => {
  it('parses simple_chain_colours.csv into chain/color rows', async () => {
    const filePath = path.resolve(__dirname, '../../data/input/simple_chain_colours.csv');
    const content = fs.readFileSync(filePath, 'utf8');
    const file = new File([content], 'simple_chain_colours.csv', { type: 'text/csv' });

    const parsed = await parseColorFileContent(content, file);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toHaveProperty('pdb_chain');
    expect(parsed[0]).toHaveProperty('color');
    expect(inferColorThemeKind(parsed)).toBe('chain');
  });

  it('parses simple_residue_type_colours.csv into residue_type/color rows', async () => {
    const filePath = path.resolve(__dirname, '../../data/input/simple_residue_type_colours.csv');
    const content = fs.readFileSync(filePath, 'utf8');
    const file = new File([content], 'simple_residue_type_colours.csv', { type: 'text/csv' });

    const parsed = await parseColorFileContent(content, file);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toHaveProperty('residue_type');
    expect(parsed[0]).toHaveProperty('color');
    expect(inferColorThemeKind(parsed)).toBe('residue-type');
  });
});
