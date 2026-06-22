/**
 * Chain utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.1
 * @lastModified 2026-06-22
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { Structure } from 'molstar/lib/mol-model/structure';
import { buildEntityToUniprotMap } from './rpNameTable';

/**
 * Extracts chain IDs and labels from a Mol* Structure object.
 *
 * When `rpNameLookup` is provided the function attempts to resolve a gene
 * family name (e.g. "uS2", "eS1") for each chain by:
 *   1. Reading the `_struct_ref.pdbx_db_accession` mmCIF table from the model
 *      to map entity IDs → UniProt accession codes.
 *   2. Looking up each UniProt accession in `rpNameLookup`.
 * If a family name is found the label becomes `<family> [<labelId>]`;
 * otherwise it falls back to `<labelId> [auth <authId>]`.
 *
 * @param structure The Mol* Structure object.
 * @param rpNameLookup Optional Map<uniprotCode, familyName> from parseRpNameTable().
 * @returns An object containing a Map of auth chain IDs to their display labels.
 */
export function getChainInfo(
    structure: Structure,
    rpNameLookup?: Map<string, string>
): { chainLabels: Map<string, string> } {
    const chainLabels: Map<string, string> = new Map();
    const units = structure.units;
    if (!units || units.length === 0) {
        console.warn('No units found in structure.');
        return { chainLabels };
    }
    units.forEach(unit => {
        // Only process atomic units
        if ((unit as any).kind !== undefined && (unit as any).kind !== 0) return;
        const model = (unit as any).model;
        if (!model) return;
        const chains = model.atomicHierarchy?.chains;
        if (!chains) return;
        const { auth_asym_id, label_asym_id } = chains;

        // Build entity → UniProt map once per model (if lookup provided)
        let entityToUniprot: Map<string, string> | undefined;
        if (rpNameLookup) {
            entityToUniprot = buildEntityToUniprotMap(model);
        }

        for (let i = 0; i < chains._rowCount; i++) {
            const authId: string = auth_asym_id.value(i);
            if (chainLabels.has(authId)) continue; // deduplicate across units

            const labelId: string = label_asym_id?.value ? label_asym_id.value(i) : '';

            // Attempt to resolve gene family name via UniProt
            let familyName: string | undefined;
            if (rpNameLookup && entityToUniprot) {
                const entityId = chains.label_entity_id?.value
                    ? String(chains.label_entity_id.value(i))
                    : undefined;
                const uniprot = entityId ? entityToUniprot.get(entityId) : undefined;
                if (uniprot) {
                    familyName = rpNameLookup.get(uniprot);
                }
            }

            let label: string;
            if (familyName) {
                label = `${familyName} [${labelId || authId}]`;
            } else {
                label = labelId ? `${labelId} [auth ${authId}]` : `[auth ${authId}]`;
            }
            chainLabels.set(authId, label);
        }
    });
    return { chainLabels };
}