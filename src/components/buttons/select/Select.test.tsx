/**
 * Test suite for GenericSelectButton component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GenericSelectButton from './Select';

describe('GenericSelectButton', () => {
    it('renders label and options', () => {
        const { getByLabelText, getByText } = render(
            <GenericSelectButton
                label="Choose"
                options={["A", "B", "C"]}
                selected=""
                onSelect={() => {}}
            />
        );
        expect(getByLabelText('Choose')).toBeInTheDocument();
        expect(getByText('A')).toBeInTheDocument();
        expect(getByText('B')).toBeInTheDocument();
        expect(getByText('C')).toBeInTheDocument();
    });

    it('shows placeholder when nothing selected', () => {
        const { getByText } = render(
            <GenericSelectButton
                label="Pick"
                options={["X", "Y"]}
                selected=""
                onSelect={() => {}}
                placeholder="Select one"
            />
        );
        expect(getByText('Select one')).toBeInTheDocument();
    });

    it('calls onSelect when option is chosen', () => {
        const onSelect = vi.fn();
        const { getByLabelText } = render(
            <GenericSelectButton
                label="Pick"
                options={["X", "Y"]}
                selected=""
                onSelect={onSelect}
            />
        );
        fireEvent.change(getByLabelText('Pick'), { target: { value: 'Y' } });
        expect(onSelect).toHaveBeenCalledWith('Y');
    });

    it('is disabled when disabled prop is true', () => {
        const { getByLabelText } = render(
            <GenericSelectButton
                label="Pick"
                options={["X"]}
                selected=""
                onSelect={() => {}}
                disabled
            />
        );
        expect(getByLabelText('Pick')).toBeDisabled();
    });
});
