/**
 * Test suite for AlignedViewersPanel component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { render } from '@testing-library/react';
import AlignedViewersPanel from './AlignedViewersPanel';
import { ViewerKey } from './RibocodeViewer';

// Minimal mock viewer object
const minimalViewerA = {
  moleculeAligned: undefined,
  moleculeAlignedTo: undefined,
  ref: { current: null },
  viewerKey: 'A' as ViewerKey,
  handleFileInputButtonClick: () => {},
};

const minimalViewerB = {
  ...minimalViewerA,
  viewerKey: 'B' as ViewerKey,
};

const minimalMolstar = {};

const minimalMoleculeUIPropsA = {
  molstar: minimalMolstar,
  otherMolstar: minimalMolstar,
  viewer: minimalViewerA,
  isVisible: false,
  onToggleVisibility: () => {},
  chainZoomLabel: '',
  onChainZoom: () => {},
  chainZoomDisabled: false,
  residueZoomLabel: '',
  onResidueZoom: () => {},
  residueZoomDisabled: false,
  isLoaded: false,
  forceUpdate: () => {},
  representationRefs: [],
  syncEnabled: false,
  deleteRepresentation: () => {},
  repIdMap: {},
  AlignedTo: '',
};

const minimalMoleculeUIPropsB = {
  ...minimalMoleculeUIPropsA,
  viewer: minimalViewerB,
};

const mockColorsFile = { handleButtonClick: () => {} };

const mockLoadDataRowPropsA = {
  viewer: minimalViewerA,
  otherViewer: minimalViewerB,
  molstar: {},
  otherMolstar: {},
  realignedStructRefs: {},
  otherRealignedStructRefs: {},
  isMoleculeAlignedLoaded: false,
  isMoleculeAlignedToLoaded: false,
  viewerReady: false,
  otherViewerReady: false,
  representationType: '',
  setRepresentationType: () => {},
  colorsFile: mockColorsFile,
  isMoleculeColoursLoaded: false,
  structureRef: {},
  otherStructureRef: {},
  selectedSubunit: null,
  setSelectedSubunit: () => {},
  subunitToChainIds: new Map(),
  chainInfo: { chainLabels: new Map() },
  selectedChainId: null,
  setSelectedChainId: () => {},
  residueInfo: { residueLabels: new Map(), residueToAtomIds: {} },
  selectedResidueId: null,
  setSelectedResidueId: () => {},
  fog: { enabled: false, near: 0, far: 0 },
  setFog: { setEnabled: () => {}, setNear: () => {}, setFar: () => {} },
  camera: { near: 0, far: 0 },
  setCamera: { setNear: () => {}, setFar: () => {} },
  updateFog: () => {},
  handleFileChange: () => {},
  Aligned: '',
  allowedRepresentationTypes: [],
  syncEnabled: false,
  realignedRepRefs: {},
  setRealignedRepRefs: () => {},
  setRealignedStructRefs: () => {},
};

const mockLoadDataRowPropsB = {
  ...mockLoadDataRowPropsA,
  viewer: minimalViewerB,
  otherViewer: minimalViewerA,
};

const minimalRealignedMoleculeListProps = {
  molecules: [],
  molstar: {},
  chainInfo: { chainLabels: new Map() },
  residueInfo: { residueLabels: new Map() },
  selectedResidueId: null,
  realignedStructRefs: {},
  setRealignedMolecules: () => {},
  setRealignedRepRefs: () => {},
  setRealignedStructRefs: () => {},
  forceUpdate: () => {},
  viewerKey: 'A',
  otherMolstar: {},
  otherRealignedStructRefs: {},
  setOtherRealignedMolecules: () => {},
  setOtherRealignedRepRefs: () => {},
  setOtherRealignedStructRefs: () => {},
};

const minimalRealignedMoleculeListPropsB = {
  ...minimalRealignedMoleculeListProps,
  viewerKey: 'B',
};

const minimalMolstarContainerPropsA = {
  viewer: minimalViewerA,
  pluginRef: { current: null },
  setViewerWrapper: () => {},
  setViewerReady: () => {},
};

const minimalMolstarContainerPropsB = {
  ...minimalMolstarContainerPropsA,
  viewer: minimalViewerB,
};

const mockPropsA = {
  viewerKey: 'A' as ViewerKey,
  loadDataRowProps: mockLoadDataRowPropsA,
  moleculeUIAlignedToProps: minimalMoleculeUIPropsA,
  moleculeUIAlignedProps: minimalMoleculeUIPropsA,
  realignedMoleculeListProps: minimalRealignedMoleculeListProps,
  molstarContainerProps: minimalMolstarContainerPropsA,
};

const mockPropsB = {
  viewerKey: 'B' as ViewerKey,
  loadDataRowProps: mockLoadDataRowPropsB,
  moleculeUIAlignedToProps: minimalMoleculeUIPropsB,
  moleculeUIAlignedProps: minimalMoleculeUIPropsB,
  realignedMoleculeListProps: minimalRealignedMoleculeListPropsB,
  molstarContainerProps: minimalMolstarContainerPropsB,
};

describe('AlignedViewersPanel', () => {
  it('renders without crashing with minimal props', () => {
    const { container } = render(
      <AlignedViewersPanel leftProps={mockPropsA} rightProps={mockPropsB} />
    );
    expect(container).toBeInTheDocument();
  });
});