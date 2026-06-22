/**
 * UniProt API utilities for resolving gene names from UniProt accessions.
 */

export type UniProtGeneNameCache = Record<string, string | null>;

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseTsvGeneResponse(tsv: string): UniProtGeneNameCache {
    const lines = tsv
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length <= 1) return {};

    const result: UniProtGeneNameCache = {};
    for (let i = 1; i < lines.length; i++) {
        const [accessionRaw, geneRaw] = lines[i].split('\t');
        const accession = (accessionRaw || '').trim();
        if (!accession) continue;

        const firstGene = (geneRaw || '')
            .split(/[\s,;]+/)
            .map(v => v.trim())
            .find(Boolean);

        result[accession] = firstGene || null;
    }
    return result;
}

function buildSearchUrl(accessions: string[]): string {
    const clauses = accessions.map(a => `accession:${a}`).join(' OR ');
    const query = encodeURIComponent(`(${clauses})`);
    return `https://rest.uniprot.org/uniprotkb/search?query=${query}&fields=accession,gene_primary&format=tsv&size=${accessions.length}`;
}

export async function fetchUniProtGeneNames(
    accessions: string[],
    fetchFn: FetchLike = fetch,
): Promise<UniProtGeneNameCache> {
    const unique = Array.from(new Set(accessions.map(a => a.trim()).filter(Boolean)));
    if (unique.length === 0) return {};

    const url = buildSearchUrl(unique);
    const response = await fetchFn(url, {
        method: 'GET',
        headers: { 'Accept': 'text/tab-separated-values' },
    });

    if (!response.ok) {
        throw new Error(`UniProt lookup failed with status ${response.status}`);
    }

    const tsv = await response.text();
    const resolved = parseTsvGeneResponse(tsv);

    for (const accession of unique) {
        if (!(accession in resolved)) {
            resolved[accession] = null;
        }
    }

    return resolved;
}

export async function fetchUniProtGeneNamesBatched(
    accessions: Iterable<string>,
    options?: {
        batchSize?: number;
        delayMs?: number;
        fetchFn?: FetchLike;
        signal?: AbortSignal;
    }
): Promise<UniProtGeneNameCache> {
    const {
        batchSize = 25,
        delayMs = 1200,
        fetchFn = fetch,
        signal,
    } = options || {};

    const unique = Array.from(new Set(Array.from(accessions).map(a => a.trim()).filter(Boolean)));
    const result: UniProtGeneNameCache = {};

    for (let i = 0; i < unique.length; i += batchSize) {
        if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        const batch = unique.slice(i, i + batchSize);
        try {
            const resolved = await fetchUniProtGeneNames(batch, fetchFn);
            Object.assign(result, resolved);
        } catch {
            for (const accession of batch) {
                result[accession] = null;
            }
        }

        if (i + batchSize < unique.length && delayMs > 0) {
            await sleep(delayMs);
        }
    }

    return result;
}
