/**
 * Residue utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { Structure } from 'molstar/lib/mol-model/structure';

/**
 * Extracts unique Residue IDs from a Mol* Structure object.
 * @param structure The Mol* Structure object.
 * @returns Array of unique Residue IDs (strings).
 */
export function getResidueIdsFromStructure(structure: Structure): string[] {
    console.log('getResidueIdsFromStructure called');
    if (!structure.units) {
        console.warn('No units found in structure.');
        return [];
    }
    console.log('Structure units:', structure.units);
    const residueIds = new Set<string>();
    structure.units.forEach(unit => {
        const residues = unit.model.atomicHierarchy.residues;
        const { auth_seq_id } = residues;
        for (let i = 0; i < residues._rowCount; i++) {
            residueIds.add(auth_seq_id.value(i).toString());
        }
    });
    console.log('Extracted Residue IDs:', Array.from(residueIds));
    return Array.from(residueIds).sort();
        
}