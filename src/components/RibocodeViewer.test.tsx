/**
 * Test suite for RibocodeViewer component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render } from '@testing-library/react';
// Mock Molstar PluginUIContext to avoid import issues
vi.mock('molstar/lib/mol-plugin-ui/context', () => ({}));
import RibocodeViewer, { idSuffix as ribocodeViewerIdSuffix } from './RibocodeViewer';

describe('RibocodeViewer', () => {
    let originalLog: any;
    beforeAll(() => {
        originalLog = console.log;
        console.log = vi.fn();
    });
    afterAll(() => {
        console.log = originalLog;
    });
    it('renders the container div', () => {
        render(<RibocodeViewer plugin={null} viewerKey="A" />);
        const container = document.querySelector('.molstar-container');
        expect(container).toBeInTheDocument();
    });

    it('applies idPrefix as id on the root div', () => {
        const idPrefix = "test-viewer";
        render(<RibocodeViewer plugin={null} viewerKey="A" idPrefix={idPrefix} />);
        const id = `${idPrefix}-${ribocodeViewerIdSuffix}`;
        const root = document.getElementById(id);
        expect(root).toBeInTheDocument();
        expect(root).toHaveAttribute('id', id);
    });

    it('calls onReady when plugin is provided', () => {
        const onReady = vi.fn();
        const mockPlugin = {} as any;
        render(<RibocodeViewer plugin={mockPlugin} viewerKey="A" onReady={onReady} />);
        expect(onReady).toHaveBeenCalledWith(mockPlugin);
    });

    it('calls onReady with null on cleanup', () => {
        const onReady = vi.fn();
        const mockPlugin = {} as any;
        const { unmount } = render(<RibocodeViewer plugin={mockPlugin} viewerKey="A" onReady={onReady} />);
        unmount();
        // The last call to onReady should be with null
        expect(onReady).toHaveBeenLastCalledWith(null);
    });
});
