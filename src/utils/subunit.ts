/**
 * Subunit utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { Structure } from 'molstar/lib/mol-model/structure';

/**
 * Types of ribosome subunits.
 */
export type RibosomeSubunitType = 'All' | 'Large' | 'Small' | 'Other';
export const RibosomeSubunitTypes: RibosomeSubunitType[] = ['All', 'Large', 'Small', 'Other'];

export type SubunitInferenceConfidenceLevel = 'high' | 'medium' | 'low';

export interface SubunitInferenceConfidence {
    level: SubunitInferenceConfidenceLevel;
    reason: string;
    metrics: {
        chainCount: number;
        largeCount: number;
        smallCount: number;
        otherCount: number;
        descriptionClassifiedCount: number;
        usedExplicitPrefixStrategy: boolean;
    };
}

function normalizeToken(value: unknown): string {
    const v = String(value ?? '').trim();
    if (!v || v === '.' || v === '?') return '';
    return v;
}

function inferByEntityDescription(description: string): RibosomeSubunitType | undefined {
    const d = description.toLowerCase();

    const largeHints = [
        'large subunit',
        '50s',
        '60s',
        'lsu',
    ];
    const smallHints = [
        'small subunit',
        '30s',
        '40s',
        'ssu',
    ];

    const hasLargeHint = largeHints.some(h => d.includes(h));
    const hasSmallHint = smallHints.some(h => d.includes(h));
    if (hasLargeHint && !hasSmallHint) return 'Large';
    if (hasSmallHint && !hasLargeHint) return 'Small';
    return undefined;
}

function buildEntityDescriptionMap(model: any): Map<string, string> {
    const entityDescriptions = new Map<string, string>();
    try {
        const entity = model?.sourceData?.data?.db?.entity;
        if (!entity) return entityDescriptions;
        const rowCount = entity._rowCount ?? 0;
        for (let i = 0; i < rowCount; i++) {
            const entityId = normalizeToken(entity.id?.value?.(i));
            const description = normalizeToken(entity.pdbx_description?.value?.(i));
            if (!entityId || !description) continue;
            entityDescriptions.set(entityId, description);
        }
    } catch {
        // Keep inference resilient when metadata extraction fails.
    }
    return entityDescriptions;
}

function getEntityIdForChain(chains: any, row: number): string {
    const labelEntity = normalizeToken(chains.label_entity_id?.value?.(row));
    if (labelEntity) return labelEntity;
    return normalizeToken(chains.entity_id?.value?.(row));
}

/**
 * Infers ribosome subunit chain IDs from a Mol* Structure object.
 * @param structure The Mol* Structure object.
 * @returns An object mapping subunit types to their associated chain IDs.
 */
