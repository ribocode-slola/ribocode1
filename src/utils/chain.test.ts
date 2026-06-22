/**
 * Test suite for getChainInfo utility.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.1
 * @lastModified 2026-06-22
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

    it('deduplicates chains with the same auth_asym_id across units', () => {
        const mockChains = {
            _rowCount: 1,
            auth_asym_id: { value: () => 'A' },
            label_asym_id: { value: () => 'AA' },
        };
        const structure = {
            units: [
                { model: { atomicHierarchy: { chains: mockChains } } },
                { model: { atomicHierarchy: { chains: mockChains } } }
            ]
        } as any;
        const result = getChainInfo(structure);
        expect(result.chainLabels.size).toBe(1);
        expect(result.chainLabels.get('A')).toBe('AA [auth A]');
    });
});

describe('getChainInfo with rpNameLookup enrichment', () => {
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

    function makeStructure(opts: {
        authId: string;
        labelId?: string;
        entityId?: string;
        structRef?: { entityId: string; accession: string }[];
    }) {
        const mockChains: any = {
            _rowCount: 1,
            auth_asym_id: { value: () => opts.authId },
            label_asym_id: opts.labelId ? { value: () => opts.labelId } : undefined,
        };
        if (opts.entityId !== undefined) {
            mockChains.label_entity_id = { value: () => opts.entityId };
        }
        const structRefRows = opts.structRef || [];
        const model: any = {
            atomicHierarchy: { chains: mockChains },
            sourceData: opts.structRef
                ? {
                    data: {
                        db: {
                            struct_ref: {
                                _rowCount: structRefRows.length,
                                entity_id: { value: (i: number) => structRefRows[i]?.entityId },
                                pdbx_db_accession: { value: (i: number) => structRefRows[i]?.accession }
                            }
                        }
                    }
                }
                : undefined
        };
        return { units: [{ model }] } as any;
    }

    it('uses gene family name when UniProt resolves via struct_ref', () => {
        const rpNameLookup = new Map([['P61247', 'eS1']]);
        const structure = makeStructure({
            authId: 'A',
            labelId: 'AA',
            entityId: '1',
            structRef: [{ entityId: '1', accession: 'P61247' }]
        });
        const result = getChainInfo(structure, rpNameLookup);
        expect(result.chainLabels.get('A')).toBe('eS1 [AA]');
    });

    it('falls back to default label when UniProt is not in rpNameLookup', () => {
        const rpNameLookup = new Map([['P99999', 'someFamily']]); // P61247 not present
        const structure = makeStructure({
            authId: 'A',
            labelId: 'AA',
            entityId: '1',
            structRef: [{ entityId: '1', accession: 'P61247' }]
        });
        const result = getChainInfo(structure, rpNameLookup);
        expect(result.chainLabels.get('A')).toBe('AA [auth A]');
    });

    it('falls back to default label when struct_ref is absent', () => {
        const rpNameLookup = new Map([['P61247', 'eS1']]);
        const structure = makeStructure({ authId: 'B', labelId: 'BB' }); // no entityId, no structRef
        const result = getChainInfo(structure, rpNameLookup);
        expect(result.chainLabels.get('B')).toBe('BB [auth B]');
    });

    it('falls back to authId in brackets when labelId is missing and no family found', () => {
        const rpNameLookup = new Map<string, string>();
        const structure = makeStructure({ authId: 'C' }); // no labelId, no structRef
        const result = getChainInfo(structure, rpNameLookup);
        expect(result.chainLabels.get('C')).toBe('[auth C]');
    });

    it('uses authId in family label when labelId is absent', () => {
        const rpNameLookup = new Map([['P61247', 'eS1']]);
        const structure = makeStructure({
            authId: 'A',
            // no labelId
            entityId: '1',
            structRef: [{ entityId: '1', accession: 'P61247' }]
        });
        const result = getChainInfo(structure, rpNameLookup);
        expect(result.chainLabels.get('A')).toBe('eS1 [A]');
    });
});
