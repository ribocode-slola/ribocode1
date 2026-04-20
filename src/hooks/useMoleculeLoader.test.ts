import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMoleculeLoader } from './useMoleculeLoader';

// Mocks for dependencies
const mockSet = vi.fn();
const mockMolstar = {
  setStructureRef: vi.fn(),
  refreshRepresentationRefs: vi.fn(),
  representationRefs: {},
};
const mockStructure = { cell: { transform: { ref: 'ref' } } };
const mockViewer = {
  ref: {
    current: {
      managers: {
        structure: {
          hierarchy: {
            current: {
              structures: [mockStructure, mockStructure],
            },
          },
        },
      },
    },
  },
  setMoleculeAlignedTo: vi.fn(),
  setIsMoleculeAlignedToLoaded: vi.fn(),
  setIsMoleculeAlignedToVisible: vi.fn(),
  setMoleculeAligned: vi.fn(),
  setIsMoleculeAlignedLoaded: vi.fn(),
  setIsMoleculeAlignedVisible: vi.fn(),
  moleculeAlignedTo: { alignmentData: {} },
};

vi.mock('molstar/lib/mol-util/assets', () => ({ Asset: { File: (f: any) => f } }));
vi.mock('molstar/lib/extensions/ribocode/structure', () => ({
  loadMoleculeFileToViewer: vi.fn(async () => ({ label: 'lbl', name: 'nm', filename: 'fn', presetResult: 'pr', trajectory: 'tr', alignmentData: {} })),
}));

const defaultProps = {
  viewerA: { ...mockViewer },
  viewerB: { ...mockViewer },
  molstarA: { ...mockMolstar },
  molstarB: { ...mockMolstar },
  setAlignedFile: mockSet,
  selectedChainIdAlignedTo: 'A',
  selectedChainIdAligned: 'B',
  setRealignedMoleculesA: mockSet,
  setRealignedMoleculesB: mockSet,
  setRealignedStructRefsA: mockSet,
  setRealignedStructRefsB: mockSet,
  setRealignedRepRefsA: mockSet,
  setRealignedRepRefsB: mockSet,
};

describe('useMoleculeLoader', () => {
  it('loads AlignedTo molecule', async () => {
    const { result } = renderHook(() => useMoleculeLoader(defaultProps));
    await act(async () => {
      await result.current.loadMoleculeIntoViewers(new File([''], 'test.pdb'), 'AlignedTo');
    });
    expect(defaultProps.viewerA.setMoleculeAlignedTo).toHaveBeenCalled();
    expect(defaultProps.viewerB.setMoleculeAlignedTo).toHaveBeenCalled();
    expect(defaultProps.viewerA.setIsMoleculeAlignedToLoaded).toHaveBeenCalledWith(true);
    expect(defaultProps.viewerB.setIsMoleculeAlignedToLoaded).toHaveBeenCalledWith(true);
  });

  it('loads Aligned molecule', async () => {
    const { result } = renderHook(() => useMoleculeLoader(defaultProps));
    await act(async () => {
      await result.current.loadMoleculeIntoViewers(new File([''], 'test.pdb'), 'Aligned');
    });
    expect(defaultProps.viewerA.setMoleculeAligned).toHaveBeenCalled();
    expect(defaultProps.viewerB.setMoleculeAligned).toHaveBeenCalled();
    expect(defaultProps.viewerA.setIsMoleculeAlignedLoaded).toHaveBeenCalledWith(true);
    expect(defaultProps.viewerB.setIsMoleculeAlignedLoaded).toHaveBeenCalledWith(true);
  });

  it('loads ReAligned molecule', async () => {
    const { result } = renderHook(() => useMoleculeLoader(defaultProps));
    await act(async () => {
      await result.current.loadMoleculeIntoViewers(new File([''], 'test.pdb'), 'ReAligned');
    });
    expect(defaultProps.setRealignedMoleculesA).toHaveBeenCalled();
    expect(defaultProps.setRealignedMoleculesB).toHaveBeenCalled();
    expect(defaultProps.setRealignedStructRefsA).toHaveBeenCalled();
    expect(defaultProps.setRealignedStructRefsB).toHaveBeenCalled();
    expect(defaultProps.setRealignedRepRefsA).toHaveBeenCalled();
    expect(defaultProps.setRealignedRepRefsB).toHaveBeenCalled();
  });
});
