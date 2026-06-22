/**
 * Utility functions for parsing and using the RP_name_table_uniprot.csv data file.
 *
 * The CSV maps gene family names (e.g. uS2, eS1) to UniProt accession codes for
 * multiple species (arabidopsis, drosophila, human, yeast). This lookup is used to
 * enrich chain labels in the viewer so users see meaningful protein names instead
 * of raw mmCIF identifiers.
 *
 * Expected CSV format:
 *   family,human_old_name,yeast_old_name,arabdidopsis_homologs,drosophila_homologs,human_homologs,yeast_homologs
 *   eS1,S1,S3A,Q42262;Q9CAV0,P55830,P61247;D6RG13,A0A6A5PRY4;P33442
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-06-22
 * @see https://github.com/ribocode-slola/ribocode1
 */

/**
 * Column indices in the CSV that hold semicolon-separated UniProt accession codes.
 * 0=family, 1=human_old_name, 2=yeast_old_name, 3=arabidopsis, 4=drosophila, 5=human, 6=yeast
 */
const UNIPROT_COL_INDICES = [3, 4, 5, 6];

/**
 * Parses the RP_name_table_uniprot.csv content into a lookup map.
 *
 * Each UniProt accession found in the arabidopsis, drosophila, human, or yeast
 * homolog columns is mapped to the gene family name in column 0 (e.g. "eS1", "uS2").
 *
 * @param csvText - Raw text content of RP_name_table_uniprot.csv.
 * @returns Map from UniProt accession code → gene family name.
 */
export function parseRpNameTable(csvText: string): Map<string, string> {
    const lookup = new Map<string, string>();
    const lines = csvText.split('\n');
    // Skip header row (line 0)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        const family = cols[0]?.trim();
        if (!family) continue;
        for (const ci of UNIPROT_COL_INDICES) {
            const cellValue = cols[ci] || '';
            const codes = cellValue.split(';');
            for (const code of codes) {
                const c = code.trim();
                if (c) {
                    lookup.set(c, family);
                }
            }
        }
    }
    return lookup;
}

/**
 * Builds a map from entity ID to UniProt accession from a Mol* model's struct_ref data.
 *
 * Reads the `_struct_ref` mmCIF category (accessible via `model.sourceData.data.db.struct_ref`)
 * and returns a Map<entityId, uniprotAccession>.
 *
 * Returns an empty map if the data is not available (e.g. in tests or non-mmCIF sources).
 *
 * @param model - A Mol* model object.
 * @returns Map from entity ID string → UniProt accession string.
 */
export function buildEntityToUniprotMap(model: any): Map<string, string> {
    const entityToUniprot = new Map<string, string>();
    try {
        const structRef = model?.sourceData?.data?.db?.struct_ref;
        if (!structRef) return entityToUniprot;
        const rowCount: number = structRef._rowCount ?? 0;
        for (let r = 0; r < rowCount; r++) {
            const entityId = structRef.entity_id?.value?.(r);
            const accession = structRef.pdbx_db_accession?.value?.(r);
            if (entityId != null && accession) {
                entityToUniprot.set(String(entityId), String(accession).trim());
            }
        }
    } catch {
        // Gracefully degrade — no UniProt data available
    }
    return entityToUniprot;
}
