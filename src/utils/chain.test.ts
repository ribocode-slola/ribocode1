/**
 * Test suite for getChainInfo utility.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { getChainInfo } from './chain';

describe('getChainInfo', () => {
    let originalWarn: any;
    let originalLog: any;
    beforeAll(() => {
        originalWarn = console.warn;
        originalLog = console.log;
        console.warn = vi.fn();
        console.log = vi.fn();
    });
    afterAll(() => {
        console.warn = originalWarn;
        console.log = originalLog;
    });
    it('returns empty map if structure has no units', () => {
        const structure = { units: [] } as any;
        const result = getChainInfo(structure);
        expect(result.chainLabels.size).toBe(0);
    });

    it('extracts chain IDs and labels from structure units', () => {
        const mockChains = {
            _rowCount: 2,
            auth_asym_id: { value: (i: number) => (i === 0 ? 'A' : 'B') },
            label_asym_id: { value: (i: number) => (i === 0 ? 'X' : 'Y') },
        };
        const structure = {
            units: [
                { model: { atomicHierarchy: { chains: mockChains } } }
            ]
        } as any;
        const result = getChainInfo(structure);
        expect(result.chainLabels.get('A')).toBe('X [auth A]');
        expect(result.chainLabels.get('B')).toBe('Y [auth B]');
    });

    it('handles missing label_asym_id gracefully', () => {
        const mockChains = {
            _rowCount: 1,
            auth_asym_id: { value: () => 'C' },
            label_asym_id: undefined,
        };
        const structure = {
            units: [
                { model: { atomicHierarchy: { chains: mockChains } } }
            ]
        } as any;
        const result = getChainInfo(structure);
        expect(result.chainLabels.get('C')).toBe('[auth C]');
    });
});
