
/**
 * Residue utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { Structure } from 'molstar/lib/mol-model/structure';

/**
 * Returns all unique residue IDs (auth_seq_id) for a given chain in a Mol* Structure.
 * Handles missing properties gracefully and provides debug output.
 * @param structure The Mol* Structure object.
 * @param chainId The chain ID to filter residues by (auth_asym_id or label_asym_id).
 * @returns Array of unique residue IDs (strings) for the chain.
 */
export function getResidueIdsForChain(structure: Structure, chainId: string): string[] {
    if (!structure.units) {
        console.warn('No units found in structure.');
        return [];
    }
    const residueIds = new Set<string>();
     // Go through all the atoms in all the units
    for (const unit of structure.units) {
        const chains = unit.model.atomicHierarchy.chains;
        const residues = unit.model.atomicHierarchy.residues;
        const auth_asym_id = chains.auth_asym_id;
        const label_asym_id = chains.label_asym_id;
        const auth_seq_id = residues.auth_seq_id;
        const label_seq_id = residues.label_seq_id;
        if (!auth_asym_id || !auth_seq_id) {
            console.warn('Missing auth_asym_id or auth_seq_id in structure.');
            continue;
        }
        for (let i = 0; i < chains._rowCount; i++) {
            const asymId = auth_asym_id.value(i);
            const labelAsymId = label_asym_id ? label_asym_id.value(i) : null;
            if (asymId === chainId || (labelAsymId && labelAsymId === chainId)) {
                const resId = auth_seq_id.value(i).toString();
                residueIds.add(resId);
                // Try also label_seq_id if available
                if (label_seq_id) {
                    const labelResId = label_seq_id.value(i).toString();
                    residueIds.add(labelResId);
                }
            }
        }
    }
    // // Debug output to trace processing
    // let index = 0;
    // let nunits = structure.units.length;
    // let np = Math.max(1, Math.floor(nunits / 10));
    // console.log(`getResidueIdsForChain called for chainId '${chainId}' with ${nunits} units.`);
    // index = 0;
    // structure.units.forEach((unit, unitIdx) => {
    //     //if (index % np === 0) {
    //     console.log(`Processing unit ${unitIdx}:`, unit);
    //     let elements = unit.chainGroupId;
    //     //}
    //     index++;
    // });
    return Array.from(residueIds).sort();
}