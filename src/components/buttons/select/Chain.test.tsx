import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChainSelectButton from './Chain';

describe('ChainSelectButton', () => {
    const chainLabels = new Map([
        ['A', 'Chain A'],
        ['B', 'Chain B'],
        ['C', 'Chain C']
    ]);

    it('renders with default label and options', () => {
        const { getByLabelText, getByText } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={() => {}}
            />
        );
        expect(getByLabelText('Select Chain')).toBeInTheDocument();
        expect(getByText('Chain A')).toBeInTheDocument();
        expect(getByText('Chain B')).toBeInTheDocument();
        expect(getByText('Chain C')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
        const { getByLabelText } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={() => {}}
                label="Pick Chain"
            />
        );
        expect(getByLabelText('Pick Chain')).toBeInTheDocument();
    });

    it('shows selected chain label', () => {
        const { getByLabelText } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={'B'}
                onSelect={() => {}}
            />
        );
        expect((getByLabelText('Select Chain') as HTMLSelectElement).value).toBe('Chain B');
    });

    it('calls onSelect with chainId when option is chosen', () => {
        const onSelect = vi.fn();
        const { getByLabelText } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={onSelect}
            />
        );
        fireEvent.change(getByLabelText('Select Chain'), { target: { value: 'Chain C' } });
        expect(onSelect).toHaveBeenCalledWith('C');
    });

    it('is disabled when disabled prop is true', () => {
        const { getByLabelText } = render(
            <ChainSelectButton
                disabled={true}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={() => {}}
            />
        );
        expect(getByLabelText('Select Chain')).toBeDisabled();
    });
});