export function getSubunitToChainIds(structure: Structure):
 { subunitToChainIds: Map<RibosomeSubunitType, Set<string>>; confidence: SubunitInferenceConfidence } {
    // Initialize result
    const result: { subunitToChainIds: Map<RibosomeSubunitType, Set<string>>; confidence: SubunitInferenceConfidence } = {
        subunitToChainIds: new Map([
            ['All', new Set<string>()],
            ['Large', new Set<string>()],
            ['Small', new Set<string>()],
            ['Other', new Set<string>()],
        ]),
        confidence: {
            level: 'low',
            reason: 'No units found in structure.',
            metrics: {
                chainCount: 0,
                largeCount: 0,
                smallCount: 0,
                otherCount: 0,
                descriptionClassifiedCount: 0,
                usedExplicitPrefixStrategy: false,
            },
        },
    };
    const units = structure.units;
    if (!units || units.length === 0) {
        console.warn('No units found in structure.');
        return result;
    }
    // Explicit L/S-prefixed chain IDs are treated as authoritative when present.
    const explicitLargePattern = /^L.*/i;
    const explicitSmallPattern = /^S.*/i;
    // Legacy fallback for structures that use A/C naming instead of L/S.
    const fallbackLargePattern = /^A.*/i;
    const fallbackSmallPattern = /^C.*/i;

    const chainIds = new Set<string>();
    const chainToEntityDescription = new Map<string, string>();

    // Collect unique auth chain IDs first so classification can choose the right strategy.
    units.forEach(unit => {
        const chains = unit.model.atomicHierarchy.chains;
        const { auth_asym_id, label_asym_id } = chains;
        const entityDescriptions = buildEntityDescriptionMap(unit.model);
        for (let i = 0; i < chains._rowCount; i++) {
            const authId = normalizeToken(auth_asym_id?.value?.(i));
            const labelId = normalizeToken(label_asym_id?.value?.(i));
            const chainId = authId || labelId;
            if (!chainId) continue;
            chainIds.add(chainId);
            const entityId = getEntityIdForChain(chains, i);
            const description = entityId ? entityDescriptions.get(entityId) : undefined;
            if (description && !chainToEntityDescription.has(chainId)) {
                chainToEntityDescription.set(chainId, description);
            }
        }
    });

    const hasExplicitLarge = Array.from(chainIds).some(chainId => explicitLargePattern.test(chainId));
    const hasExplicitSmall = Array.from(chainIds).some(chainId => explicitSmallPattern.test(chainId));
    const useExplicitStrategy = hasExplicitLarge || hasExplicitSmall;

    let descriptionClassifiedCount = 0;

    for (const chainId of chainIds) {
        // Prefer structural metadata when available because chain naming schemes
        // vary widely between datasets.
        const description = chainToEntityDescription.get(chainId) ?? '';
        const byDescription = description ? inferByEntityDescription(description) : undefined;
        if (byDescription === 'Large') {
            result.subunitToChainIds.get('Large')!.add(chainId);
            descriptionClassifiedCount++;
            continue;
        }
        if (byDescription === 'Small') {
            result.subunitToChainIds.get('Small')!.add(chainId);
            descriptionClassifiedCount++;
            continue;
        }

        if (explicitLargePattern.test(chainId)) {
            result.subunitToChainIds.get('Large')!.add(chainId);
            continue;
        }
        if (explicitSmallPattern.test(chainId)) {
            result.subunitToChainIds.get('Small')!.add(chainId);
            continue;
        }

        if (!useExplicitStrategy) {
            if (fallbackLargePattern.test(chainId)) {
                result.subunitToChainIds.get('Large')!.add(chainId);
                continue;
            }
            if (fallbackSmallPattern.test(chainId)) {
                result.subunitToChainIds.get('Small')!.add(chainId);
                continue;
            }
        }

        result.subunitToChainIds.get('Other')!.add(chainId);
    }

    const largeCount = result.subunitToChainIds.get('Large')!.size;
    const smallCount = result.subunitToChainIds.get('Small')!.size;
    const otherCount = result.subunitToChainIds.get('Other')!.size;
    const chainCount = chainIds.size;
    const otherRatio = chainCount > 0 ? otherCount / chainCount : 1;

    let confidenceLevel: SubunitInferenceConfidenceLevel = 'high';
    let confidenceReason = 'Subunit inference had balanced Large/Small coverage.';
    if (chainCount === 0 || largeCount === 0 || smallCount === 0 || otherRatio >= 0.6) {
        confidenceLevel = 'low';
        confidenceReason = 'Subunit inference is ambiguous (missing Large/Small assignments or heavy Other bucket).';
    } else if (otherRatio >= 0.5 || descriptionClassifiedCount === 0) {
        confidenceLevel = 'medium';
        confidenceReason = 'Subunit inference is partially confident (limited metadata or sizable Other bucket).';
    }

    result.confidence = {
        level: confidenceLevel,
        reason: confidenceReason,
        metrics: {
            chainCount,
            largeCount,
            smallCount,
            otherCount,
            descriptionClassifiedCount,
            usedExplicitPrefixStrategy: useExplicitStrategy,
        },
    };

    // Print the final mapping
    console.log('[Subunit Debug] Final subunitToChainIds:', result.subunitToChainIds);
    console.log('[Subunit Debug] Inference confidence:', result.confidence);
    return result;
}