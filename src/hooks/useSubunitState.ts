/**
 * Custom React hook for managing subunit state, including subunit types and selected subunit.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { useState } from 'react';
import { RibosomeSubunitType } from '../utils/subunit';

// Helper function to create a default subunit to chain IDs map
const defaultSubunitMap = () => new Map<string, Set<string>>([
  ['All', new Set()],
  ['Large', new Set()],
  ['Small', new Set()],
  ['Other', new Set()],
]);

/**
 * Custom React hook for managing subunit state.
 * @param initial The initial selected subunit, default is 'All'.
 * @returns An object containing subunitToChainIds, setSubunitToChainIds, selectedSubunit, and setSelectedSubunit.
 */
export function useSubunitState(initial: RibosomeSubunitType = 'All') {
  const [subunitToChainIds, setSubunitToChainIds] = useState<Map<string, Set<string>>>(defaultSubunitMap());
  const [selectedSubunit, setSelectedSubunit] = useState<RibosomeSubunitType>(initial);
  return {
    subunitToChainIds,
    setSubunitToChainIds,
    selectedSubunit,
    setSelectedSubunit,
  };
}
