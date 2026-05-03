/**
 * Unit tests for the useSessionSave hook, which handles saving the current session state to a JSON file.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useSessionSave } from './useSessionSave';

describe('useSessionSave', () => {

  it('should trigger download with correct JSON', () => {
    vi.useFakeTimers();
    const mockSession = { foo: 'bar', count: 42 };
    const getSessionState = vi.fn(() => mockSession);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const clickMock = vi.fn();
    // Return a real anchor element so jsdom appendChild works
    const anchor = document.createElement('a');
    Object.defineProperty(anchor, 'click', { value: clickMock });
    const realCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return anchor;
      // fallback for other tags
      return realCreateElement(tag);
    });

    const { result } = renderHook(() => useSessionSave(getSessionState));
    result.current();

    // Run all timers to trigger setTimeout callbacks
    vi.runAllTimers();

    expect(getSessionState).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    vi.useRealTimers();
  });

  it('should alert on error', () => {
    const getSessionState = vi.fn(() => { throw new Error('fail'); });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useSessionSave(getSessionState));
    result.current();
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save session'));
    alertSpy.mockRestore();
  });
});
