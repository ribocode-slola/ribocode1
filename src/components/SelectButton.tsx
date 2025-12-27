
import React, { useState } from 'react';

const selectLabelDefault = "Select Representation";

interface SelectButtonProps {
    label?: string;
    options: string[];
    selected: string;
    onSelect: (option: string) => void;
    disabled?: boolean;
}

const SelectButton: React.FC<SelectButtonProps> = ({ label = selectLabelDefault, options, selected, onSelect, disabled }) => {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button disabled={disabled} onClick={() => setOpen((v) => !v)}>
                {label}: {selected.replace(/-/g, ' ')}
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
                        minWidth: '160px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                    }}
                >
                    {options.map((option) => (
                        <li
                            key={option}
                            style={{
                                padding: '8px',
                                background: option === selected ? '#e6f7ff' : undefined,
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                onSelect(option);
                                setOpen(false);
                            }}
                        >
                            {option.replace(/-/g, ' ')}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SelectButton;
