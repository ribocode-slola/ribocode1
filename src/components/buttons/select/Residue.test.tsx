/**
 * Test suite for ResidueSelectButton component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.1
 * @lastModified 2026-06-22
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResidueSelectButton from './Residue';
import { ResidueLabelInfo } from 'src/utils/residue';

describe('ResidueSelectButton', () => {
    const residueLabels = new Map<string, ResidueLabelInfo>([
        ['10', { id: '10', name: 'GLY 10', compId: 'GLY', seqNumber: 10, insCode: '' }],
        ['20', { id: '20', name: 'ALA 20', compId: 'ALA', seqNumber: 20, insCode: '' }],
        ['30', { id: '30', name: 'SER 30', compId: 'SER', seqNumber: 30, insCode: '' }],
    ]);

    it('renders with default label and option display names', () => {
        const { getByLabelText, getByText } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={residueLabels}
                selectedResidueId={''}
                onSelect={() => {}}
                id="test-residue-select"
            />
        );
        expect(getByLabelText('Select Residue')).toBeInTheDocument();
        expect(getByText('GLY 10')).toBeInTheDocument();
        expect(getByText('ALA 20')).toBeInTheDocument();
        expect(getByText('SER 30')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
        const { getByLabelText } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={residueLabels}
                selectedResidueId={''}
                onSelect={() => {}}
                label="Pick Residue"
                id="custom-residue-select"
            />
        );
        expect(getByLabelText('Pick Residue')).toBeInTheDocument();
    });

    it('shows selected residue by ID (not by name string)', () => {
        const { getByLabelText } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={residueLabels}
                selectedResidueId={'20'}
                onSelect={() => {}}
                id="select-residue-test"
            />
        );
        // The <select> value is now the residue ID, not the display name
        expect((getByLabelText('Select Residue') as HTMLSelectElement).value).toBe('20');
    });

    it('calls onSelect with residueId when option is chosen', () => {
        const onSelect = vi.fn();
        const { getByLabelText } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={residueLabels}
                selectedResidueId={''}
                onSelect={onSelect}
                id="test-residue-select-onselect"
            />
        );
        // Fire change with the residue ID as value (options use IDs as values)
        fireEvent.change(getByLabelText('Select Residue'), { target: { value: '30' } });
        expect(onSelect).toHaveBeenCalledWith('30');
    });

    it('is disabled when disabled prop is true', () => {
        const { getByLabelText } = render(
            <ResidueSelectButton
                disabled={true}
                residueLabels={residueLabels}
                selectedResidueId={''}
                onSelect={() => {}}
                id="test-residue-select-disabled"
            />
        );
        expect(getByLabelText('Select Residue')).toBeDisabled();
    });

    it('renders options in ascending sequence-number order', () => {
        // Provide residues in non-sorted order to verify sorting
        const unorderedLabels = new Map<string, ResidueLabelInfo>([
            ['30', { id: '30', name: 'SER 30', compId: 'SER', seqNumber: 30, insCode: '' }],
            ['10', { id: '10', name: 'GLY 10', compId: 'GLY', seqNumber: 10, insCode: '' }],
            ['20', { id: '20', name: 'ALA 20', compId: 'ALA', seqNumber: 20, insCode: '' }],
        ]);
        const { getAllByRole } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={unorderedLabels}
                selectedResidueId={''}
                onSelect={() => {}}
                id="residue-order-test"
            />
        );
        const options = getAllByRole('option').filter(o => (o as HTMLOptionElement).value !== '');
        expect(options.map(o => (o as HTMLOptionElement).value)).toEqual(['10', '20', '30']);
    });

    it('uses insertion code as secondary sort key', () => {
        const labelsWithInsCode = new Map<string, ResidueLabelInfo>([
            ['70B', { id: '70B', name: 'LEU 70B', compId: 'LEU', seqNumber: 70, insCode: 'B' }],
            ['70',  { id: '70',  name: 'LEU 70',  compId: 'LEU', seqNumber: 70, insCode: '' }],
            ['70A', { id: '70A', name: 'LEU 70A', compId: 'LEU', seqNumber: 70, insCode: 'A' }],
        ]);
        const { getAllByRole } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={labelsWithInsCode}
                selectedResidueId={''}
                onSelect={() => {}}
                id="residue-inscode-test"
            />
        );
        const options = getAllByRole('option').filter(o => (o as HTMLOptionElement).value !== '');
        expect(options.map(o => (o as HTMLOptionElement).value)).toEqual(['70', '70A', '70B']);
    });

    it('the select id matches the provided id prop', () => {
        const { getByLabelText } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={residueLabels}
                selectedResidueId={''}
                onSelect={() => {}}
                id="my-residue-id"
            />
        );
        expect((getByLabelText('Select Residue') as HTMLSelectElement).id).toBe('my-residue-id');
    });
});

