/**
 * A residue select button component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import GenericSelectButton from './Select';
import { ResidueLabelInfo } from 'src/utils/Residue';

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
	residueLabels: Map<string, ResidueLabelInfo>;
	selectedResidueId?: string;
	onSelect: (residueId: string) => void;
	label?: string;
}

/**
 * A select button for residues.
 * @param disabled Whether the select button is disabled.
 * @param residueLabels The map of residue IDs to labels to select from.
 * @param selectedResidueId The currently selected residue ID.
 * @param onSelect Callback function when a residue ID is selected.
 * @param label Optional label for the select button.
 * @returns The ResidueSelectButton component.
 */
const ResidueSelectButton: React.FC<ResidueSelectButtonProps> = ({
	disabled,
	residueLabels,
	selectedResidueId,
	onSelect,
	label
}) => {
	// Map selectedResidueId to its label value
	const selectedLabel = selectedResidueId ? residueLabels.get(String(selectedResidueId).trim())?.name || '' : '';
	// When a label is selected, find the corresponding residueId (as trimmed string)
	const handleSelect = (selectedLabel: string) => {
		for (const [id, info] of residueLabels.entries()) {
			if (info.name === selectedLabel) {
				onSelect(String(id).trim());
				break;
			}
		}
	};
	return (
		<GenericSelectButton
			label={label || 'Select Residue'}
			options={Array.from(residueLabels.values()).map(info => info.name)}
			selected={selectedLabel}
			onSelect={handleSelect}
			disabled={disabled}
		/>
	);
};

export default ResidueSelectButton;
