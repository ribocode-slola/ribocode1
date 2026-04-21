/**
 * Test suite for getSubunitToChainIds utility.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { vi } from 'vitest';
import { getSubunitToChainIds, RibosomeSubunitType } from './subunit';

describe('getSubunitToChainIds', () => {
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

    it('returns empty sets and warns if no units', () => {
        const structure = { units: [] };
        const result = getSubunitToChainIds(structure as any);
        for (const type of ['All', 'Large', 'Small', 'Other'] as RibosomeSubunitType[]) {
            expect(result.subunitToChainIds.get(type)).toBeDefined();
            expect(result.subunitToChainIds.get(type)?.size).toBe(0);
        }
        expect(console.warn).toHaveBeenCalledWith('No units found in structure.');
    });

    it('classifies chain IDs into subunits', () => {
        const structure = {
            units: [
                {
                    model: {
                        atomicHierarchy: {
                            chains: {
                                auth_asym_id: { value: (i: number) => ['LA', 'SB', 'CX', 'QZ'][i] },
                                _rowCount: 4
                            }
                        }
                    }
                }
            ]
        };
        const result = getSubunitToChainIds(structure as any);
        expect(result.subunitToChainIds.get('Large')).toEqual(new Set(['LA']));
        expect(result.subunitToChainIds.get('Small')).toEqual(new Set(['SB', 'CX']));
        expect(result.subunitToChainIds.get('Other')).toEqual(new Set(['QZ']));
        expect(console.log).toHaveBeenCalledWith('[Subunit Debug] Final subunitToChainIds:', expect.any(Map));
    });
});
