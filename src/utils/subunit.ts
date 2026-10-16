/**
 * Subunit utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { Structure } from 'molstar/lib/mol-model/structure';

/**
 * Types of ribosome subunits.
 */
export type RibosomeSubunitType = 'All' | 'Large' | 'Small' | 'Other';
export const RibosomeSubunitTypes: RibosomeSubunitType[] = ['All', 'Large', 'Small', 'Other'];

/**
 * Infers ribosome subunit chain IDs from a Mol* Structure object.
 * @param structure The Mol* Structure object.
 * @returns An object mapping subunit types to their associated chain IDs.
 */
export function getSubunitToChainIds(structure: Structure):
 { subunitToChainIds: Map<RibosomeSubunitType, Set<string>> } {
    // Initialize result
    const result: { subunitToChainIds: Map<RibosomeSubunitType, Set<string>> } = {
        subunitToChainIds: new Map([
            ['All', new Set<string>()],
            ['Large', new Set<string>()],
            ['Small', new Set<string>()],
            ['Other', new Set<string>()],
        ])
    };
    const units = structure.units;
    if (!units || units.length === 0) {
        console.warn('No units found in structure.');
        return result;
    }
    // Explicit L/S-prefixed chain IDs are treated as authoritative when present.
    const explicitLargePattern = /^L.*/i;
    const explicitSmallPattern = /^S.*/i;
    // Legacy fallback for structures that use A/C naming instead of L/S.
    const fallbackLargePattern = /^A.*/i;
    const fallbackSmallPattern = /^C.*/i;

    const chainIds = new Set<string>();

    // Collect unique auth chain IDs first so classification can choose the right strategy.
    units.forEach(unit => {
        const chains = unit.model.atomicHierarchy.chains;
        const { auth_asym_id } = chains;
        for (let i = 0; i < chains._rowCount; i++) {
            chainIds.add(auth_asym_id.value(i));
        }
    });

    const hasExplicitLarge = Array.from(chainIds).some(chainId => explicitLargePattern.test(chainId));
    const hasExplicitSmall = Array.from(chainIds).some(chainId => explicitSmallPattern.test(chainId));
    const useExplicitStrategy = hasExplicitLarge || hasExplicitSmall;

    for (const chainId of chainIds) {
        if (explicitLargePattern.test(chainId)) {
            result.subunitToChainIds.get('Large')!.add(chainId);
            continue;
        }
        if (explicitSmallPattern.test(chainId)) {
            result.subunitToChainIds.get('Small')!.add(chainId);
            continue;
        }

        if (!useExplicitStrategy) {
            if (fallbackLargePattern.test(chainId)) {
                result.subunitToChainIds.get('Large')!.add(chainId);
                continue;
            }
            if (fallbackSmallPattern.test(chainId)) {
                result.subunitToChainIds.get('Small')!.add(chainId);
                continue;
            }
        }

        result.subunitToChainIds.get('Other')!.add(chainId);
    }

    // Print the final mapping
    console.log('[Subunit Debug] Final subunitToChainIds:', result.subunitToChainIds);
    return result;
}