/**
 * Test suite for useFileInput hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { renderHook, act } from '@testing-library/react';
import { useFileInput } from './useFileInput';

describe('useFileInput', () => {
  it('initializes with initial value and updates data on parse', async () => {
    const parseFn = async (text: string, file: File) => ({ text, name: file.name });
    const { result } = renderHook(() => useFileInput(parseFn, { text: '', name: '' }));

    // Initial state
    expect(result.current.data).toEqual({ text: '', name: '' });

    // Simulate file input change
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;

    // Mock FileReader
    const originalFileReader = globalThis.FileReader;
    class MockFileReader {
      public onload: null | (() => void) = null;
      public result: string | null = null;
      readAsText(file: File) {
        this.result = 'hello world';
        setTimeout(() => this.onload && this.onload(), 0);
      }
    }
    // @ts-ignore
    globalThis.FileReader = MockFileReader;

    await act(async () => {
      result.current.handleFileChange(event);
      // Wait for FileReader to "load"
      await new Promise(res => setTimeout(res, 10));
    });
    expect(result.current.data).toEqual({ text: 'hello world', name: 'test.txt' });

    // Restore FileReader
    globalThis.FileReader = originalFileReader;
  });
});
