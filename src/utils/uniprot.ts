/**
 * UniProt API utilities for resolving gene names from UniProt accessions.
 */

export type UniProtGeneNameCache = Record<string, string | null>;

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const UNIPROT_ACCESSION_PATTERN = /\b(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2})\b/g;

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
        const columns = lines[i].split('\t');
        const accessionRaw = columns[0];
        const accession = (accessionRaw || '').trim();
        if (!accession) continue;

        const firstGene = columns
            .slice(1)
            .map(col => (col || '').trim())
            .find(Boolean)
            ?.split(/[\s,;]+/)
            .map(v => v.trim())
            .find(Boolean);

        result[accession] = firstGene || null;
    }
    return result;
}

function buildSearchUrl(accessions: string[]): string {
    const clauses = accessions.map(a => `accession:${a}`).join(' OR ');
    const query = encodeURIComponent(`(${clauses})`);
    return `https://rest.uniprot.org/uniprotkb/search?query=${query}&fields=accession,gene_primary,gene_names&format=tsv&size=${accessions.length}`;
}

export function extractUniProtAccessionsFromText(text: string): Set<string> {
    const matches = text.match(UNIPROT_ACCESSION_PATTERN) || [];
    return new Set(matches.map(v => v.trim()).filter(Boolean));
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
        onBatchResolved?: (batch: string[], resolved: UniProtGeneNameCache) => void;
    }
): Promise<UniProtGeneNameCache> {
    const {
        batchSize = 25,
        delayMs = 1200,
        fetchFn = fetch,
        signal,
        onBatchResolved,
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
            onBatchResolved?.(batch, resolved);
        } catch {
            const failed: UniProtGeneNameCache = {};
            for (const accession of batch) {
                result[accession] = null;
                failed[accession] = null;
            }
            onBatchResolved?.(batch, failed);
        }

        if (i + batchSize < unique.length && delayMs > 0) {
            await sleep(delayMs);
        }
    }

    return result;
}
