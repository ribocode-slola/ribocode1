/**
 * A chain select button component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React from 'react';
import GenericSelectButton, { idSuffix as selectIdSuffix } from './Select';

/**
 * Props for the ChainSelectButton component.
 * @property disabled Whether the select button is disabled.
 * @property chainLabels The map of chain IDs to labels to select from.
 * @property selectedChainId The currently selected chain ID.
 * @property onSelect Callback function when a chain ID is selected.
 * @property label Optional label for the select button.
 * @property id Required id for the select button.
 */
export interface ChainSelectButtonProps {
	disabled: boolean;
	chainLabels: Map<string, string>;
	selectedChainId?: string;
	onSelect: (chainId: string) => void;
	label?: string;
	id: string;
}

/**
 * A select button for chains.
 * @param disabled Whether the select button is disabled.
 * @param chainLabels The map of chain IDs to labels to select from.
 * @param selectedChainId The currently selected chain ID.
 * @param onSelect Callback function when a chain ID is selected.
 * @param label Optional label for the select button.
 * @param id Required id for the select button.
 * @returns The ChainSelectButton component.
 */
const ChainSelectButton: React.FC<ChainSelectButtonProps> = ({
	disabled,
	chainLabels,
	selectedChainId,
	onSelect,
	label,
	id
}) => {
	// Map selectedChainId to its label value
	const selectedLabel = selectedChainId ? chainLabels.get(selectedChainId) || '' : '';
	// Order chainLabels by chainId
	const orderedEntries = Array.from(chainLabels.entries()).sort(([idA], [idB]) => {
		if (idA < idB) return -1;
		if (idA > idB) return 1;
		return 0;
	});
	const orderedOptions = orderedEntries.map(([_, labelValue]) => labelValue);
	// When a label is selected, find the corresponding chainId
	const handleSelect = (selectedLabel: string) => {
		for (const [chainId, labelValue] of orderedEntries) {
			if (labelValue === selectedLabel) {
				onSelect(chainId);
				break;
			}
		}
	};
	return (
		<GenericSelectButton
			label={label || 'Select Chain'}
			options={orderedOptions}
			selected={selectedLabel}
			onSelect={handleSelect}
			disabled={disabled}
			id={id ?? selectIdSuffix}
		/>
	);
};

export default ChainSelectButton;
