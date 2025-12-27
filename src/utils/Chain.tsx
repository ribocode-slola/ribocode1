/**
 * Chain utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { Structure } from 'molstar/lib/mol-model/structure';

/**
 * Extracts unique chain IDs from a Mol* Structure object.
 * @param structure The Mol* Structure object.
 * @returns Array of unique chain IDs (strings).
 */
export function getChainIdsFromStructure(structure: Structure): string[] {
    console.log('getChainIdsFromStructure called');
    if (!structure.units) {
        console.warn('No units found in structure.');
        return [];
    }
    console.log('Structure units:', structure.units);
    const chainIds = new Set<string>();
    structure.units.forEach(unit => {
        const chains = unit.model.atomicHierarchy.chains;
        const { auth_asym_id } = chains;
        for (let i = 0; i < chains._rowCount; i++) {
            chainIds.add(auth_asym_id.value(i));
        }
    });
    console.log('Extracted chain IDs:', Array.from(chainIds));
    return Array.from(chainIds).sort();
}
