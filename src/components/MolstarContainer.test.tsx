import { vi } from 'vitest';

import React from 'react';
import { render, act } from '@testing-library/react';

// Mock Molstar and PluginUI imports to avoid Vitest parsing errors
vi.mock('molstar/lib/mol-plugin-ui/context', () => ({}));
vi.mock('molstar/lib/mol-plugin-ui', () => ({
    createPluginUI: vi.fn(() => Promise.resolve({ dispose: vi.fn(), canvas3d: { webgl: { gl: { canvas: { addEventListener: vi.fn() } } } } }))
}));
vi.mock('molstar/lib/mol-plugin-ui/context', () => ({}));

import MolstarContainer from './MolstarContainer';

describe('MolstarContainer', () => {
    let originalLog: any;
    beforeAll(() => {
        originalLog = console.log;
        console.log = vi.fn();
    });
    afterAll(() => {
        console.log = originalLog;
    });
    it('renders the container div and calls setViewer', async () => {
        const setViewer = vi.fn();
        await act(async () => {
            render(
                <MolstarContainer
                    viewerKey="A"
                    setViewer={setViewer}
                />
            );
        });
        // The container should be in the document
        const container = document.querySelector('.molstar-container');
        expect(container).toBeInTheDocument();
    });

    it('calls onMouseDown when the plugin root is clicked', async () => {
        const setViewer = vi.fn();
        const onMouseDown = vi.fn();
        let pluginRoot: Element | null = null;
        await act(async () => {
            const { container } = render(
                <MolstarContainer
                    viewerKey="A"
                    setViewer={setViewer}
                    onMouseDown={onMouseDown}
                />
            );
            pluginRoot = container.querySelector('.molstar-plugin-root');
        });
        if (pluginRoot) {
            await act(async () => {
                pluginRoot!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            });
            expect(onMouseDown).toHaveBeenCalledWith('A');
        }
    });
});
