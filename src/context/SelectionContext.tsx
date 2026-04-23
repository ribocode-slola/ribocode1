/**
 * React context for managing selection state in Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SelectionState {
  selectedChainId: string;
  setSelectedChainId: (id: string) => void;
  selectedResidueId: string;
  setSelectedResidueId: (id: string) => void;
  selectedSubunit: string;
  setSelectedSubunit: (id: string) => void;
}

const SelectionContext = createContext<SelectionState | undefined>(undefined);

export const SelectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedChainId, setSelectedChainId] = useState('');
  const [selectedResidueId, setSelectedResidueId] = useState('');
  const [selectedSubunit, setSelectedSubunit] = useState('All');

  return (
    <SelectionContext.Provider value={{
      selectedChainId,
      setSelectedChainId,
      selectedResidueId,
      setSelectedResidueId,
      selectedSubunit,
      setSelectedSubunit,
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) throw new Error('useSelection must be used within a SelectionProvider');
  return context;
};
