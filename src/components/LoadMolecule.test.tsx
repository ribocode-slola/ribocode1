/**
 * Test suite for LoadMolecule component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadDataRow from './LoadMolecule';
import { AllowedRepresentationType } from '../types/ribocode';

describe('LoadDataRow', () => {
    const baseProps = {
        viewerTitle: 'Viewer A',
        isLoaded: false,
        onFileInputClick: vi.fn(),
        fileInputRef: { current: null },
        onFileChange: vi.fn(),
        fileInputDisabled: false,
        fileInputLabel: 'Load AlignedTo',
        representationType: 'cartoon' as AllowedRepresentationType,
        onRepresentationTypeChange: vi.fn(),
        representationTypeDisabled: false,
        onAddColorsClick: vi.fn(),
        addColorsDisabled: false,
        colorsInputRef: { current: null },
        onColorsFileChange: vi.fn(),
        subunitToChainIds: new Map([
            ['All', new Set(['A', 'B'])],
            ['Large', new Set()],
            ['Small', new Set()],
            ['Other', new Set()],
        ]) as Map<import('../utils/subunit').RibosomeSubunitType, Set<string>>,
        selectedSubunit: 'All' as import('../utils/subunit').RibosomeSubunitType,
        onSelectSubunit: vi.fn(),
        subunitSelectDisabled: false,
        chainInfo: { chainLabels: new Map([['A', 'Chain A'], ['B', 'Chain B']]) },
        selectedChainId: 'A',
        onSelectChainId: vi.fn(),
        chainSelectDisabled: false,
        residueInfo: { residueLabels: new Map([['1', { id: '1', name: 'Residue 1', compId: 'ALA', seqNumber: 1, insCode: '' }]]), residueToAtomIds: { '1': ['a1'] } },
        selectedResidueId: '1',
        onSelectResidueId: vi.fn(),
        residueSelectDisabled: false,
        onAddRepresentationClick: vi.fn(),
        addRepresentationDisabled: false,
        fogEnabled: false,
        fogNear: 0.1,
        fogFar: 1.0,
        onFogEnabledChange: vi.fn(),
        onFogNearChange: vi.fn(),
        onFogFarChange: vi.fn(),
        cameraNear: 0.1,
        cameraFar: 1000,
        onCameraNearChange: vi.fn(),
        onCameraFarChange: vi.fn(),
        idPrefix: 'test-viewer-a',
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
