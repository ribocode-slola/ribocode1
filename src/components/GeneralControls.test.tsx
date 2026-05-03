/**
 * Test suite for GeneralControls component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import GeneralControls, { idSuffix as generalControlsIdSuffix } from './GeneralControls';
import type { ViewerKey } from '../types/ribocode';
import { A, B } from '../constants/ribocode';

describe('GeneralControls', () => {
  it('renders and responds to user input', () => {
    const setZoomExtraRadius = vi.fn();
    const setZoomMinRadius = vi.fn();
    const setSyncEnabled = vi.fn();
    const handleRealignToChains = vi.fn();
    const props = {
      zoomExtraRadius: 20,
      setZoomExtraRadius,
      zoomMinRadius: 16,
      setZoomMinRadius,
      viewerA: {},
      viewerB: { isMoleculeAlignedToLoaded: true },
      activeViewer: 'A' as ViewerKey,
      syncEnabled: false,
      setSyncEnabled,
      selectedChainIdAlignedTo: A,
      selectedChainIdAligned: B,
      realignmentExists: false,
      handleRealignToChains,
    };
    const { getByLabelText, getByRole, getByText, container } = render(<GeneralControls {...props} idPrefix="test-controls" />);
    // Check for root id
    const root = container.querySelector(`#test-controls-${generalControlsIdSuffix}`);
    expect(root).toBeInTheDocument();

    // Test zoomExtraRadius input
    const extraRadiusInput = getByLabelText(/Residue Zoom extraRadius/i);
    fireEvent.change(extraRadiusInput, { target: { value: '25' } });
    expect(setZoomExtraRadius).toHaveBeenCalledWith(25);

    // Test zoomMinRadius input
    const minRadiusInput = getByLabelText(/minRadius/i);
    fireEvent.change(minRadiusInput, { target: { value: '18' } });
    expect(setZoomMinRadius).toHaveBeenCalledWith(18);

    // Test SyncButton (actually a select) is rendered and works
    const syncSelect = getByLabelText(/Select Sync/i);
    expect(syncSelect).toBeInTheDocument();
    fireEvent.change(syncSelect, { target: { value: 'On' } });
    expect(setSyncEnabled).toHaveBeenCalledWith(true);
    fireEvent.change(syncSelect, { target: { value: 'Off' } });
    expect(setSyncEnabled).toHaveBeenCalledWith(false);

    // Test realign button
    const realignBtn = getByRole('button', { name: /Re-align/i });
    fireEvent.click(realignBtn);
    expect(handleRealignToChains).toHaveBeenCalled();
    expect(realignBtn).not.toBeDisabled();

    // Test disabled state
    const { getByRole: getByRole2 } = render(
      <GeneralControls {...props} selectedChainIdAlignedTo="" />
    );
    expect(getByRole2('button', { name: /Re-align to Chains/i })).toBeDisabled();
  });
});
