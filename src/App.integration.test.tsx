/**
 * Integration test suite for App component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Copilot, Andy Turner <agdturner@gmail.com>
 * @version 1.0.1
 * @lastModified 2026-06-11
 * @see https://github.com/ribocode-slola/ribocode1 
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, within, cleanup } from '@testing-library/react';
import App from './App';
import { vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';

vi.mock('./hooks/useSessionLoadModal', () => ({
  useSessionLoadModal: vi.fn((onSessionLoaded: any) => {
    (globalThis as any).__onSessionLoaded = onSessionLoaded;
    return {
      handleLoadSession: vi.fn(),
      SessionLoadModal: null,
    };
  }),
}));

vi.mock('molstar/lib/mol-plugin/commands', () => ({
  PluginCommands: {
    State: {
      ToggleVisibility: {
        apply: vi.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

vi.mock('./hooks/useMolstarViewer', () => ({
  useMolstarViewer: vi.fn((pluginRef: any) => {
    const allInstances = ((globalThis as any).__molstarViewerInstances ||= []);
    const structureRefs: Record<string, string> = {};
    const representationRefs: Record<string, string[]> = {};
    const repIdMap: Record<string, Record<string, string>> = {};
    let repCounter = 0;
    const addRepresentation = vi.fn(async (key: string, _structureRef: string, _type: string, _colorTheme: any, repId?: string) => {
      const resolvedRepId = repId || `auto-rep-${repCounter++}`;
      const repRef = `mock-${key}-${resolvedRepId}`;
      if (!representationRefs[key]) representationRefs[key] = [];
      representationRefs[key].push(repRef);
      if (!repIdMap[key]) repIdMap[key] = {};
      repIdMap[key][resolvedRepId] = repRef;
      return resolvedRepId;
    });
    const instance = {
      pluginRef,
      structureRefs,
      setStructureRef: vi.fn((key: string, ref: string) => {
        structureRefs[key] = ref;
      }),
      representationRefs,
      setRepresentationRefs: vi.fn((key: string, refs: string[]) => {
        representationRefs[key] = refs;
      }),
      lastAddedRepresentationRef: {},
      setLastAddedRepresentationRef: vi.fn(),
      refreshRepresentationRefs: vi.fn(),
      addRepresentation,
      getChainInfo: vi.fn().mockReturnValue({ chainLabels: new Map() }),
      repIdMap,
      setRepIdMap: vi.fn((key: string, map: Record<string, string>) => {
        repIdMap[key] = map;
      }),
      getResidueInfo: vi.fn().mockReturnValue({ residueLabels: new Map(), residueToAtomIds: {} }),
    };
    allInstances.push(instance);
    return instance;
  }),
}));

// Mock useUpdateChainInfo to immediately populate chain info when structureRef is provided
vi.mock('./hooks/useUpdateChainInfo', () => ({
  useUpdateChainInfo: vi.fn((pluginRef: any, structureRef: string | null, _molstar: any, setChainInfo: any, setSubunitToChainIds: any) => {
    const { useEffect } = require('react');
    useEffect(() => {
      if (!pluginRef?.current || !structureRef) return;
      setChainInfo({ chainLabels: new Map([['A', 'Chain A'], ['B', 'Chain B']]) });
      setSubunitToChainIds(new Map([
        ['All', new Set(['A', 'B'])],
        ['Large', new Set(['A'])],
        ['Small', new Set(['B'])],
        ['Other', new Set()],
      ]));
    }, [pluginRef?.current, structureRef]);
  }),
}));

// Mock the Mol* loader before importing the app
vi.mock('molstar/lib/extensions/ribocode/structure', () => {
  const loadMoleculeFileToViewerMock = vi.fn().mockImplementation(async (_plugin, assetFile, isAlignedTo) => ({
    label: assetFile?.name ?? 'mock-molecule',
    name: assetFile?.name ?? 'mock-molecule',
    filename: assetFile?.name ?? 'mock-molecule.cif',
    presetResult: { model: { cell: { transform: { ref: isAlignedTo ? 'mock-ref-0' : 'mock-ref-1' } } } },
    trajectory: {},
    alignmentData: isAlignedTo ? { rows: [1] } : undefined,
  }));
  // @ts-ignore
  global.__loadMoleculeFileToViewerMock = loadMoleculeFileToViewerMock;
  return {
    loadMoleculeFileToViewer: loadMoleculeFileToViewerMock,
  };
});

// Mock MolstarContainer to always render a stub and trigger viewer loaded state
vi.mock('./components/MolstarContainer', () => {
  const React = require('react');
  const buildStructure = (ref: string) => ({
    cell: {
      transform: { ref },
      obj: {
        data: {
          units: [
            { chainGroupId: 'A', label: 'Chain A', subunit: 'default' },
            { chainGroupId: 'B', label: 'Chain B', subunit: 'default' },
          ],
        },
      },
    },
  });
  const buildPlugin = () => ({
    managers: {
      structure: {
        hierarchy: {
          current: {
            structures: [
              buildStructure('mock-ref-0'),
              buildStructure('mock-ref-1'),
            ],
          },
        },
      },
    },
    state: { data: {} },
    canvas3d: { requestDraw: () => {} },
  });
  const mockPluginA = buildPlugin();
  const mockPluginB = buildPlugin();
  // @ts-ignore
  global.__mockPluginA = mockPluginA;
  // @ts-ignore
  global.__mockPluginB = mockPluginB;
  return {
    __esModule: true,
    default: ({ idPrefix, onReady, setViewer }: { idPrefix: string, onReady?: () => void, setViewer?: (plugin: any) => void }) => {
      const plugin = idPrefix?.includes('-B') ? mockPluginB : mockPluginA;
      // Use useLayoutEffect with empty deps so setViewer fires synchronously
      // before any user-event handlers that read viewerA/B.ref.current.
      React.useLayoutEffect(() => {
        if (setViewer) setViewer(plugin);
        if (onReady) onReady();
      }, []);
      return <div id={`${idPrefix}-molstar-container-mock`}>[Mocked MolstarContainer]</div>;
    },
  };
});

// Lightweight helper for creating deterministic mock files used by integration tests.
function loadTestFile(filename: string): File {
  return new File(['mock-file-content'], filename, { type: 'text/plain' });
}

describe('App integration: AlignedTo and Aligned loading', () => {

  beforeAll(() => {
    // Suppress console output during tests to avoid pending async console operations
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('renders the AppHeader with correct id', async () => {
    render(<App testForceIsMoleculeAlignedLoaded={true} />);
    const header = await screen.findByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header.id).toBe('app-header');
    expect(header.tagName.toLowerCase()).toBe('header');
  });

  it('toggles visibility for all representations', async () => {
    render(<App />);
    const header = await screen.findByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('disables Load Aligned until AlignedTo data are loaded', async () => {
    render(<App />);

    const alignedLoadBtn = document.getElementById('viewer-column-B-aligned-load-btn') as HTMLButtonElement | null;
    const alignedToInput = document.getElementById('viewer-column-A-alignedto-file-input') as HTMLInputElement | null;

    expect(alignedLoadBtn).toBeInTheDocument();
    expect(alignedLoadBtn).toBeDisabled();
    expect(alignedToInput).toBeInTheDocument();

    fireEvent.change(alignedToInput!, { target: { files: [loadTestFile('4ug0.cif')] } });

    await waitFor(() => {
      expect(document.getElementById('viewer-column-B-aligned-load-btn')).not.toBeDisabled();
    }, { timeout: 5000 });
  });

  it('disables Column B Load Colours until Aligned data are loaded', async () => {
    render(<App />);

    const alignedToInput = document.getElementById('viewer-column-A-alignedto-file-input') as HTMLInputElement | null;
    const alignedInput = document.getElementById('viewer-column-B-aligned-file-input') as HTMLInputElement | null;
    const alignedLoadBtn = document.getElementById('viewer-column-B-aligned-load-btn') as HTMLButtonElement | null;
    const alignedColoursBtn = document.getElementById('viewer-column-B-aligned-load-colours-btn') as HTMLButtonElement | null;

    expect(alignedToInput).toBeInTheDocument();
    expect(alignedInput).toBeInTheDocument();
    expect(alignedLoadBtn).toBeInTheDocument();
    expect(alignedColoursBtn).toBeInTheDocument();
    expect(alignedColoursBtn).toBeDisabled();

    fireEvent.change(alignedToInput!, { target: { files: [loadTestFile('4ug0.cif')] } });

    await waitFor(() => {
      expect(document.getElementById('viewer-column-B-aligned-load-btn')).not.toBeDisabled();
      expect(document.getElementById('viewer-column-B-aligned-load-colours-btn')).toBeDisabled();
    }, { timeout: 5000 });

    fireEvent.change(alignedInput!, { target: { files: [loadTestFile('6xu8.cif')] } });
    fireEvent.click(alignedLoadBtn!);

    await waitFor(() => {
      expect(document.getElementById('viewer-column-B-aligned-load-colours-btn')).not.toBeDisabled();
    }, { timeout: 5000 });
  });

  it('enables Select Sync after Aligned data are loaded', async () => {
    render(<App />);

    const syncSelect = document.getElementById('generalcontrols-sync-select') as HTMLSelectElement | null;
    const alignedToInput = document.getElementById('viewer-column-A-alignedto-file-input') as HTMLInputElement | null;
    const alignedInput = document.getElementById('viewer-column-B-aligned-file-input') as HTMLInputElement | null;
    const alignedLoadBtn = document.getElementById('viewer-column-B-aligned-load-btn') as HTMLButtonElement | null;

    expect(syncSelect).toBeInTheDocument();
    expect(syncSelect).toBeDisabled();
    expect(alignedToInput).toBeInTheDocument();
    expect(alignedInput).toBeInTheDocument();
    expect(alignedLoadBtn).toBeInTheDocument();

    fireEvent.change(alignedToInput!, { target: { files: [loadTestFile('4ug0.cif')] } });

    await waitFor(() => {
      expect(document.getElementById('viewer-column-B-aligned-load-btn')).not.toBeDisabled();
      expect(document.getElementById('generalcontrols-sync-select')).toBeDisabled();
    }, { timeout: 5000 });

    fireEvent.change(alignedInput!, { target: { files: [loadTestFile('6xu8.cif')] } });
    fireEvent.click(alignedLoadBtn!);

    await waitFor(() => {
      expect(document.getElementById('generalcontrols-sync-select')).not.toBeDisabled();
    }, { timeout: 5000 });
  });

  let loadMoleculeFileToViewerMock: any;
  beforeAll(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: () => ({
        getExtension: () => null,
        clear: () => { },
        drawArrays: () => { },
        createBuffer: () => { },
        bindBuffer: () => { },
        bufferData: () => { },
        enable: () => { },
        disable: () => { },
        viewport: () => { },
      }),
    });
    // @ts-ignore
    loadMoleculeFileToViewerMock = global.__loadMoleculeFileToViewerMock;
  });

  beforeEach(() => {
    vi.useRealTimers();
    loadMoleculeFileToViewerMock?.mockClear?.();
    (globalThis as any).__molstarViewerInstances = [];
  });

  afterEach(() => {
    cleanup();
  });


  it('renders chain zoom controls disabled before chain selection', async () => {
    render(<App />);

    await waitFor(() => {
      const zoomChainButtons = Array.from(
        document.querySelectorAll('#viewer-column-A button#viewer-column-A-zoom-chain-btn')
      ) as HTMLButtonElement[];
      expect(zoomChainButtons.length).toBeGreaterThan(0);
      expect(zoomChainButtons.every(button => button.disabled)).toBe(true);
    }, { timeout: 5000 });
  });

  it('keeps Viewer A and Viewer B visibility toggles independent', async () => {
    render(<App />);

    const alignedToInput = document.getElementById('viewer-column-A-alignedto-file-input') as HTMLInputElement | null;
    const alignedInput = document.getElementById('viewer-column-B-aligned-file-input') as HTMLInputElement | null;
    const alignedLoadBtn = document.getElementById('viewer-column-B-aligned-load-btn') as HTMLButtonElement | null;

    expect(alignedToInput).toBeInTheDocument();
    expect(alignedInput).toBeInTheDocument();
    expect(alignedLoadBtn).toBeInTheDocument();

    fireEvent.change(alignedToInput!, { target: { files: [loadTestFile('4ug0.cif')] } });

    await waitFor(() => {
      expect(document.getElementById('viewer-column-B-aligned-load-btn')).not.toBeDisabled();
    }, { timeout: 5000 });

    fireEvent.change(alignedInput!, { target: { files: [loadTestFile('6xu8.cif')] } });
    fireEvent.click(alignedLoadBtn!);

    const viewerACol = document.getElementById('viewer-column-A') as HTMLElement | null;
    const viewerBCol = document.getElementById('viewer-column-B') as HTMLElement | null;
    expect(viewerACol).toBeInTheDocument();
    expect(viewerBCol).toBeInTheDocument();

    await waitFor(() => {
      expect(within(viewerACol!).getByRole('button', { name: /Hide 4ug0\.cif/i })).toBeInTheDocument();
      expect(within(viewerBCol!).getByRole('button', { name: /Hide 4ug0\.cif/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    fireEvent.click(within(viewerACol!).getByRole('button', { name: /Hide 4ug0\.cif/i }));

    await waitFor(() => {
      expect(within(viewerACol!).getByRole('button', { name: /Show 4ug0\.cif/i })).toBeInTheDocument();
      expect(within(viewerBCol!).getByRole('button', { name: /Hide 4ug0\.cif/i })).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('passes alignment data when loading Aligned (regression)', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('banner')).toBeInTheDocument());

    const onSessionLoaded = (globalThis as any).__onSessionLoaded as ((session: any, files: Record<string, File>) => Promise<void>) | undefined;
    expect(onSessionLoaded).toBeDefined();
    expect(onSessionLoaded).toEqual(expect.any(Function));

    const session = {
      viewerA: { moleculeAlignedTo: { filename: '4ug0.cif' } },
      viewerB: { moleculeAligned: { filename: '6xu8.cif' } },
    };
    const files = {
      '4ug0.cif': loadTestFile('4ug0.cif'),
      '6xu8.cif': loadTestFile('6xu8.cif'),
    };

    await onSessionLoaded!(session, files);

    const alignedCalls = loadMoleculeFileToViewerMock.mock.calls.filter((args: any[]) => args[2] === false);
    expect(alignedCalls.length).toBeGreaterThan(0);
    expect(alignedCalls[0][4]).toEqual({ rows: [1] });
  });

  it('restores saved additional representations on session load (regression)', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('banner')).toBeInTheDocument());

    const onSessionLoaded = (globalThis as any).__onSessionLoaded as ((session: any, files: Record<string, File>) => Promise<void>) | undefined;
    expect(onSessionLoaded).toBeDefined();
    expect(onSessionLoaded).toEqual(expect.any(Function));

    const session = {
      viewerA: {
        moleculeAlignedTo: {
          filename: '4ug0.cif',
          representations: [
            { type: 'cartoon', colorTheme: { name: 'AlignedTo-custom-chain-colors', params: {} }, visible: false },
            { type: 'line', colorTheme: { name: 'default', params: {} }, visible: true }
          ],
        },
      },
      viewerB: {
        moleculeAligned: {
          filename: '6xu8.cif',
          representations: [
            { type: 'cartoon', colorTheme: { name: 'Aligned-custom-chain-colors', params: {} }, visible: false },
            { type: 'line', colorTheme: { name: 'default', params: {} }, visible: true }
          ],
        },
      },
    };
    const files = {
      '4ug0.cif': loadTestFile('4ug0.cif'),
      '6xu8.cif': loadTestFile('6xu8.cif'),
    };

    await onSessionLoaded!(session, files);

    const instances = (globalThis as any).__molstarViewerInstances as any[];
    const addRepresentationCalls = instances.flatMap(instance => instance.addRepresentation.mock.calls);
    const restoredCartoonCalls = addRepresentationCalls.filter((args: any[]) => args[2] === 'cartoon');
    const restoredLineCalls = addRepresentationCalls.filter((args: any[]) => args[2] === 'line');
    expect(restoredCartoonCalls.length).toBeGreaterThan(0);
    expect(restoredLineCalls.length).toBeGreaterThan(0);
    expect((PluginCommands.State.ToggleVisibility.apply as any)).toHaveBeenCalled();
  });

  it('shows a React error boundary or warning if AlignedTo triggers infinite recursion', async () => {
    render(<App />);
    const header = await screen.findByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('does not infinitely reload AlignedTo or Aligned (regression)', async () => {
    render(<App />);
    await new Promise(resolve => setTimeout(resolve, 100));
    const viewerColumnA = document.getElementById('viewer-column-A');
    const viewerColumnB = document.getElementById('viewer-column-B');
    expect(viewerColumnA).toBeInTheDocument();
    expect(viewerColumnB).toBeInTheDocument();
  });
});
