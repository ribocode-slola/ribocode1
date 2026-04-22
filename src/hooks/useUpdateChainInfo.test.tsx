/**
 * Test suite for useUpdateChainInfo hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUpdateChainInfo } from './useUpdateChainInfo';

describe('useUpdateChainInfo', () => {
  it('updates chain info and subunit-to-chain mapping when structure is present', () => {
    // Mock pluginRef and structure
    const mockChainLabels = new Map([
      ['A', 'Chain A'],
      ['B', 'Chain B'],
    ]);
    const mockSubunitToChainIds = new Map([
      ['Large', new Set(['A'])],
      ['Small', new Set(['B'])],
    ]);
    const mockStructureObj = {
      units: [
        { chainId: 'A', label: 'Chain A', subunit: 'Large' },
        { chainId: 'B', label: 'Chain B', subunit: 'Small' },
      ],
    };
    const pluginRef = { current: {
      managers: {
        structure: {
          hierarchy: {
            current: {
              structures: [
                { cell: { transform: { ref: 'ref1' }, obj: { data: mockStructureObj } } },
              ],
            },
          },
        },
      },
    }};
    const setChainInfo = vi.fn();
    const setSubunitToChainIds = vi.fn();
    renderHook(() =>
      useUpdateChainInfo(
        pluginRef as any,
        'ref1',
        {},
        setChainInfo,
        setSubunitToChainIds,
        'TestLabel'
      )
    );
    expect(setChainInfo).toHaveBeenCalledWith({ chainLabels: mockChainLabels });
    expect(setSubunitToChainIds).toHaveBeenCalledWith(mockSubunitToChainIds);
  });

  it('does nothing if pluginRef.current is null', () => {
    const setChainInfo = vi.fn();
    const setSubunitToChainIds = vi.fn();
    renderHook(() =>
      useUpdateChainInfo(
        { current: null } as any,
        'ref1',
        {},
        setChainInfo,
        setSubunitToChainIds,
        'TestLabel'
      )
    );
    expect(setChainInfo).not.toHaveBeenCalled();
    expect(setSubunitToChainIds).not.toHaveBeenCalled();
  });
});
