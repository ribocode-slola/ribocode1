/**
 * Custom hook to update residue info for a Mol* structure and selected chain.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.1
 * @lastModified 2026-06-22
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { useEffect, useRef } from 'react';
import { ResidueLabelInfo } from '../utils/residue';

/**
 * Custom hook to update residue info for a Mol* structure and selected chain.
 *
 * Whenever `selectedChainId` changes the residue list is refreshed.  If the
 * previously selected residue ID no longer exists in the new chain, the
 * selection is automatically reset to the first residue of the new chain.
 *
 * @param viewerRef - Ref to the Mol* plugin UI context.
 * @param structureRef - Structure reference string.
 * @param molstar - Molstar viewer instance.
 * @param selectedChainId - Selected chain ID.
 * @param setResidueInfo - Setter for residue info state.
 * @param selectedResidueId - Currently selected residue ID (read-only, via ref).
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
  // Use a ref so we can read the latest selectedResidueId inside the effect
  // without adding it to the dependency array (which would cause infinite loops).
  const selectedResidueIdRef = useRef(selectedResidueId);
  selectedResidueIdRef.current = selectedResidueId;

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
      // Reset selection when the current residue ID is not in the new chain.
      // Also auto-select the first residue when nothing is selected.
      const currentId = selectedResidueIdRef.current;
      if (residueLabels.size > 0 && (!currentId || !residueLabels.has(currentId))) {
        setSelectedResidueId(Array.from(residueLabels.keys())[0] as string);
      }
      // Debug logging disabled to avoid console spam; uncomment if needed:
      // if (label) console.log(`[useUpdateResidueInfo][${label}] residueLabels:`, residueLabels);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[useUpdateResidueInfo][${label}] failed:`, err);
    }
  // selectedResidueId intentionally omitted — accessed via ref to avoid loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerRef, structureRef, molstar, selectedChainId, setResidueInfo, setSelectedResidueId, label]);
}
