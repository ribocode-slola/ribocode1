/**
 * Custom hook to update chain info and subunit-to-chain mapping for a Mol* structure.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
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
    // Guard: pluginRef.current.managers must exist
    if (!pluginRef.current.managers || !pluginRef.current.managers.structure || !pluginRef.current.managers.structure.hierarchy || !pluginRef.current.managers.structure.hierarchy.current) return;
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
        // Use chainGroupId as the chain identifier (Mol* convention)
        const chainId = unit.chainGroupId;
        if (chainId === undefined || chainId === null || chainId === '') {
          // eslint-disable-next-line no-console
          console.warn(`[useUpdateChainInfo][${label}] Skipping unit with invalid chainGroupId:`, unit);
          continue;
        }
        const labelVal = unit.label || chainId;
        const subunit = unit.subunit || 'default';
        chainLabels.set(chainId, labelVal);
        if (!subunitToChainIds.has(subunit)) subunitToChainIds.set(subunit, new Set());
        subunitToChainIds.get(subunit)!.add(chainId);
      }
      if (chainLabels.size === 0) {
        // eslint-disable-next-line no-console
        console.warn(`[useUpdateChainInfo][${label}] No valid chains found in structure. State not updated.`);
        return;
      }
      // Only update state if changed (deep equality)
      setChainInfo(prev => {
        const prevLabels = prev.chainLabels;
        let changed = chainLabels.size !== prevLabels.size;
        if (!changed) {
          for (const [k, v] of chainLabels) {
            if (!prevLabels.has(k) || prevLabels.get(k) !== v) {
              changed = true;
              break;
            }
          }
        }
        if (changed) return { chainLabels };
        return prev;
      });
      setSubunitToChainIds(prev => {
        let changed = subunitToChainIds.size !== prev.size;
        if (!changed) {
          for (const [k, v] of subunitToChainIds) {
            const prevSet = prev.get(k);
            if (!prevSet || prevSet.size !== v.size) {
              changed = true;
              break;
            }
            for (const val of v) {
              if (!prevSet.has(val)) {
                changed = true;
                break;
              }
            }
            if (changed) break;
          }
        }
        if (changed) return subunitToChainIds;
        return prev;
      });
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
