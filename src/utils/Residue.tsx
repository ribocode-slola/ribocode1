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
export interface ResidueLabelInfo {
    id: string; // residue id (auth_seq_id as string)
    name: string; // e.g., 'LEU 70'
    compId: string; // e.g., 'LEU'
    seqNumber: number; // e.g., 70
    insCode: string; // insertion code, if any
}

export function getResidueInfo(structure: Structure, chainId: string): {
    residueIds: string[],
    residueToAtomIds: Record<string, string[]>,
    residueLabels: ResidueLabelInfo[]
} {
    console.log('getResidueInfo called for chainId:', chainId);
    if (!structure.units) {
        console.warn('No units found in structure.');
        return { residueIds: [], residueToAtomIds: {}, residueLabels: [] };
    }
    console.log('Structure units:', structure.units);
    const model = structure.model;
    model._dynamicPropertyData;
    model._staticPropertyData;
    model.atomicChainOperatorMappinng;
    const ac = model.atomicConformation;
    ac.B_iso_or_equiv;
    ac.atomId;
    ac.id;
    ac.occupancy;
    ac.x;
    ac.xyzDefined;
    ac.y;
    ac.z;
    const ah = model.atomicHierarchy;
    ah.atomSourceIndex;
    const atoms = ah.atoms;
    atoms._columns;
    atoms._rowCount;
    atoms._schema;
    atoms.auth_atom_id;
    atoms.auth_comp_id;
    atoms.label_alt_id;
    atoms.label_atom_id;
    atoms.label_comp_id;
    atoms.pdbx_formal_charge;
    atoms.type_symbol;
    const cas = ah.chainAtomSegments;
    const chains = ah.chains;
    const derived = ah.derived;
    derived.atom;
    derived.residue;
    const index = ah.index;
    index.findAtom;
    index.findAtomAuth;
    index.findAtomOnResidue;
    index.findAtomsOnResidue;
    index.findChainAuth;
    index.findChainLabel;
    index.findElementOnResidue;
    index.findEntity;
    index.findResidue;
    index.findResidueAuth;
    index.findResidueInsertion;
    index.findResidueLabel;
    index.getEntityFromChain;
    const ras = ah.residueAtomSegments;
    ah.residueSourceIndex;
    const residues = ah.residues;
    residues._columns;
    residues._rowCount;
    residues._schema;
    residues.auth_seq_id;
    residues.group_PDB;
    residues.label_seq_id;
    residues.pdbx_PDB_ins_code;
    model.atomicRanges;
    model.coarseConformation;
    model.coarseHierarchy;
    model.customProperties;
    model.entities;
    model.entry;
    model.entryId;
    model.id;
    model.label;
    model.modelNum;
    model.parent;
    model.properties;
    model.sequence;
    model.sourceData;

    // Find the chain index for the requested chainId
    const authAsymIds = chains.auth_asym_id ? Array.from({length: chains._rowCount}, (_, i) => chains.auth_asym_id.value(i)) : [];
    const labelAsymIds = chains.label_asym_id ? Array.from({length: chains._rowCount}, (_, i) => chains.label_asym_id.value(i)) : [];
    console.info('[Residue] chainId argument:', chainId);
    console.info('[Residue] chains.auth_asym_id:', authAsymIds);
    console.info('[Residue] chains.label_asym_id:', labelAsymIds);

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
        console.warn('[Residue] No matching chain found for chainId:', chainId);
        return { residueIds: [], residueToAtomIds: {}, residueLabels: [] };
    }

    // Use cas.offsets to get residue indices for this chain
    const residueIds: string[] = [];
    const residueToAtomIds: Record<string, string[]> = {};
    const residueLabels: ResidueLabelInfo[] = [];
    const seenResidueIds = new Set<string>();
    let warningCount = 0;
    const MAX_WARNINGS = 10;
    const residueIndices: number[] = [];
    const start = cas.offsets[targetChainIdx];
    const end = cas.offsets[targetChainIdx + 1];
    for (let resIdx = start; resIdx < end; resIdx++) {
        residueIndices.push(resIdx);
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
        // Use ras.offsets to get atom indices for this residue
        let compIdValue = '';
        const atomStart = ras.offsets[resIdx];
        const atomEnd = ras.offsets[resIdx + 1];
        if (atomStart < atoms._rowCount) {
            compIdValue = atoms.auth_comp_id?.value(atomStart) ?? '';
        }
        const insCodeValue = residues.pdbx_PDB_ins_code?.value(resIdx) || '';
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
            // Add residue label info
            residueLabels.push({
                id: resId,
                name: `${compIdValue} ${resId}${insCodeValue ? ' ' + insCodeValue : ''}`,
                compId: compIdValue,
                seqNumber: Number(resId),
                insCode: insCodeValue
            });
        }
        // Use ras.offsets for this residue
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
    console.info(`residueToAtomIds:`, residueToAtomIds);
    console.info(`residueLabels`, residueLabels);
    return {
        residueIds: Array.from(residueIds).sort(),
        residueToAtomIds: residueToAtomIds,
        residueLabels: residueLabels
    };
}