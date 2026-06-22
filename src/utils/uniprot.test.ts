import { fetchUniProtGeneNames, fetchUniProtGeneNamesBatched } from './uniprot';
import { vi } from 'vitest';

describe('fetchUniProtGeneNames', () => {
    it('parses UniProt TSV response and returns primary gene names', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => 'Entry\tGene Names (primary)\nP61247\tRPS3A\nP33442\tRPS3A\n',
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
            text: async () => 'Entry\tGene Names (primary)\nP61247\tRPS3A\n',
        });

        const result = await fetchUniProtGeneNames(['P61247', 'Q99999'], fetchMock as any);

        expect(result).toEqual({
            P61247: 'RPS3A',
            Q99999: null,
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
