/**
 * Test suite for getColourTheme utility.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { getColourTheme } from './colors';

describe('getColourTheme', () => {
    let originalWarn: any;
    beforeAll(() => {
        originalWarn = console.warn;
        console.warn = vi.fn();
    });
    afterAll(() => {
        console.warn = originalWarn;
    });

    it('returns a color theme with valid colors', () => {
        const theme = getColourTheme('test-theme', [
            { pdb_chain: 'A', color: '#FF0000' },
            { pdb_chain: 'B', color: '#00FF00' }
        ]);
        expect(theme).toBeDefined();
        expect(theme.name).toBe('test-theme');
        expect(theme.params).toBeDefined();
        expect(theme.params.palette).toBeDefined();
        expect(Array.isArray(theme.params.palette.params.colors)).toBe(true);
        expect(theme.params.palette.params.colors.length).toBe(2);
    });

    it('warns and skips invalid colors', () => {
        getColourTheme('invalid-theme', [
            { pdb_chain: 'A', color: 'not-a-color' },
            { pdb_chain: 'B', color: '#00FF00' }
        ]);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid color for asym_id A'));
    });

    it('returns cached theme if called with same name', () => {
        const theme1 = getColourTheme('cached-theme', [
            { pdb_chain: 'A', color: '#FF0000' }
        ]);
        const theme2 = getColourTheme('cached-theme', [
            { pdb_chain: 'A', color: '#00FF00' }
        ]);
        expect(theme1).toBe(theme2);
    });
});
