/**
 * Test suite for Molecule component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';import { render, screen, fireEvent } from '@testing-library/react';
import MoleculeUI, { idSuffix as moleculeIdSuffix } from './Molecule';

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


    it('applies idPrefix to root div', () => {
        const { container } = render(
            <MoleculeUI
                {...baseProps}
                label="TestMol"
                idPrefix="test-prefix"
            />
        );
        const root = container.querySelector(`#test-prefix-${moleculeIdSuffix}-testmol`);
        expect(root).toBeInTheDocument();
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
