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
import { buildEntityToUniprotMap, inferSpeciesKeyFromModel, RpNameLookupBySpecies } from './rpNameTable';

function buildChainLabel(
    labelId: string,
    authId: string,
    familyName?: string,
    uniprotAccession?: string,
    geneName?: string,
    showUniprotAccessionInLabel = true
): string {
    const targetId = labelId || authId;
    const defaultLabel = labelId ? `${labelId} [auth ${authId}]` : `[auth ${authId}]`;

    if (!familyName && !uniprotAccession && !geneName) {
        return defaultLabel;
    }

    const prefixParts: string[] = [];
    if (familyName) prefixParts.push(familyName);
    if (geneName && uniprotAccession) {
        prefixParts.push(showUniprotAccessionInLabel ? `${geneName} (${uniprotAccession})` : geneName);
    } else if (geneName) {
        prefixParts.push(geneName);
    } else if (uniprotAccession && showUniprotAccessionInLabel) {
        prefixParts.push(uniprotAccession);
    }

    if (prefixParts.length === 0) {
        return defaultLabel;
    }

    return `${prefixParts.join(' | ')} [${targetId}]`;
}

function isLookupBySpecies(
    lookup?: Map<string, string> | RpNameLookupBySpecies
): lookup is RpNameLookupBySpecies {
    return !!lookup && typeof lookup === 'object' && 'all' in lookup;
}

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
    rpNameLookup?: Map<string, string> | RpNameLookupBySpecies,
    geneNameLookup?: Record<string, string | null>,
    showUniprotAccessionInLabel = true
): {
    chainLabels: Map<string, string>;
    chainToUniprot: Map<string, string>;
    uniprotAccessions: Set<string>;
} {
    const chainLabels: Map<string, string> = new Map();
    const chainToUniprot: Map<string, string> = new Map();
    const uniprotAccessions: Set<string> = new Set();
    const units = structure.units;
    if (!units || units.length === 0) {
        console.warn('No units found in structure.');
        return { chainLabels, chainToUniprot, uniprotAccessions };
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

        const speciesKey = isLookupBySpecies(rpNameLookup)
            ? inferSpeciesKeyFromModel(model)
            : undefined;
        const activeLookup = isLookupBySpecies(rpNameLookup)
            ? (speciesKey ? rpNameLookup[speciesKey] : rpNameLookup.all)
            : rpNameLookup;

        for (let i = 0; i < chains._rowCount; i++) {
            const authId: string = auth_asym_id.value(i);
            if (chainLabels.has(authId)) continue; // deduplicate across units

            const labelId: string = label_asym_id?.value ? label_asym_id.value(i) : '';

            // Attempt to resolve gene family name via UniProt
            let familyName: string | undefined;
            let uniprotAccession: string | undefined;
            if (rpNameLookup && entityToUniprot) {
                const entityId = chains.label_entity_id?.value
                    ? String(chains.label_entity_id.value(i))
                    : undefined;
                const uniprot = entityId ? entityToUniprot.get(entityId) : undefined;
                if (uniprot) {
                    uniprotAccession = uniprot;
                    uniprotAccessions.add(uniprot);
                    chainToUniprot.set(authId, uniprot);
                    familyName = activeLookup?.get(uniprot);
                    if (!familyName && isLookupBySpecies(rpNameLookup)) {
                        familyName = rpNameLookup.all.get(uniprot);
                    }
                }
            }

            const geneName = uniprotAccession ? geneNameLookup?.[uniprotAccession] ?? undefined : undefined;
            const label = buildChainLabel(
                labelId,
                authId,
                familyName,
                uniprotAccession,
                geneName ?? undefined,
                showUniprotAccessionInLabel
            );
            chainLabels.set(authId, label);
        }
    });
    return { chainLabels, chainToUniprot, uniprotAccessions };
}