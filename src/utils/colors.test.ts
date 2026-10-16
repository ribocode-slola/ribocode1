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
import { Color } from 'molstar/lib/mol-util/color';
import { createChainColorTheme, getColourTheme } from './colors';

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

describe('createChainColorTheme', () => {
    function makeLocation(authAsymId: string, labelAsymId: string, element = 0): any {
        return {
            unit: {
                kind: 0,
                model: {
                    atomicHierarchy: {
                        chainAtomSegments: { index: [0] },
                        chains: {
                            auth_asym_id: { value: (_idx: number) => authAsymId },
                            label_asym_id: { value: (_idx: number) => labelAsymId },
                        },
                    },
                },
            },
            element,
        };
    }

    it('prefers auth_asym_id when matching chain colors', () => {
        const themeName = 'auth-first-theme';
        const chainColorMap = new Map<string, Color>([['LY', Color.fromHexStyle('#3366FF')]]);
        const theme = createChainColorTheme(themeName, chainColorMap);
        const colorFn = theme.factory({} as any, {}).color;

        const location = makeLocation('LY', 'A');
        const color = colorFn(location);

        expect(color).toBe(Color.fromHexStyle('#3366FF'));
    });

    it('matches normalized chain IDs (trimmed and case-insensitive)', () => {
        const themeName = 'normalized-ids-theme';
        const chainColorMap = new Map<string, Color>([[' ly ', Color.fromHexStyle('#FF8800')]]);
        const theme = createChainColorTheme(themeName, chainColorMap);
        const colorFn = theme.factory({} as any, {}).color;

        const location = makeLocation('LY', 'A');
        const color = colorFn(location);

        expect(color).toBe(Color.fromHexStyle('#FF8800'));
    });
});
