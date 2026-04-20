import { vi } from 'vitest';
// ...existing code...
import React from 'react';
import { render, screen } from '@testing-library/react';
import RealignedMoleculeList from './RealignedMoleculeList';

describe('RealignedMoleculeList', () => {
    it('renders MoleculeUI for each molecule', () => {
        const molecules = [
            { id: '1', label: 'Mol 1' },
            { id: '2', label: 'Mol 2' },
        ];
        const molstar = {
            pluginRef: { current: {} },
            representationRefs: { '1': ['ref1'], '2': ['ref2'] },
        };
        const realignedStructRefs = {};
        const setRealignedMolecules = vi.fn();
        const setRealignedRepRefs = vi.fn();
        const setRealignedStructRefs = vi.fn();
        const forceUpdate = vi.fn();

        const chainInfo = { chainLabels: new Map([['1', 'Chain 1'], ['2', 'Chain 2']]) };
        const residueInfo = { residueLabels: new Map([['res1', { name: 'Residue 1' }], ['res2', { name: 'Residue 2' }]]) };
        render(
            <RealignedMoleculeList
                molecules={molecules}
                molstar={molstar}
                chainInfo={chainInfo}
                residueInfo={residueInfo}
                selectedResidueId={''}
                realignedStructRefs={realignedStructRefs}
                setRealignedMolecules={setRealignedMolecules}
                setRealignedRepRefs={setRealignedRepRefs}
                setRealignedStructRefs={setRealignedStructRefs}
                forceUpdate={forceUpdate}
                viewerKey="A"
                otherMolstar={molstar}
                otherRealignedStructRefs={{}}
                setOtherRealignedMolecules={setRealignedMolecules}
                setOtherRealignedRepRefs={setRealignedRepRefs}
                setOtherRealignedStructRefs={setRealignedStructRefs}
            />
        );

        expect(screen.getByText('Mol 1')).toBeInTheDocument();
        expect(screen.getByText('Mol 2')).toBeInTheDocument();
    });
});
