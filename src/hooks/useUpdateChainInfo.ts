/**
 * Custom hook to update chain info and subunit-to-chain mapping for a Mol* structure.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { useEffect } from 'react';

/**
 * Custom hook to update chain info and subunit-to-chain mapping for a Mol* structure.
 *
 * @param pluginRef - Ref to the Mol* plugin UI context.
 * @param structureRef - Structure reference string.
 * @param molstar - Molstar viewer instance.
 * @param setChainInfo - Setter for chain info state.
 * @param setSubunitToChainIds - Setter for subunit-to-chain mapping state.
 * @param label - Optional label for logging/debugging.
 */
export function useUpdateChainInfo(
  pluginRef: React.RefObject<any>,
  structureRef: string | null,
  molstar: any,
  setChainInfo: React.Dispatch<React.SetStateAction<{ chainLabels: Map<string, string> }>>,
  setSubunitToChainIds: React.Dispatch<React.SetStateAction<Map<string, Set<string>>>>,
  label?: string
) {
  useEffect(() => {
    if (!pluginRef.current || !structureRef) return;
    try {
      // Get structure object from plugin
      const structureObj = pluginRef.current.managers.structure.hierarchy.current.structures.find(
        (s: any) => s.cell.transform.ref === structureRef
      )?.cell.obj?.data;
      if (!structureObj) return;
      // Extract chain labels and subunit-to-chain mapping
      const chainLabels = new Map<string, string>();
      const subunitToChainIds = new Map<string, Set<string>>();
      for (const unit of structureObj.units) {
        const chainId = unit.chainId;
        const label = unit.label || chainId;
        const subunit = unit.subunit || 'default';
        chainLabels.set(chainId, label);
        if (!subunitToChainIds.has(subunit)) subunitToChainIds.set(subunit, new Set());
        subunitToChainIds.get(subunit)!.add(chainId);
      }
      setChainInfo({ chainLabels });
      setSubunitToChainIds(subunitToChainIds);
      if (label) {
        // eslint-disable-next-line no-console
        console.log(`[useUpdateChainInfo][${label}] chainLabels:`, chainLabels, 'subunitToChainIds:', subunitToChainIds);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[useUpdateChainInfo][${label}] failed:`, err);
    }
  }, [pluginRef, structureRef, molstar, setChainInfo, setSubunitToChainIds, label]);
}
