import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RepresentationSelectButton, { allowedRepresentationTypes } from './Representation';

describe('RepresentationSelectButton', () => {
    it('renders with default label and allowed options', () => {
        const { getByLabelText, getByText } = render(
            <RepresentationSelectButton
                options={allowedRepresentationTypes as string[]}
                selected=""
                onSelect={() => {}}
            />
        );
        expect(getByLabelText('Select Representation')).toBeInTheDocument();
        allowedRepresentationTypes.forEach(opt => {
            expect(getByText(opt)).toBeInTheDocument();
        });
    });

    it('renders with custom label', () => {
        const { getByLabelText } = render(
            <RepresentationSelectButton
                label="Rep Type"
                options={['cartoon', 'line']}
                selected="cartoon"
                onSelect={() => {}}
            />
        );
        expect(getByLabelText('Rep Type')).toBeInTheDocument();
    });

    it('calls onSelect when option is chosen', () => {
        const onSelect = jest.fn();
        const { getByLabelText } = render(
            <RepresentationSelectButton
                options={['cartoon', 'line']}
                selected="cartoon"
                onSelect={onSelect}
            />
        );
        fireEvent.change(getByLabelText('Select Representation'), { target: { value: 'line' } });
        expect(onSelect).toHaveBeenCalledWith('line');
    });

    it('is disabled when disabled prop is true', () => {
        const { getByLabelText } = render(
            <RepresentationSelectButton
                options={['cartoon']}
                selected="cartoon"
                onSelect={() => {}}
                disabled
            />
        );
        expect(getByLabelText('Select Representation')).toBeDisabled();
    });
});
