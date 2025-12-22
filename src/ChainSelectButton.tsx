import React, { useState } from 'react';

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
  label = 'Select Chain',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button disabled={disabled} onClick={() => setOpen((v) => !v)}>
        {label}: {selectedChainId || 'None'}
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
