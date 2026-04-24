/**
 * Test suite for SubunitSelectButton component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubunitSelectButton from './Subunit';
import { RibosomeSubunitTypes, RibosomeSubunitType } from '../../../utils/subunit';

describe('SubunitSelectButton', () => {
    it('renders with default label and all subunit options', () => {
        const { getByLabelText, getByText } = render(
                <SubunitSelectButton
                    disabled={false}
                    selectedSubunit={undefined}
                    onSelect={() => {}}
                />
        );
        expect(getByLabelText('Select Subunit')).toBeInTheDocument();
        RibosomeSubunitTypes.forEach(opt => {
            expect(getByText(opt)).toBeInTheDocument();
        });
    });

    it('renders with custom label', () => {
        const { getByLabelText } = render(
                <SubunitSelectButton
                    disabled={false}
                    selectedSubunit={undefined}
                    onSelect={() => {}}
                    label="Pick Subunit"
                />
        );
        expect(getByLabelText('Pick Subunit')).toBeInTheDocument();
    });

    it('shows selected subunit', () => {
        const { getByLabelText } = render(
            <SubunitSelectButton
                disabled={false}
                selectedSubunit={'Large'}
                onSelect={() => {}}
            />
        );
        expect((getByLabelText('Select Subunit') as HTMLSelectElement).value).toBe('Large');
    });

    it('calls onSelect with subunit when option is chosen', () => {
        const onSelect = vi.fn();
        const { getByLabelText } = render(
                <SubunitSelectButton
                    disabled={false}
                    selectedSubunit={undefined}
                    onSelect={onSelect}
                />
        );
        fireEvent.change(getByLabelText('Select Subunit'), { target: { value: 'Small' } });
        expect(onSelect).toHaveBeenCalledWith('Small');
    });

    it('is disabled when disabled prop is true', () => {
        const { getByLabelText } = render(
            <SubunitSelectButton
                disabled={true}
                selectedSubunit={undefined}
                onSelect={() => {}}
            />
        );
        expect(getByLabelText('Select Subunit')).toBeDisabled();
    });
});
