import React from 'react';
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

    it('renders with default label and options', () => {
        const { getByLabelText, getByText } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={residueLabels}
                selectedResidueId={''}
                onSelect={() => {}}
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
            />
        );
        expect(getByLabelText('Pick Residue')).toBeInTheDocument();
    });

    it('shows selected residue label', () => {
        const { getByLabelText } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={residueLabels}
                selectedResidueId={'20'}
                onSelect={() => {}}
            />
        );
        expect((getByLabelText('Select Residue') as HTMLSelectElement).value).toBe('ALA 20');
    });

    it('calls onSelect with residueId when option is chosen', () => {
        const onSelect = vi.fn();
        const { getByLabelText } = render(
            <ResidueSelectButton
                disabled={false}
                residueLabels={residueLabels}
                selectedResidueId={''}
                onSelect={onSelect}
            />
        );
        fireEvent.change(getByLabelText('Select Residue'), { target: { value: 'SER 30' } });
        expect(onSelect).toHaveBeenCalledWith('30');
    });

    it('is disabled when disabled prop is true', () => {
        const { getByLabelText } = render(
            <ResidueSelectButton
                disabled={true}
                residueLabels={residueLabels}
                selectedResidueId={''}
                onSelect={() => {}}
            />
        );
        expect(getByLabelText('Select Residue')).toBeDisabled();
    });
});
