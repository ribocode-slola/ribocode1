/**
 * Test suite for rpNameTable utility functions.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-06-22
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { parseRpNameTable, buildEntityToUniprotMap } from './rpNameTable';

describe('parseRpNameTable', () => {
    const HEADER = 'family,human_old_name,yeast_old_name,arabdidopsis_homologs,drosophila_homologs,human_homologs,yeast_homologs';

    it('returns an empty map for empty input', () => {
        expect(parseRpNameTable('').size).toBe(0);
    });

    it('returns an empty map for header-only input', () => {
        expect(parseRpNameTable(HEADER).size).toBe(0);
    });

    it('maps a single human UniProt code to its family name', () => {
        const csv = [HEADER, 'eS1,S1,S3A,,,,P61247'].join('\n');
        const lookup = parseRpNameTable(csv);
        expect(lookup.get('P61247')).toBe('eS1');
    });

    it('maps multiple semicolon-separated UniProt codes in one column', () => {
        const csv = [HEADER, 'uS2,S0,SA,,,P08865;A0A0C4DG17,P32905'].join('\n');
        const lookup = parseRpNameTable(csv);
        expect(lookup.get('P08865')).toBe('uS2');
        expect(lookup.get('A0A0C4DG17')).toBe('uS2');
        expect(lookup.get('P32905')).toBe('uS2');
    });

    it('maps codes across all species columns (cols 3–6)', () => {
        const csv = [
            HEADER,
            'uS3,S3,S3,Q9M339,Q06559,P23396,A0A6A5Q3Q1'
        ].join('\n');
        const lookup = parseRpNameTable(csv);
        // arabidopsis (col 3)
        expect(lookup.get('Q9M339')).toBe('uS3');
        // drosophila (col 4)
        expect(lookup.get('Q06559')).toBe('uS3');
        // human (col 5)
        expect(lookup.get('P23396')).toBe('uS3');
        // yeast (col 6)
        expect(lookup.get('A0A6A5Q3Q1')).toBe('uS3');
    });

    it('ignores blank lines in the CSV', () => {
        const csv = [HEADER, '', 'eS1,S1,S3A,,,,P61247', ''].join('\n');
        const lookup = parseRpNameTable(csv);
        expect(lookup.get('P61247')).toBe('eS1');
        expect(lookup.size).toBe(1);
    });

    it('handles multiple rows correctly', () => {
        const csv = [
            HEADER,
            'eS1,S1,S3A,,,,P61247',
            'uS2,S0,SA,,,P08865,P32905'
        ].join('\n');
        const lookup = parseRpNameTable(csv);
        expect(lookup.get('P61247')).toBe('eS1');
        expect(lookup.get('P08865')).toBe('uS2');
        expect(lookup.get('P32905')).toBe('uS2');
    });

    it('trims whitespace from UniProt codes', () => {
        const csv = [HEADER, 'eS1,S1,S3A,,,  P61247 ;D6RG13  ,'].join('\n');
        const lookup = parseRpNameTable(csv);
        expect(lookup.get('P61247')).toBe('eS1');
        expect(lookup.get('D6RG13')).toBe('eS1');
    });

    it('does not map old names (columns 1 and 2) to family', () => {
        const csv = [HEADER, 'eS1,S1,S3A,,,,P61247'].join('\n');
        const lookup = parseRpNameTable(csv);
        expect(lookup.has('S1')).toBe(false);
        expect(lookup.has('S3A')).toBe(false);
    });

    it('parses a realistic excerpt from the actual CSV', () => {
        const csv = [
            HEADER,
            'eS1,S1,S3A,Q42262;Q9CAV0,P55830,P61247;D6RG13;D6RGE0,A0A6A5PRY4;P33442',
            'uS2,S0,SA,B9DG17;Q08682,P38979,P08865;A0A0C4DG17,P32905;P46654'
        ].join('\n');
        const lookup = parseRpNameTable(csv);
        expect(lookup.get('Q42262')).toBe('eS1');
        expect(lookup.get('P55830')).toBe('eS1');
        expect(lookup.get('D6RGE0')).toBe('eS1');
        expect(lookup.get('P33442')).toBe('eS1');
        expect(lookup.get('B9DG17')).toBe('uS2');
        expect(lookup.get('P38979')).toBe('uS2');
        expect(lookup.get('P46654')).toBe('uS2');
    });
});

describe('buildEntityToUniprotMap', () => {
    it('returns an empty map when model is null', () => {
        expect(buildEntityToUniprotMap(null).size).toBe(0);
    });

    it('returns an empty map when sourceData is absent', () => {
        expect(buildEntityToUniprotMap({}).size).toBe(0);
    });

    it('returns an empty map when struct_ref is absent', () => {
        const model = { sourceData: { data: { db: {} } } };
        expect(buildEntityToUniprotMap(model).size).toBe(0);
    });

    it('maps entity IDs to UniProt accessions', () => {
        const model = {
            sourceData: {
                data: {
                    db: {
                        struct_ref: {
                            _rowCount: 2,
                            entity_id: { value: (i: number) => ['1', '2'][i] },
                            pdbx_db_accession: { value: (i: number) => ['P61247', 'P08865'][i] }
                        }
                    }
                }
            }
        };
        const map = buildEntityToUniprotMap(model);
        expect(map.get('1')).toBe('P61247');
        expect(map.get('2')).toBe('P08865');
    });

    it('trims whitespace from accession values', () => {
        const model = {
            sourceData: {
                data: {
                    db: {
                        struct_ref: {
                            _rowCount: 1,
                            entity_id: { value: () => '1' },
                            pdbx_db_accession: { value: () => '  P61247  ' }
                        }
                    }
                }
            }
        };
        const map = buildEntityToUniprotMap(model);
        expect(map.get('1')).toBe('P61247');
    });

    it('returns an empty map when struct_ref throws', () => {
        const model = {
            sourceData: {
                data: {
                    db: {
                        struct_ref: {
                            get _rowCount() { throw new Error('oops'); }
                        }
                    }
                }
            }
        };
        expect(buildEntityToUniprotMap(model).size).toBe(0);
    });
});
