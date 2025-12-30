/**
 * Residue utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { Structure } from 'molstar/lib/mol-model/structure';

/**
 * Get residue IDs and a lookup of residue IDs to atom IDs for a given chain in a model.
 * @param structure The Molstar structure.
 * @param chainId The chain ID to get residue IDs for.
 * @returns An object containing an array of residue IDs and a mapping from residue IDs to arrays of atom IDs.
 */
export function getResidueIdsAndAtomLookup(structure: Structure, chainId: string): {
    residueIds: string[],
    residueToAtomIds: Record<string, string[]>
} {
    const model = structure.model;
    const ah = model.atomicHierarchy;
    const atoms = ah.atoms;
    const cas = ah.chainAtomSegments;
    const chains = ah.chains;
    const ras = ah.residueAtomSegments;
    const residues = ah.residues;

    // Find the chain index for the requested chainId
    const chainIdCol = chains.auth_asym_id ?? chains.label_asym_id;
    if (!chainIdCol) throw new Error('No chain ID column found in chains');
    let targetChainIdx = -1;
    for (let i = 0; i < chains._rowCount; i++) {
        if (chainIdCol.value(i) === chainId) {
            targetChainIdx = i;
            break;
        }
    }
    if (targetChainIdx === -1) {
        return { residueIds: [], residueToAtomIds: {} };
    }
    // Only log if chain not found

    const residueIds: string[] = [];
    const residueToAtomIds: Record<string, string[]> = {};
    const seenResidueIds = new Set<string>();
    let warningCount = 0;
    const MAX_WARNINGS = 10;
    // Aggregate all residue indices from all chain segments matching the requested chain ID
    const residueIndices: number[] = [];
    for (let i = 0; i < chains._rowCount; i++) {
        if (chainIdCol.value(i) === chainId) {
            const start = cas.offsets[i];
            const end = cas.offsets[i + 1];
            residueIndices.push(...Array.from({ length: end - start }, (_, k) => start + k));
        }
    }
    if (residueIndices.length === 0) {
        console.warn(`[Residue] No residues found for chainId: ${chainId}`);
    }

    // Minimal diagnostics: only log if indices are out of bounds or fallback is possible
    const hasLabelSeqId = typeof residues.label_seq_id !== 'undefined';
    if (residueIndices.length > 0) {
        const minIdx = Math.min(...residueIndices);
        const maxIdx = Math.max(...residueIndices);
        if (minIdx < 0 || maxIdx >= residues._rowCount) {
            console.warn(`[Residue][Diag] residueIndices out of bounds: min=${minIdx}, max=${maxIdx}, residues._rowCount=${residues._rowCount}`);
        }
    }
    if (hasLabelSeqId) {
        console.info(`[Residue][Diag] residues.label_seq_id present, will log fallback usage if needed.`);
    }

    for (const resIdx of residueIndices) {
        // Only log if out of bounds or fallback is used
        if (resIdx < 0 || resIdx >= residues._rowCount) {
            if (warningCount < MAX_WARNINGS) {
                console.warn(`[Residue][Diag] resIdx ${resIdx} out of bounds (0, ${residues._rowCount - 1})`);
                warningCount++;
                if (warningCount === MAX_WARNINGS) {
                    console.warn('Further residue index warnings suppressed.');
                }
            }
            continue;
        }
        const resIdValue = residues.auth_seq_id.value(resIdx);
        if (resIdValue === undefined) {
            if (hasLabelSeqId) {
                const labelSeqIdValue = residues.label_seq_id.value(resIdx);
                if (warningCount < MAX_WARNINGS) {
                    console.warn(`[Residue][Diag] auth_seq_id undefined for resIdx ${resIdx}, label_seq_id:`, labelSeqIdValue);
                    warningCount++;
                    if (warningCount === MAX_WARNINGS) {
                        console.warn('Further auth_seq_id warnings suppressed.');
                    }
                }
            } else if (warningCount < MAX_WARNINGS) {
                console.warn('auth_seq_id is undefined for residue index', resIdx);
                warningCount++;
                if (warningCount === MAX_WARNINGS) {
                    console.warn('Further auth_seq_id warnings suppressed.');
                }
            }
            continue;
        }
        const resId = resIdValue.toString();
        if (!seenResidueIds.has(resId)) {
            residueIds.push(resId);
            seenResidueIds.add(resId);
            residueToAtomIds[resId] = [];
        }
        // Get atom indices for this residue
        const atomStart = ras.offsets[resIdx];
        const atomEnd = ras.offsets[resIdx + 1];
        for (let atomIdx = atomStart; atomIdx < atomEnd; atomIdx++) {
            const atomId = atoms.label_atom_id?.value(atomIdx) ?? atoms.auth_atom_id?.value(atomIdx) ?? atomIdx.toString();
            if (residueToAtomIds[resId]) {
                residueToAtomIds[resId].push(atomId);
            }
        }
        // No per-residue logging
    }

    // Concise summary
    console.info(`[Residue] chainId ${chainId}: ${residueIds.length} valid residue IDs returned.`);

    return {
        residueIds: Array.from(residueIds).sort(),
        residueToAtomIds
    };
}