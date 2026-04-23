/**
 * Test suite for structureUtils functions.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import * as structureUtils from './structureUtils';

// Static mock for a valid Loci object
const lociObj = { kind: 'element-loci', structure: {}, elements: [] } as any;

describe('structureUtils', () => {
    let plugin: PluginUIContext;
    let structureRef: string;
    let chainId: string;
    let residueId: string;
    let insCode: string;

    beforeEach(() => {
        plugin = {
            managers: {
                structure: {
                    hierarchy: {
                        current: {
                            structures: [
                                {
                                    cell: {
                                        transform: { ref: 'test-ref' },
                                        obj: { data: {} }
                                    }
                                }
                            ]
                        }
                    }
                },
                camera: {
                    focusLoci: vi.fn()
                }
            }
        } as any;
        structureRef = 'test-ref';
        chainId = 'A';
        residueId = '1';
        insCode = '';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getChainLoci', () => {
        it('returns null if structure not found', () => {
            plugin.managers.structure.hierarchy.current.structures = [];
            expect(structureUtils.getChainLoci(plugin, structureRef, chainId)).toBeNull();
        });
        // Skipping positive test: would require full Mol* environment or ESM-compatible mocking
    });

    describe('getResidueLoci', () => {
        it('returns null if structure not found', () => {
            plugin.managers.structure.hierarchy.current.structures = [];
            expect(structureUtils.getResidueLoci(plugin, structureRef, chainId, residueId, insCode)).toBeNull();
        });
        // Skipping positive test: would require full Mol* environment or ESM-compatible mocking
    });

    describe('focusLociOnChain', () => {
        it('calls camera.focusLoci if loci is found', () => {
            structureUtils.focusLociOnChain(plugin, structureRef, chainId, undefined, () => lociObj);
            expect(plugin.managers.camera.focusLoci).toHaveBeenCalledWith(lociObj);
        });
        it('does not call camera.focusLoci if loci is null', () => {
            (plugin.managers.camera.focusLoci as ReturnType<typeof vi.fn>).mockClear();
            structureUtils.focusLociOnChain(plugin, structureRef, chainId, undefined, () => null);
            expect(plugin.managers.camera.focusLoci).not.toHaveBeenCalled();
        });
    });

    describe('focusLociOnResidue', () => {
        it('calls camera.focusLoci if loci is found', () => {
            structureUtils.focusLociOnResidue(plugin, structureRef, chainId, residueId, insCode, undefined, undefined, undefined, () => lociObj);
            expect(plugin.managers.camera.focusLoci).toHaveBeenCalled();
        });
        it('does not call camera.focusLoci if loci is null', () => {
            (plugin.managers.camera.focusLoci as ReturnType<typeof vi.fn>).mockClear();
            structureUtils.focusLociOnResidue(plugin, structureRef, chainId, residueId, insCode, undefined, undefined, undefined, () => null);
            expect(plugin.managers.camera.focusLoci).not.toHaveBeenCalled();
        });
    });
});
