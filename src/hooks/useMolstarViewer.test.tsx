/**
 * Test suite for useMolstarViewer hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { renderHook, act } from '@testing-library/react';
import { useMolstarViewer } from './useMolstarViewer';
import React from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

describe('useMolstarViewer', () => {
    it('initializes state and exposes API', () => {
        const pluginRef = React.createRef<PluginUIContext | null>();
        const { result } = renderHook(() => useMolstarViewer(pluginRef));
        expect(result.current).toHaveProperty('structureRefs');
        expect(result.current).toHaveProperty('setStructureRef');
        expect(result.current).toHaveProperty('representationRefs');
        expect(result.current).toHaveProperty('setRepresentationRefs');
        expect(result.current).toHaveProperty('lastAddedRepresentationRef');
        expect(result.current).toHaveProperty('setLastAddedRepresentationRef');
        expect(result.current).toHaveProperty('refreshRepresentationRefs');
        expect(result.current).toHaveProperty('addRepresentation');
        expect(result.current).toHaveProperty('getChainInfo');
        expect(result.current).toHaveProperty('repIdMap');
        expect(result.current).toHaveProperty('setRepIdMap');
        expect(result.current).toHaveProperty('getResidueInfo');
    });

    it('updates structureRefs and representationRefs state', () => {
        const pluginRef = React.createRef<PluginUIContext | null>();
        const { result } = renderHook(() => useMolstarViewer(pluginRef));
        act(() => {
            result.current.setStructureRef('foo', 'bar');
            result.current.setRepresentationRefs('foo', ['rep1', 'rep2']);
            result.current.setLastAddedRepresentationRef('foo', 'rep2');
            result.current.setRepIdMap('foo', { rep1: 'ref1' });
        });
        expect(result.current.structureRefs.foo).toBe('bar');
        expect(result.current.representationRefs.foo).toEqual(['rep1', 'rep2']);
        expect(result.current.lastAddedRepresentationRef.foo).toBe('rep2');
        expect(result.current.repIdMap.foo).toEqual({ rep1: 'ref1' });
    });
});
