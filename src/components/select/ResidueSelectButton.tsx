/**
 * A residue select button component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import GenericSelectButton from './GenericSelectButton';

/**
 * Props for the ResidueSelectButton component.
 * @property disabled Whether the select button is disabled.
 * @property residueIds The array of residue IDs to select from.
 * @property selectedResidueId The currently selected residue ID.
 * @property onSelect Callback function when a residue ID is selected.
 * @property label Optional label for the select button.
 */
export interface ResidueSelectButtonProps {
	disabled: boolean;
	residueIds: string[];
	selectedResidueId?: string;
	onSelect: (residueId: string) => void;
	label?: string;
}

/**
 * A select button for residues.
 * @param disabled Whether the select button is disabled.
 * @param residueIds The array of residue IDs to select from.
 * @param selectedResidueId The currently selected residue ID.
 * @param onSelect Callback function when a residue ID is selected.
 * @param label Optional label for the select button.
 * @returns The ResidueSelectButton component.
 */
const ResidueSelectButton: React.FC<ResidueSelectButtonProps> = ({
	disabled,
	residueIds,
	selectedResidueId,
	onSelect,
	label
}) => (
	<GenericSelectButton
		label={label || 'Select Residue'}
		options={residueIds}
		selected={selectedResidueId || ''}
		onSelect={onSelect}
		disabled={disabled}
		placeholder="Select a residue"
	/>
);

export default ResidueSelectButton;
