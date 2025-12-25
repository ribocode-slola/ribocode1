/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useState } from 'react';

// Label for chain select button.
const chainSelectLabel = "Select Chain";

/**
 * Props for ChainSelectButton component.
 * @param disabled Whether the button is disabled.
 * @param chainIds Array of chain IDs to select from.
 * @param selectedChainId Currently selected chain ID.
 * @param onSelect Function to call when a chain ID is selected.
 * @param label Optional label for the button.
 */
export interface ChainSelectButtonProps {
  disabled: boolean;
  chainIds: string[];
  selectedChainId?: string;
  onSelect: (chainId: string) => void;
  label?: string;
}

/**
 * A button component to select a chain ID from a dropdown list.
 * @param disabled Whether the button is disabled.
 * @param chainIds Array of chain IDs to select from.
 * @param selectedChainId Currently selected chain ID.
 * @param onSelect Function to call when a chain ID is selected.
 * @param label Optional label for the button.
 * @returns The ChainSelectButton component.
 */
const ChainSelectButton: React.FC<ChainSelectButtonProps> = ({
  disabled,
  chainIds,
  selectedChainId,
  onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button disabled={disabled} onClick={() => setOpen((v) => !v)}>
        {chainSelectLabel}: {selectedChainId || 'None'}
      </button>
      {open && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1000,
            background: 'white',
            border: '1px solid #ccc',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            minWidth: '120px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {chainIds.map((id) => (
            <li
              key={id}
              style={{
                padding: '8px',
                background: id === selectedChainId ? '#e6f7ff' : undefined,
                cursor: 'pointer',
              }}
              onClick={() => {
                onSelect(id);
                setOpen(false);
              }}
            >
              {id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChainSelectButton;
