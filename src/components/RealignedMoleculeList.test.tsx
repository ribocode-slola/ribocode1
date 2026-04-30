/**
 * Test suite for RealignedMoleculeList component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';import { render, screen } from '@testing-library/react';
import RealignedMoleculeList, { idSuffix as realignedMoleculeListIdSuffix } from './RealignedMoleculeList';

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

    it('applies idPrefix to root div and MoleculeUI', () => {
        const molecules = [
            { id: '1', label: 'Mol 1' },
        ];
        const molstar = {
            pluginRef: { current: {} },
            representationRefs: { '1': ['ref1'] },
        };
        const realignedStructRefs = {};
        const setRealignedMolecules = vi.fn();
        const setRealignedRepRefs = vi.fn();
        const setRealignedStructRefs = vi.fn();
        const forceUpdate = vi.fn();
        const chainInfo = { chainLabels: new Map([['1', 'Chain 1']]) };
        const residueInfo = { residueLabels: new Map([['res1', { name: 'Residue 1' }]]) };
        const idPrefix = 'test-list';
        const { container } = render(
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
                idPrefix={idPrefix}
            />
        );
        // Root div
        const root = container.querySelector(`#test-list-${realignedMoleculeListIdSuffix}`);
        expect(root).toBeInTheDocument();
        // MoleculeUI
        const molUI = container.querySelector('#test-list-realigned-1-moleculeui-mol-1');
        expect(molUI).toBeInTheDocument();
    });
});
