/**
 * A representation select button component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import GenericSelectButton from './GenericSelectButton';

/**
 * Props for the SelectButton component.
 * @property label The label for the select button.
 * @property options The array of string options to select from.
 * @property selected The currently selected option.
 * @property onSelect Callback function when an option is selected.
 * @property disabled Whether the select button is disabled.
 */
interface RepresentationSelectButtonProps {
	label?: string;
	options: string[];
	selected: string;
	onSelect: (option: string) => void;
	disabled?: boolean;
}

/**
 * A select button for representations.
 * @param label The label for the select button.
 * @param options The array of string options to select from.
 * @param selected The currently selected option.
 * @param onSelect Callback function when an option is selected.
 * @param disabled Whether the select button is disabled.
 * @returns The SelectButton component.
 */
const RepresentationSelectButton: React.FC<RepresentationSelectButtonProps> = ({ label = 'Select Representation', options, selected, onSelect, disabled }) => (
	<GenericSelectButton
		label={label}
		options={options}
		selected={selected}
		onSelect={onSelect}
		disabled={disabled}
		placeholder="Select a representation"
	/>
);

export default RepresentationSelectButton;
