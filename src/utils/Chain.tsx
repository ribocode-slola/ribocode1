/**
 * Chain utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { Structure } from 'molstar/lib/mol-model/structure';

/**
 * Extracts chain IDs and labels from a Mol* Structure object.
 * @param structure The Mol* Structure object.
 * @returns An object containing a Map of chain IDs to their labels.
 */
export function getChainInfo(structure: Structure):
 { chainLabels: Map<string, string> } {
    const chainLabels: Map<string, string> = new Map();
    const units = structure.units;
    if (!units || units.length === 0) {
        console.warn('No units found in structure.');
        return { chainLabels };
    }
    //console.log('Structure units:', structure.units);
    units.forEach(unit => {
        const chains = unit.model.atomicHierarchy.chains;
        const { auth_asym_id, label_asym_id } = chains;
        for (let i = 0; i < chains._rowCount; i++) {
            const authId = auth_asym_id.value(i);
            const labelId = label_asym_id?.value ? label_asym_id.value(i) : '';
            const label = labelId ? `${labelId} [auth ${authId}]` : `[auth ${authId}]`;
            chainLabels.set(authId, label);
        }
    });
    console.log('chainLabels', chainLabels);
    return { chainLabels };
}