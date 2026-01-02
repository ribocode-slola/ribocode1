/**
 * A chain select button component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import GenericSelectButton from './Select';

/**
 * Props for the ChainSelectButton component.
 * @property disabled Whether the select button is disabled.
 * @property chainLabels The map of chain IDs to labels to select from.
 * @property selectedChainId The currently selected chain ID.
 * @property onSelect Callback function when a chain ID is selected.
 * @property label Optional label for the select button.
 */
export interface ChainSelectButtonProps {
	disabled: boolean;
	chainLabels: Map<string, string>;
	selectedChainId?: string;
	onSelect: (chainId: string) => void;
	label?: string;
}

/**
 * A select button for chains.
 * @param disabled Whether the select button is disabled.
 * @param chainLabels The map of chain IDs to labels to select from.
 * @param selectedChainId The currently selected chain ID.
 * @param onSelect Callback function when a chain ID is selected.
 * @param label Optional label for the select button.
 * @returns The ChainSelectButton component.
 */
const ChainSelectButton: React.FC<ChainSelectButtonProps> = ({
	disabled,
	chainLabels,
	selectedChainId,
	onSelect,
	label
}) => {
	// Map selectedChainId to its label value
	const selectedLabel = selectedChainId ? chainLabels.get(selectedChainId) || '' : '';
	// When a label is selected, find the corresponding chainId
	const handleSelect = (selectedLabel: string) => {
		for (const [id, labelValue] of chainLabels.entries()) {
			if (labelValue === selectedLabel) {
				onSelect(id);
				break;
			}
		}
	};
	return (
		<GenericSelectButton
			label={label || 'Select Chain'}
			options={Array.from(chainLabels.values())}
			selected={selectedLabel}
			onSelect={handleSelect}
			disabled={disabled}
		/>
	);
};

export default ChainSelectButton;
