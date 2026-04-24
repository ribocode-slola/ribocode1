
/**
 * Test suite for ViewerColumn component.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import ViewerColumn from './ViewerColumn';

// Mock props for ViewerColumn
const loadDataRowProps = {
    representationType: 'spacefill',
    onRepresentationTypeChange: vi.fn(),
    representationTypeDisabled: false,
    onAddColorsClick: vi.fn(),
    addColorsDisabled: false,
    selectedSubunit: 'All',
    onSelectSubunit: vi.fn(),
    subunitSelectDisabled: false,
    chainInfo: { chainLabels: new Map() },
    selectedChainId: '',
    onSelectChainId: vi.fn(),
    chainSelectDisabled: false,
    residueInfo: { residueLabels: new Map(), residueToAtomIds: {} },
    selectedResidueId: '',
    onSelectResidueId: vi.fn(),
    residueSelectDisabled: false,
    onAddRepresentationClick: vi.fn(),
    addRepresentationDisabled: false,
    fogEnabled: false,
    fogNear: 0.5,
    fogFar: 2.0,
    onFogEnabledChange: vi.fn(),
    onFogNearChange: vi.fn(),
    onFogFarChange: vi.fn(),
    cameraNear: 0.1,
    cameraFar: 100,
    onCameraNearChange: vi.fn(),
    onCameraFarChange: vi.fn(),
};
const moleculeUIAlignedToProps = { label: 'MoleculeUI AlignedTo' };
const moleculeUIAlignedProps = { label: 'MoleculeUI Aligned' };
const realignedMoleculeListProps = {
    molecules: [],
    molstar: { pluginRef: { current: null }, representationRefs: {}, repIdMap: {} },
    chainInfo: { chainLabels: new Map() },
    residueInfo: { residueLabels: new Map() },
    selectedResidueId: '',
    realignedStructRefs: {},
    setRealignedMolecules: vi.fn(),
    setRealignedRepRefs: vi.fn(),
    setRealignedStructRefs: vi.fn(),
    forceUpdate: vi.fn(),
    viewerKey: 'A',
    otherMolstar: { pluginRef: { current: null }, representationRefs: {}, repIdMap: {} },
    otherRealignedStructRefs: {},
    setOtherRealignedMolecules: vi.fn(),
    setOtherRealignedRepRefs: vi.fn(),
    setOtherRealignedStructRefs: vi.fn(),
};
const molstarContainerProps = {};

describe('ViewerColumn', () => {
    it('renders all subcomponents with minimal valid props', () => {
        const { getByText } = render(
            <ViewerColumn
                viewerKey="A"
                loadDataRowProps={loadDataRowProps}
                moleculeUIAlignedToProps={moleculeUIAlignedToProps}
                moleculeUIAlignedProps={moleculeUIAlignedProps}
                realignedMoleculeListProps={realignedMoleculeListProps}
                molstarContainerProps={molstarContainerProps}
            />
        );
        expect(getByText('MoleculeUI AlignedTo')).toBeInTheDocument();
        expect(getByText('MoleculeUI Aligned')).toBeInTheDocument();
    });
});