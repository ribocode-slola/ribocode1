/**
 * Custom React hook for managing chain state, including chain labels and selected chain ID.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { useState } from 'react';

// Define the shape of the chain information state
export interface ChainInfo {
  chainLabels: Map<string, string>;
}

/**
 * Custom React hook for managing chain state.
 * @param initialSelected The initial selected chain ID, default is an empty string.
 * @returns An object containing chainInfo, setChainInfo, selectedChainId, and setSelectedChainId.
 */
export function useChainState(initialSelected: string = '') {
  const [chainInfo, setChainInfo] = useState<ChainInfo>({ chainLabels: new Map() });
  const [selectedChainId, setSelectedChainId] = useState<string>(initialSelected);
  return {
    chainInfo,
    setChainInfo,
    selectedChainId,
    setSelectedChainId,
  };
}
