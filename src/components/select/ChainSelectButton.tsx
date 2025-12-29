/**
 * A chain select button component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import GenericSelectButton from './GenericSelectButton';

/**
 * Props for the ChainSelectButton component.
 * @property disabled Whether the select button is disabled.
 * @property chainIds The array of chain IDs to select from.
 * @property selectedChainId The currently selected chain ID.
 * @property onSelect Callback function when a chain ID is selected.
 * @property label Optional label for the select button.
 */
export interface ChainSelectButtonProps {
	disabled: boolean;
	chainIds: string[];
	selectedChainId?: string;
	onSelect: (chainId: string) => void;
	label?: string;
}

/**
 * A select button for chains.
 * @param disabled Whether the select button is disabled.
 * @param chainIds The array of chain IDs to select from.
 * @param selectedChainId The currently selected chain ID.
 * @param onSelect Callback function when a chain ID is selected.
 * @param label Optional label for the select button.
 * @returns The ChainSelectButton component.
 */
const ChainSelectButton: React.FC<ChainSelectButtonProps> = ({
	disabled,
	chainIds,
	selectedChainId,
	onSelect,
	label
}) => (
	<GenericSelectButton
		label={label || 'Select Chain'}
		options={chainIds}
		selected={selectedChainId || ''}
		onSelect={onSelect}
		disabled={disabled}
		placeholder="Select a chain"
	/>
);

export default ChainSelectButton;
