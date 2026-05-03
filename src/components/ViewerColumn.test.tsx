
/**
 * Test suite for ViewerColumn component.
 *
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import ViewerColumn, { idSuffix as viewerColumnIdSuffix } from './ViewerColumn';
import { idSuffix as moleculeIdSuffix } from './Molecule';

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
// Minimal valid props for MoleculeUI
const minimalMoleculeUIProps = {
    label: 'Test Molecule',
    plugin: null,
    isVisible: true,
    onToggleVisibility: vi.fn(),
    chainZoomLabel: 'A',
    onChainZoom: vi.fn(),
    chainZoomDisabled: false,
    residueZoomLabel: '1',
    onResidueZoom: vi.fn(),
    residueZoomDisabled: false,
    isLoaded: true,
    forceUpdate: vi.fn(),
    representationRefs: [],
};
const moleculeUIAlignedToProps = { ...minimalMoleculeUIProps, label: 'MoleculeUI AlignedTo' };
const moleculeUIAlignedProps = { ...minimalMoleculeUIProps, label: 'MoleculeUI Aligned' };
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
        // The idPrefix logic in ViewerColumn composes viewerIdPrefix = `${idPrefix}-${viewerColumnIdSuffix}-${viewerKey}`
        const rootIdPrefix = `viewer-A-viewer-column-A`;
        const alignedToLabel = 'MoleculeUI AlignedTo';
        const alignedLabel = 'MoleculeUI Aligned';
        render(
            <ViewerColumn
                viewerKey="A"
                loadDataRowProps={loadDataRowProps}
                moleculeUIAlignedToProps={{ ...moleculeUIAlignedToProps, label: alignedToLabel }}
                moleculeUIAlignedProps={{ ...moleculeUIAlignedProps, label: alignedLabel }}
                realignedMoleculeListProps={realignedMoleculeListProps}
                molstarContainerProps={molstarContainerProps}
                idPrefix={"viewer-A"}
            />
        );
        // The id construction matches MoleculeUI: `${idPrefix}-${moleculeIdSuffix}-${label.replace(/\s+/g, '-').toLowerCase()}`
        const alignedToId = `${rootIdPrefix}-${moleculeIdSuffix}-${alignedToLabel.replace(/\s+/g, '-').toLowerCase()}`;
        const alignedId = `${rootIdPrefix}-${moleculeIdSuffix}-${alignedLabel.replace(/\s+/g, '-').toLowerCase()}`;
        const alignedTo = document.getElementById(alignedToId);
        const aligned = document.getElementById(alignedId);
        // Debug: log the DOM and ids
        // eslint-disable-next-line no-console
        console.log('alignedToId', alignedToId, 'alignedId', alignedId);
        // eslint-disable-next-line no-console
        console.log('container.innerHTML:', document.body.innerHTML);
        expect(alignedTo).toBeInTheDocument();
        expect(aligned).toBeInTheDocument();
    });

    it('applies idPrefix to root and propagates to RibocodeViewer', () => {
        const idPrefix = 'test-root';
        render(
            <ViewerColumn
                viewerKey="A"
                loadDataRowProps={loadDataRowProps}
                moleculeUIAlignedToProps={moleculeUIAlignedToProps}
                moleculeUIAlignedProps={moleculeUIAlignedProps}
                realignedMoleculeListProps={realignedMoleculeListProps}
                molstarContainerProps={molstarContainerProps}
                idPrefix={idPrefix}
            />
        );
        // Root div id
        const root = document.getElementById(`${idPrefix}-${viewerColumnIdSuffix}-A`);
        expect(root).toBeInTheDocument();
        // RibocodeViewer id
        const ribocodeViewer = document.getElementById(`${idPrefix}-${viewerColumnIdSuffix}-A-ribocode-viewer`);
        expect(ribocodeViewer).toBeInTheDocument();
    });
});