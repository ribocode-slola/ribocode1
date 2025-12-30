/**
 * Chain utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { Structure } from 'molstar/lib/mol-model/structure';
import { RibosomeSubunitType } from '../components/select/SubunitSelectButton';

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

/**
 * Attempts to infer the chain IDs for the Large and Small ribosomal subunits from structure metadata.
 * Scans entity or chain names/descriptions for subunit-related keywords.
 * @param structure The Mol* Structure object.
 * @returns An object: { Large: string[], Small: string[] }
 */
export function inferRibosomeSubunitChainIds(structure: Structure): { [key in RibosomeSubunitType]: string[] } {
    const result: Record<RibosomeSubunitType, string[]> = { Large: [], Small: [], Neither: [] };
    if (!structure?.models?.length) return result;
    const model = structure.models[0];
    const entities = model.entities?.data;
    if (!entities) return result;
    // Build a mapping from entity ID to row index for robust lookup
    const entityIdToRow: Record<string, number> = {};
    for (let i = 0; i < entities.id.rowCount; i++) {
        entityIdToRow[entities.id.value(i)] = i;
    }
    // Keywords for subunit inference
    const largeKeywords = [/large/i, /60S/i, /LSU/i];
    const smallKeywords = [/small/i, /40S/i, /SSU/i];
    // Map entity id to subunit type
    const entityIdToSubunit: Record<string, RibosomeSubunitType> = {};
    for (let i = 0; i < entities.id.rowCount; i++) {
        const eid = entities.id.value(i);
        let details = entities.details?.value ? entities.details.value(i) : '';
        let pdbxDesc = entities.pdbx_description?.value ? entities.pdbx_description.value(i) : '';
        let type = entities.type?.value ? entities.type.value(i) : '';
        // Ensure all are strings
        details = Array.isArray(details) ? details.join(' ') : (details || '');
        pdbxDesc = Array.isArray(pdbxDesc) ? pdbxDesc.join(' ') : (pdbxDesc || '');
        type = Array.isArray(type) ? type.join(' ') : (type || '');
        // Prefer details, then pdbx_description, then type
        const label = [details, pdbxDesc, type].filter(Boolean).join(' ');
        console.log(`Entity ${eid}: details='${details}', pdbx_description='${pdbxDesc}', type='${type}'`);
        // Custom logic for 4UG0 and similar ribosomes:
        // Large: pdbxDesc starts with 60S and chainId starts with L
        // Small: pdbxDesc starts with 40S and chainId starts with S
        // All others: Neither
        if (/^60S/.test(pdbxDesc)) {
            entityIdToSubunit[eid] = 'Large';
        } else if (/^40S/.test(pdbxDesc)) {
            entityIdToSubunit[eid] = 'Small';
        } else {
            entityIdToSubunit[eid] = 'Neither';
        }
    }
    // Now scan chains and assign to subunits
    const chains = model.atomicHierarchy.chains;
    const auth_asym_id = chains.auth_asym_id;
    // entity_id may not be public, so use _entity_id if needed
    const entity_id = (chains as any).entity_id || (chains as any)._entity_id;
    if (!entity_id) {
        console.warn('No entity_id mapping found in chains.');
        return result;
    }
    for (let i = 0; i < chains._rowCount; i++) {
        const eid = entity_id.value(i);
        const chainId = auth_asym_id.value(i);
        // Use the entity row index for this chain
        const entityRow = entityIdToRow[eid];
        let pdbxDesc = '';
        if (entityRow !== undefined && entities.pdbx_description?.value) {
            const val = entities.pdbx_description.value(entityRow);
            pdbxDesc = Array.isArray(val) ? val.join(' ') : (val || '');
        }
        let subunit: 'Large' | 'Small' | 'Neither' = 'Neither';
        if (/^60S/.test(pdbxDesc) && /^L/.test(chainId)) {
            subunit = 'Large';
        } else if (/^40S/.test(pdbxDesc) && /^S/.test(chainId)) {
            subunit = 'Small';
        } else if (entityIdToSubunit[eid] === 'Large') {
            subunit = 'Large';
        } else if (entityIdToSubunit[eid] === 'Small') {
            subunit = 'Small';
        } else {
            subunit = 'Neither';
        }
        if (!result[subunit].includes(chainId)) {
            result[subunit].push(chainId);
        }
    }
    console.log('Inferred ribosome subunit chain IDs:', result);
    return result;
}