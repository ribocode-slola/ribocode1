/**
 * Test suite for ChainSelectButton component.
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
import ChainSelectButton from './Chain';


describe('ChainSelectButton', () => {
    const chainLabels = new Map([
        ['A', 'Chain A'],
        ['B', 'Chain B'],
        ['C', 'Chain C']
    ]);

    it('renders with default label and options', () => {
        const { getByLabelText, getByText, getByRole } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={() => {}}
                id="test-chain-select"
            />
        );
        expect(getByLabelText('Select Chain')).toBeInTheDocument();
        expect(getByText('Chain A')).toBeInTheDocument();
        expect(getByText('Chain B')).toBeInTheDocument();
        expect(getByText('Chain C')).toBeInTheDocument();
        // Check id is present
        expect(getByRole('combobox', { name: 'Select Chain' }).id).toBe('test-chain-select');
    });

    it('renders with custom label', () => {
        const { getByLabelText, getByRole } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={() => {}}
                label="Pick Chain"
                id="custom-chain-select"
            />
        );
        expect(getByLabelText('Pick Chain')).toBeInTheDocument();
        // Check id is present
        expect(getByRole('combobox', { name: 'Pick Chain' }).id).toBe('custom-chain-select');
    });

    it('shows selected chain label', () => {
        const { getByLabelText } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={'B'}
                onSelect={() => {}}
                id="select-chain-test"
            />
        );
        expect((getByLabelText('Select Chain') as HTMLSelectElement).value).toBe('B');
        // Check id is present
        expect((getByLabelText('Select Chain') as HTMLSelectElement).id).toBe('select-chain-test');
    });

    it('calls onSelect with chainId when option is chosen', () => {
        const onSelect = vi.fn();
        const { getByLabelText } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={onSelect}
                id="test-chain-select-onselect"
            />
        );
        fireEvent.change(getByLabelText('Select Chain'), { target: { value: 'C' } });
        expect(onSelect).toHaveBeenCalledWith('C');
    });

    it('is disabled when disabled prop is true', () => {
        const { getByLabelText } = render(
            <ChainSelectButton
                disabled={true}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={() => {}}
                id="test-chain-select-disabled"
            />
        );
        expect(getByLabelText('Select Chain')).toBeDisabled();
    });

    it('renders chain codes instead of numbers when provided', () => {
        // Simulate a structure with chain codes
        const chainLabels = new Map([
            ['A', 'Alpha'],
            ['B', 'Beta'],
            ['C', 'Gamma']
        ]);
        const { getByText } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={() => {}}
                id="chain-codes-test"
            />
        );
        expect(getByText('Alpha')).toBeInTheDocument();
        expect(getByText('Beta')).toBeInTheDocument();
        expect(getByText('Gamma')).toBeInTheDocument();
    });

    it('renders numbers as labels if only numbers are provided', () => {
        // Simulate a structure with only numbers as chain labels
        const chainLabels = new Map([
            ['1', '1'],
            ['2', '2']
        ]);
        const { getByText } = render(
            <ChainSelectButton
                disabled={false}
                chainLabels={chainLabels}
                selectedChainId={''}
                onSelect={() => {}}
                id="chain-numbers-test"
            />
        );
        expect(getByText('1')).toBeInTheDocument();
        expect(getByText('2')).toBeInTheDocument();
    });
});
