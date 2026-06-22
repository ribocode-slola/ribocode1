/**
 * Integration test suite for MolstarContainer component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { render, waitFor } from '@testing-library/react';
import MolstarContainer from './MolstarContainer';
import { vi } from 'vitest';

// Mock Molstar and PluginUI imports to avoid Vitest parsing errors
vi.mock('molstar/lib/mol-plugin-ui/context', () => ({}));
vi.mock('molstar/lib/mol-plugin-ui', () => ({
    createPluginUI: vi.fn(() => Promise.resolve({
        dispose: vi.fn(),
        canvas3d: { webgl: { gl: { canvas: { addEventListener: vi.fn() } } } }
    }))
}));

// Test that the viewer initializes and the plugin is set

describe('MolstarContainer integration', () => {
    it('should initialize the viewer and set the plugin', async () => {
        const setViewer = vi.fn();
        render(
            <MolstarContainer
                viewerKey="A"
                setViewer={setViewer}
                idPrefix="test-molstar"
            />
        );
        // Wait for setViewer to be called with a plugin instance
        await waitFor(() => {
            expect(setViewer).toHaveBeenCalled();
            const pluginArg = setViewer.mock.calls[0][0];
            expect(pluginArg).toBeDefined();
            expect(typeof pluginArg.dispose).toBe('function');
        });
    });
});
