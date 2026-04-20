import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MoleculeUI from './Molecule';

describe('MoleculeUI', () => {
    const mockPlugin = {} as any;
    const baseProps = {
        label: 'Test Molecule',
        plugin: mockPlugin,
        isVisible: true,
        onToggleVisibility: vi.fn(),
        chainZoomLabel: 'A',
        onChainZoom: vi.fn(),
        chainZoomDisabled: false,
        residueZoomLabel: '10',
        onResidueZoom: vi.fn(),
        residueZoomDisabled: false,
        isLoaded: true,
        forceUpdate: vi.fn(),
        representationRefs: [],
    };

    it('renders molecule label and zoom buttons', () => {
        render(<MoleculeUI {...baseProps} />);
        expect(screen.getByText('Test Molecule')).toBeInTheDocument();
        expect(screen.getByText('Zoom to Chain: A')).toBeInTheDocument();
        expect(screen.getByText('Zoom to Residue: 10')).toBeInTheDocument();
    });

    it('calls onToggleVisibility when visibility button is clicked', () => {
        render(<MoleculeUI {...baseProps} />);
        fireEvent.click(screen.getByLabelText('Hide Test Molecule'));
        expect(baseProps.onToggleVisibility).toHaveBeenCalled();
    });

    it('calls onChainZoom and onResidueZoom when zoom buttons are clicked', () => {
        render(<MoleculeUI {...baseProps} />);
        fireEvent.click(screen.getByText('Zoom to Chain: A'));
        fireEvent.click(screen.getByText('Zoom to Residue: 10'));
        expect(baseProps.onChainZoom).toHaveBeenCalled();
        expect(baseProps.onResidueZoom).toHaveBeenCalled();
    });

    it('renders and calls onRemove if provided', () => {
        const onRemove = vi.fn();
        render(<MoleculeUI {...baseProps} onRemove={onRemove} />);
        fireEvent.click(screen.getByLabelText('Remove Test Molecule'));
        expect(onRemove).toHaveBeenCalled();
    });
});
