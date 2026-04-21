/**
 * Viewer column component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import LoadDataRow from './LoadMolecule';
import MoleculeUI from './Molecule';
import RealignedMoleculeList from './RealignedMoleculeList';
import MolstarContainer from './MolstarContainer';
import RepresentationSelectButton, { AllowedRepresentationType } from './buttons/select/Representation';
import { ViewerKey } from './RibocodeViewer';

/**
 * Define the props for the ViewerColumn component
 * @typedef {Object} ViewerColumnProps
 * @property {ViewerKey} viewerKey - Unique key for the viewer column (e.g., 'A' or 'B').
 * @property {Object} loadDataRowProps - Props to pass to the LoadDataRow component.
 * @property {Object} moleculeUIAlignedToProps - Props to pass to the MoleculeUI component for the aligned-to molecule.
 * @property {Object} moleculeUIAlignedProps - Props to pass to the MoleculeUI component for the aligned molecule.
 * @property {Object} realignedMoleculeListProps - Props to pass to the RealignedMoleculeList component.
 * @property {Object} molstarContainerProps - Props to pass to the MolstarContainer component.
 */
interface ViewerColumnProps {
  viewerKey: ViewerKey;
  loadDataRowProps: any;
  moleculeUIAlignedToProps: any;
  moleculeUIAlignedProps: any;
  realignedMoleculeListProps: any;
  molstarContainerProps: any;
}

/**
 * A column in the viewer that contains the LoadDataRow, MoleculeUI, RealignedMoleculeList, and MolstarContainer components.
 * @param {ViewerColumnProps} props - The props for the ViewerColumn component.
 * @returns {JSX.Element} The ViewerColumn component. 
 */
const ViewerColumn: React.FC<ViewerColumnProps> = ({
  viewerKey,
  loadDataRowProps,
  moleculeUIAlignedToProps,
  moleculeUIAlignedProps,
  realignedMoleculeListProps,
  molstarContainerProps,
}) => {
  return (
    <div className="Column">
      <LoadDataRow {...loadDataRowProps} />
      <MoleculeUI {...moleculeUIAlignedToProps} />
      <MoleculeUI {...moleculeUIAlignedProps} />
      <RealignedMoleculeList {...realignedMoleculeListProps} />
      <MolstarContainer {...molstarContainerProps} />
    </div>
  );
};

export default ViewerColumn;
