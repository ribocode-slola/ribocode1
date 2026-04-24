/**
 * Component for displaying two aligned viewers side by side.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React from 'react';
import TwoColumnsContainer from './TwoColumnsContainer';
import ViewerColumn, {
    getLoadDataRowProps,
    getMoleculeUIAlignedToProps,
    getMoleculeUIAlignedProps,
    getRealignedMoleculeListProps,
    getMolstarContainerProps
} from './ViewerColumn';


import type { ViewerColumnProps } from './ViewerColumn';

interface AlignedViewersPanelProps {
    leftProps: ViewerColumnProps;
    rightProps: ViewerColumnProps;
}

/**
 * AlignedViewersPanel component that renders two ViewerColumn components side by side for aligned viewers.
 * @param {AlignedViewersPanelProps} props - The props for the AlignedViewersPanel component.
 * @returns {JSX.Element} The AlignedViewersPanel component.
 */
const AlignedViewersPanel: React.FC<AlignedViewersPanelProps> = ({ leftProps, rightProps }) => {
    return (
        <TwoColumnsContainer
            left={
                <ViewerColumn
                    viewerKey={leftProps.viewerKey}
                    loadDataRowProps={getLoadDataRowProps(leftProps.loadDataRowProps)}
                    moleculeUIAlignedToProps={getMoleculeUIAlignedToProps(leftProps.moleculeUIAlignedToProps)}
                    moleculeUIAlignedProps={getMoleculeUIAlignedProps(leftProps.moleculeUIAlignedProps)}
                    realignedMoleculeListProps={getRealignedMoleculeListProps(leftProps.realignedMoleculeListProps)}
                    molstarContainerProps={getMolstarContainerProps(leftProps.molstarContainerProps)}
                />
            }
            right={
                <ViewerColumn
                    viewerKey={rightProps.viewerKey}
                    loadDataRowProps={getLoadDataRowProps(rightProps.loadDataRowProps)}
                    moleculeUIAlignedToProps={getMoleculeUIAlignedToProps(rightProps.moleculeUIAlignedToProps)}
                    moleculeUIAlignedProps={getMoleculeUIAlignedProps(rightProps.moleculeUIAlignedProps)}
                    realignedMoleculeListProps={getRealignedMoleculeListProps(rightProps.realignedMoleculeListProps)}
                    molstarContainerProps={getMolstarContainerProps(rightProps.molstarContainerProps)}
                />
            }
        />
    );
};

export default AlignedViewersPanel;
