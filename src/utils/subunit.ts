/**
 * Subunit utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
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
    // Define chain ID patterns for ribosome subunits (case-insensitive, starts with letter)
    const largeSubunitPatterns = [/^L.*/i, /^A.*/i];
    const smallSubunitPatterns = [/^S.*/i, /^C.*/i];
    // Iterate over units to classify chain IDs
    units.forEach(unit => {
        const chains = unit.model.atomicHierarchy.chains;
        const { auth_asym_id } = chains;
        for (let i = 0; i < chains._rowCount; i++) {
            const authId = auth_asym_id.value(i);
            let classified = false;
            // Debug: print chain ID before classification
            //console.log(`[Subunit Debug] Processing chain ID: '${authId}'`);
            // Check against large subunit patterns
            for (const pattern of largeSubunitPatterns) {
                if (pattern.test(authId)) {
                    result.subunitToChainIds.get('Large')!.add(authId);
                    classified = true;
                    //console.log(`[Subunit Debug]  → Classified as 'Large' (matched pattern: ${pattern})`);
                    break;
                }
            }
            if (classified) continue;
            // Check against small subunit patterns
            for (const pattern of smallSubunitPatterns) {
                if (pattern.test(authId)) {
                    result.subunitToChainIds.get('Small')!.add(authId);
                    classified = true;
                    //console.log(`[Subunit Debug]  → Classified as 'Small' (matched pattern: ${pattern})`);
                    break;
                }
            }
            if (classified) continue;
            // If not classified, assign to 'Other'
            result.subunitToChainIds.get('Other')!.add(authId);
            //console.log(`[Subunit Debug]  → Classified as 'Other'`);
        }
    });
    // Print the final mapping
    console.log('[Subunit Debug] Final subunitToChainIds:', result.subunitToChainIds);
    return result;
}