import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubunitSelectButton from './Subunit';
import { RibosomeSubunitTypes, RibosomeSubunitType } from '../../../utils/subunit';

describe('SubunitSelectButton', () => {
    it('renders with default label and all subunit options', () => {
        const { getByLabelText, getByText } = render(
            <SubunitSelectButton
                disabled={false}
                selectedSubunit={''}
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
                selectedSubunit={''}
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
        expect(getByLabelText('Select Subunit').value).toBe('Large');
    });

    it('calls onSelect with subunit when option is chosen', () => {
        const onSelect = jest.fn();
        const { getByLabelText } = render(
            <SubunitSelectButton
                disabled={false}
                selectedSubunit={''}
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
                selectedSubunit={''}
                onSelect={() => {}}
            />
        );
        expect(getByLabelText('Select Subunit')).toBeDisabled();
    });
});
