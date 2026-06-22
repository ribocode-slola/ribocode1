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
import { idSuffix as selectIdSuffix } from './Select';

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
	// Order chain labels by display label first (e.g. family name), then chainId.
	const orderedEntries = Array.from(chainLabels.entries()).sort(([idA, labelA], [idB, labelB]) => {
		const byLabel = labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' });
		if (byLabel !== 0) return byLabel;
		return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
	});
	return (
		<label>
			{label || 'Select Chain'}
			<select
				className="msp-select msp-form-control"
				value={selectedChainId ?? ''}
				onChange={e => onSelect(e.target.value)}
				disabled={disabled}
				id={id ?? selectIdSuffix}
			>
				<option value="" disabled>...</option>
				{orderedEntries.map(([chainId, labelValue]) => (
					<option key={chainId} value={chainId}>{labelValue}</option>
				))}
			</select>
		</label>
	);
};

export default ChainSelectButton;
