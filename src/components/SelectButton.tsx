

import React from 'react';

const selectLabelDefault = "Select Representation";

interface SelectButtonProps {
    label?: string;
    options: string[];
    selected: string;
    onSelect: (option: string) => void;
    disabled?: boolean;
}

const SelectButton: React.FC<SelectButtonProps> = ({ label = selectLabelDefault, options, selected, onSelect, disabled }) => (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5em' }}>
        {label}:
        <select
            className="msp-select msp-form-control"
            value={selected}
            onChange={e => onSelect(e.target.value)}
            disabled={disabled}
        >
            {options.map(option => (
                <option key={option} value={option}>
                    {option.replace(/-/g, ' ')}
                </option>
            ))}
        </select>
    </label>
);

export default SelectButton;
