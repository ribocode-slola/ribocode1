import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSessionSaveAll } from './useSessionSaveAll';

describe('useSessionSaveAll', () => {
  const realCreateElement = document.createElement;
  let createdBlob: Blob | null = null;

  beforeEach(() => {
    createdBlob = null;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: any) => {
      createdBlob = blob;
      return 'blob:mock';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    document.createElement = function(tagName: string) {
      if (tagName === 'a') {
        return {
          click: vi.fn(),
          set href(val: string) {},
          set download(val: string) {}
        } as any;
      }
      return realCreateElement.call(document, tagName);
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.createElement = realCreateElement;
  });

  it('embeds files and schema version in the saved session', async () => {
    const getSessionState = vi.fn(() => ({
      viewerA: { moleculeAlignedTo: { filename: 'alignedToA.cif' } },
      viewerB: { moleculeAligned: { filename: 'alignedB.cif' } },
    }));
    const getEmbeddedFiles = vi.fn(() => ({
      'alignedToA.cif': new File(['alpha'], 'alignedToA.cif', { type: 'chemical/x-cif' }),
      'alignedB.cif': new File(['beta'], 'alignedB.cif', { type: 'chemical/x-cif' }),
    }));

    function TestComponent() {
      const save = useSessionSaveAll(getSessionState, getEmbeddedFiles);
      return <button data-testid="saveall-btn" onClick={() => void save()}>Save All</button>;
    }

    render(<TestComponent />);
    fireEvent.click(screen.getByTestId('saveall-btn'));

    await waitFor(() => expect(createdBlob).toBeTruthy());
    const payload = JSON.parse(await createdBlob!.text());
    expect(payload.schemaVersion).toBe(2);
    expect(payload.embeddedFiles['alignedToA.cif']).toEqual(expect.objectContaining({ mime: 'chemical/x-cif' }));
    expect(payload.embeddedFiles['alignedB.cif']).toEqual(expect.objectContaining({ mime: 'chemical/x-cif' }));
    expect(payload.embeddedFiles['alignedToA.cif'].data).toEqual(expect.any(String));
  });
});