import { extractUniProtAccessionsFromText, fetchUniProtGeneNames, fetchUniProtGeneNamesBatched } from './uniprot';
import { vi } from 'vitest';

describe('extractUniProtAccessionsFromText', () => {
    it('extracts and deduplicates valid accessions from CIF-like text', () => {
        const text = [
            '4 4 ? LA 1 ? 257 ? P62917 1 ? 257 ? 1 257',
            '5 5 ? LB 1 ? 403 ? P39023 1 ? 403 ? 1 403',
            '6 6 ? LC 1 ? 427 ? P36578 1 ? 427 ? 1 427',
            'repeat P39023 and invalid 174924 and 6XU8'
        ].join('\n');

        const accessions = extractUniProtAccessionsFromText(text);
        expect(accessions.has('P62917')).toBe(true);
        expect(accessions.has('P39023')).toBe(true);
        expect(accessions.has('P36578')).toBe(true);
        expect(accessions.has('174924')).toBe(false);
        expect(accessions.has('6XU8')).toBe(false);
        expect(accessions.size).toBe(3);
    });
});

describe('fetchUniProtGeneNames', () => {
    it('parses UniProt TSV response and returns primary gene names', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => 'Entry\tGene Names (primary)\tGene Names\nP61247\tRPS3A\tRPS3A FTE1\nP33442\tRPS3A\tRPS3A\n',
        });

        const result = await fetchUniProtGeneNames(['P61247', 'P33442'], fetchMock as any);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result).toEqual({
            P61247: 'RPS3A',
            P33442: 'RPS3A',
        });
    });

    it('fills unresolved accessions with null', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => 'Entry\tGene Names (primary)\tGene Names\nP61247\tRPS3A\tRPS3A FTE1\n',
        });

        const result = await fetchUniProtGeneNames(['P61247', 'Q99999'], fetchMock as any);

        expect(result).toEqual({
            P61247: 'RPS3A',
            Q99999: null,
        });
    });

    it('falls back to alternate gene-name column when primary is empty', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => 'Entry\tGene Names (primary)\tGene Names\nQ9V9M7\t\tQ9V9M7_DROME\n',
        });

        const result = await fetchUniProtGeneNames(['Q9V9M7'], fetchMock as any);

        expect(result).toEqual({
            Q9V9M7: 'Q9V9M7_DROME',
        });
    });
});

describe('fetchUniProtGeneNamesBatched', () => {
    it('marks whole batch as null on request failure and continues', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: async () => '',
            })
            .mockResolvedValueOnce({
                ok: true,
                text: async () => 'Entry\tGene Names (primary)\nP3\tG3\n',
            });

        const result = await fetchUniProtGeneNamesBatched(['P1', 'P2', 'P3'], {
            batchSize: 2,
            delayMs: 0,
            fetchFn: fetchMock as any,
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            P1: null,
            P2: null,
            P3: 'G3',
        });
    });
});
