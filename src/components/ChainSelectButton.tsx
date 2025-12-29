/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */

import React from 'react';

const chainSelectLabel = "Select Chain";

export interface ChainSelectButtonProps {
  disabled: boolean;
  chainIds: string[];
  selectedChainId?: string;
  onSelect: (chainId: string) => void;
  label?: string;
}

const ChainSelectButton: React.FC<ChainSelectButtonProps> = ({
  disabled,
  chainIds,
  selectedChainId,
  onSelect,
  label
}) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5em' }}>
    {label || chainSelectLabel}:
    <select
      className="msp-select msp-form-control"
      value={selectedChainId || ''}
      onChange={e => onSelect(e.target.value)}
      disabled={disabled}
    >
      <option value="" disabled>Select a chain</option>
      {chainIds.map(id => (
        <option key={id} value={id}>{id}</option>
      ))}
    </select>
  </label>
);

export default ChainSelectButton;
