/**
 * General controls for the Ribocode viewer, including data loading, representation selection, color loading, and chain/residue selection.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React from 'react';
import SyncButton from './buttons/Sync';
import { idSuffix as syncSelectIdSuffix } from './buttons/Sync';
import type { ViewerKey } from '../types/ribocode';

/**
 * Suffix for the GeneralControls root id, used for consistent id construction in code and tests.
 */
export const idSuffix = 'general-controls';

/**
 * Define the props for the GeneralControls component
 * @typedef {Object} GeneralControlsProps
 * @property {number} zoomExtraRadius - Extra radius for residue zoom.
 * @property {function} setZoomExtraRadius - Function to update the zoom extra radius.
 * @property {number} zoomMinRadius - Minimum radius for residue zoom.
 * @property {function} setZoomMinRadius - Function to update the zoom minimum radius.
 * @property {Object} viewerA - Reference to viewer A.
 * @property {Object} viewerB - Reference to viewer B.
 * @property {string} activeViewer - Key of the currently active viewer ('A' or 'B').
 * @property {boolean} syncEnabled - Whether synchronization between viewers is enabled.
 * @property {function} setSyncEnabled - Function to toggle synchronization between viewers.
 * @property {string} selectedChainIdAlignedTo - ID of the selected chain in the aligned-to molecule.
 * @property {string} selectedChainIdAligned - ID of the selected chain in the aligned molecule.
 * @property {boolean} realignmentExists - Whether a realignment already exists for the selected chains.
 * @property {function} handleRealignToChains - Function to trigger realignment based on selected chains.
 */
interface GeneralControlsProps {
  zoomExtraRadius: number;
  setZoomExtraRadius: (v: number) => void;
  zoomMinRadius: number;
  setZoomMinRadius: (v: number) => void;
  viewerA: any;
  viewerB: any;
  activeViewer: ViewerKey;
  syncEnabled: boolean;
  setSyncEnabled: (v: boolean) => void;
  selectedChainIdAlignedTo: string;
  selectedChainIdAligned: string;
  realignmentExists: boolean;
  handleRealignToChains: () => void;
  idPrefix?: string;
}

/**
 * GeneralControls component that provides UI controls for zoom settings, synchronization, and realignment.
 * @param {GeneralControlsProps} props - The props for the GeneralControls component.
 * @returns {JSX.Element} The GeneralControls component.
 */
const GeneralControls: React.FC<GeneralControlsProps> = ({
  zoomExtraRadius,
  setZoomExtraRadius,
  zoomMinRadius,
  setZoomMinRadius,
  viewerA,
  viewerB,
  activeViewer,
  syncEnabled,
  setSyncEnabled,
  selectedChainIdAlignedTo,
  selectedChainIdAligned,
  realignmentExists,
  handleRealignToChains,
  idPrefix = 'generalcontrols',
}) => (
  <div className="General-Controls" id={idPrefix ? `${idPrefix}-${idSuffix}` : idSuffix}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <label>
        Residue Zoom extraRadius:
        <input
          type="number"
          value={zoomExtraRadius}
          min={0}
          max={100}
          step={1}
          style={{ width: 60, marginLeft: 4 }}
          onChange={e => setZoomExtraRadius(Number(e.target.value))}
          id={`${idPrefix}-zoom-extra-radius`}
        />
      </label>
      <label>
        minRadius:
        <input
          type="number"
          value={zoomMinRadius}
          min={0}
          max={100}
          step={1}
          style={{ width: 60, marginLeft: 4 }}
          onChange={e => setZoomMinRadius(Number(e.target.value))}
          id={`${idPrefix}-zoom-min-radius`}
        />
      </label>
    </div>
    <SyncButton
      viewerA={viewerA}
      viewerB={viewerB}
      activeViewer={activeViewer}
      disabled={!viewerB?.isMoleculeAlignedToLoaded}
      syncEnabled={syncEnabled}
      setSyncEnabled={setSyncEnabled}
      id={idPrefix ? `${idPrefix}-${syncSelectIdSuffix}` : syncSelectIdSuffix}
    />
    <button
      disabled={!selectedChainIdAlignedTo || !selectedChainIdAligned || realignmentExists}
      onClick={handleRealignToChains}
      id={`${idPrefix}-realign-btn`}
    >
      {selectedChainIdAlignedTo && selectedChainIdAligned
        ? realignmentExists
          ? `Already re-aligned: ${selectedChainIdAlignedTo} → ${selectedChainIdAligned}`
          : `Re-align : ${selectedChainIdAlignedTo} → ${selectedChainIdAligned}`
        : 'Re-align to Chains'}
    </button>
  </div>
);

export default GeneralControls;
