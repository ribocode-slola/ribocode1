import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadDataRow from './LoadMolecule';
import { AllowedRepresentationType } from './buttons/select/Representation';

describe('LoadDataRow', () => {
    const baseProps = {
        viewerTitle: 'Viewer A',
        isLoaded: false,
        onFileInputClick: jest.fn(),
        fileInputRef: { current: null },
        onFileChange: jest.fn(),
        fileInputDisabled: false,
        fileInputLabel: 'Load AlignedTo',
        representationType: 'cartoon' as AllowedRepresentationType,
        onRepresentationTypeChange: jest.fn(),
        representationTypeDisabled: false,
        onAddColorsClick: jest.fn(),
        addColorsDisabled: false,
        colorsInputRef: { current: null },
        onColorsFileChange: jest.fn(),
        subunitToChainIds: new Map([['All', new Set(['A', 'B'])]]),
        selectedSubunit: 'All',
        onSelectSubunit: jest.fn(),
        subunitSelectDisabled: false,
        chainInfo: { chainLabels: new Map([['A', 'Chain A'], ['B', 'Chain B']]) },
        selectedChainId: 'A',
        onSelectChainId: jest.fn(),
        chainSelectDisabled: false,
        residueInfo: { residueLabels: new Map([['1', { id: '1', name: 'Residue 1', compId: 'ALA', seqNumber: 1, insCode: '' }]]), residueToAtomIds: { '1': ['a1'] } },
        selectedResidueId: '1',
        onSelectResidueId: jest.fn(),
        residueSelectDisabled: false,
        onAddRepresentationClick: jest.fn(),
        addRepresentationDisabled: false,
        fogEnabled: false,
        fogNear: 0.1,
        fogFar: 1.0,
        onFogEnabledChange: jest.fn(),
        onFogNearChange: jest.fn(),
        onFogFarChange: jest.fn(),
        cameraNear: 0.1,
        cameraFar: 1000,
        onCameraNearChange: jest.fn(),
        onCameraFarChange: jest.fn(),
    };

    it('renders viewer title and file input button', () => {
        render(<LoadDataRow {...baseProps} />);
        expect(screen.getByText('Viewer A')).toBeInTheDocument();
        expect(screen.getByText('Load AlignedTo')).toBeInTheDocument();
    });

    it('calls onFileInputClick when file input button is clicked', () => {
        render(<LoadDataRow {...baseProps} />);
        fireEvent.click(screen.getByText('Load AlignedTo'));
        expect(baseProps.onFileInputClick).toHaveBeenCalled();
    });

    it('renders subunit, chain, and residue select controls', () => {
        render(<LoadDataRow {...baseProps} isLoaded={true} />);
        expect(screen.getByText('Chain A')).toBeInTheDocument();
        expect(screen.getByText('Residue 1')).toBeInTheDocument();
    });

    it('calls onAddColorsClick when Load Colours is clicked', () => {
        render(<LoadDataRow {...baseProps} isLoaded={true} />);
        fireEvent.click(screen.getByText('Load Colours'));
        expect(baseProps.onAddColorsClick).toHaveBeenCalled();
    });

    it('calls onAddRepresentationClick when + is clicked', () => {
        render(<LoadDataRow {...baseProps} isLoaded={true} />);
        fireEvent.click(screen.getByLabelText('Add Representation'));
        expect(baseProps.onAddRepresentationClick).toHaveBeenCalled();
    });
});
