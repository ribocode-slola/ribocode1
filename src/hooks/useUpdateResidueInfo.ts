/**
 * Custom hook to update residue info for a Mol* structure and selected chain.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { useEffect } from 'react';
import { ResidueLabelInfo } from '../utils/residue';

/**
 * Custom hook to update residue info for a Mol* structure and selected chain.
 *
 * @param viewerRef - Ref to the Mol* plugin UI context.
 * @param structureRef - Structure reference string.
 * @param molstar - Molstar viewer instance.
 * @param selectedChainId - Selected chain ID.
 * @param setResidueInfo - Setter for residue info state.
 * @param selectedResidueId - Selected residue ID.
 * @param setSelectedResidueId - Setter for selected residue ID.
 * @param label - Optional label for logging/debugging.
 */
export function useUpdateResidueInfo(
  viewerRef: React.RefObject<any>,
  structureRef: string | null,
  molstar: any,
  selectedChainId: string,
  setResidueInfo: React.Dispatch<React.SetStateAction<{ residueLabels: Map<string, ResidueLabelInfo>; residueToAtomIds: Record<string, string[]> }>>,
  selectedResidueId: string,
  setSelectedResidueId: React.Dispatch<React.SetStateAction<string>>,
  label?: string
) {
  useEffect(() => {
    if (!viewerRef.current || !structureRef || !selectedChainId) return;
    try {
      // Get structure object from plugin
      const structureObj = viewerRef.current.managers.structure.hierarchy.current.structures.find(
        (s: any) => s.cell.transform.ref === structureRef
      )?.cell.obj?.data;
      if (!structureObj) return;
      // Get residue info from molstar utility
      const { residueLabels, residueToAtomIds } = molstar.getResidueInfo(structureObj, selectedChainId);
      setResidueInfo({ residueLabels, residueToAtomIds });
      // Auto-select first residue if none selected
      if (!selectedResidueId && residueLabels.size > 0) {
        setSelectedResidueId(Array.from(residueLabels.keys())[0] as string);
      }
      if (label) {
        // eslint-disable-next-line no-console
        console.log(`[useUpdateResidueInfo][${label}] residueLabels:`, residueLabels);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[useUpdateResidueInfo][${label}] failed:`, err);
    }
  }, [viewerRef, structureRef, molstar, selectedChainId, setResidueInfo, selectedResidueId, setSelectedResidueId, label]);
}
