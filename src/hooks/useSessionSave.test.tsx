
/**
 * Test for useSessionSave hook, to verify that it correctly includes filenames in the saved session data.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { useSessionSave } from './useSessionSave';

it('renders a button with data-testid', () => {
  render(<button data-testid="test-btn">Test</button>);
  expect(screen.getByTestId('test-btn')).toBeInTheDocument();
});

it('should include filenames in saved session', () => {
  const realCreateElement = document.createElement;
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

  const getSessionState = vi.fn(() => ({
    viewerA: {
      moleculeAlignedTo: { filename: 'alignedToA.cif', alignmentData: { foo: 1 } },
      moleculeAligned: { filename: 'alignedA.cif', alignmentData: { bar: 2 } },
    },
    viewerB: {
      moleculeAlignedTo: { filename: 'alignedToB.cif', alignmentData: { baz: 3 } },
      moleculeAligned: { filename: 'alignedB.cif', alignmentData: { qux: 4 } },
    },
  }));

  function TestComponent() {
    const save = useSessionSave(getSessionState);
    return <button data-testid="save-btn" onClick={save}>Save</button>;
  }
  render(<TestComponent />);
  fireEvent.click(screen.getByTestId('save-btn'));
  expect(getSessionState).toHaveBeenCalled();
  // Check that the session JSON includes filenames
  const session = getSessionState.mock.results[0].value;
  expect(session.viewerA.moleculeAlignedTo.filename).toBe('alignedToA.cif');
  expect(session.viewerA.moleculeAligned.filename).toBe('alignedA.cif');
  expect(session.viewerB.moleculeAlignedTo.filename).toBe('alignedToB.cif');
  expect(session.viewerB.moleculeAligned.filename).toBe('alignedB.cif');
  // Restore after test
  document.createElement = realCreateElement;
});