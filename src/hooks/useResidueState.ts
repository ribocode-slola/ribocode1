/**
 * Custom React hook for managing residue state, including residue labels and selected residue ID.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { useState } from 'react';
import { ResidueLabelInfo } from '../utils/residue';

// Define the shape of the residue information state
export interface ResidueInfo {
  residueLabels: Map<string, ResidueLabelInfo>;
  residueToAtomIds: Record<string, string[]>;
}

/**
 * Custom React hook for managing residue state.
 * @param initialSelected The initial selected residue ID, default is an empty string.
 * @returns An object containing residueInfo, setResidueInfo, selectedResidueId, and setSelectedResidueId.
 */
export function useResidueState(initialSelected: string = '') {
  const [residueInfo, setResidueInfo] = useState<ResidueInfo>({ residueLabels: new Map(), residueToAtomIds: {} });
  const [selectedResidueId, setSelectedResidueId] = useState<string>(initialSelected);
  return {
    residueInfo,
    setResidueInfo,
    selectedResidueId,
    setSelectedResidueId,
  };
}
