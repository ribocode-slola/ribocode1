/**
 * A subunit select button component for ribosome subunit selection (large/small).
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Copilot
 */
import React from 'react';
import GenericSelectButton from './GenericSelectButton';

/**
 * Types of ribosome subunits.
 */
export type RibosomeSubunitType = 'Large' | 'Small' | 'Neither';
export const RibosomeSubunitTypes: RibosomeSubunitType[] = ['Large', 'Small', 'Neither'];

/**
 * Props for the SubunitSelectButton component.
 * @property disabled Whether the select button is disabled.
 * @property selectedSubunit The currently selected subunit.
 * @property onSelect Callback function when a subunit is selected.
 * @property label Optional label for the select button.
 */
export interface SubunitSelectButtonProps {
    disabled: boolean;
    selectedSubunit?: RibosomeSubunitType;
    onSelect: (subunit: RibosomeSubunitType) => void;
    label?: string;
}

/**
 * A select button for ribosome subunits (large/small).
 * @param disabled Whether the select button is disabled.
 * @param selectedSubunit The currently selected subunit.
 * @param onSelect Callback function when a subunit is selected.
 * @param label Optional label for the select button.
 * @returns The SubunitSelectButton component.
 */
const SubunitSelectButton: React.FC<SubunitSelectButtonProps> = ({
    disabled,
    selectedSubunit,
    onSelect,
    label
}) => (
    <GenericSelectButton
        label={label || 'Select Subunit'}
        options={RibosomeSubunitTypes}
        selected={selectedSubunit || ''}
        onSelect={(value: string) => onSelect(value as RibosomeSubunitType)}
        disabled={disabled}
        placeholder="Select a Subunit"
    />
);

export default SubunitSelectButton;
