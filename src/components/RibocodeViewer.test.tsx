import React from 'react';
import { render } from '@testing-library/react';
// Mock Molstar PluginUIContext to avoid import issues
jest.mock('molstar/lib/mol-plugin-ui/context', () => ({}));
import RibocodeViewer from './RibocodeViewer';

describe('RibocodeViewer', () => {
    it('renders the container div', () => {
        render(<RibocodeViewer plugin={null} viewerKey="A" />);
        const container = document.querySelector('.molstar-container');
        expect(container).toBeInTheDocument();
    });

    it('calls onReady when plugin is provided', () => {
        const onReady = jest.fn();
        const mockPlugin = {} as any;
        render(<RibocodeViewer plugin={mockPlugin} viewerKey="A" onReady={onReady} />);
        expect(onReady).toHaveBeenCalledWith(mockPlugin);
    });

    it('calls onReady with null on cleanup', () => {
        const onReady = jest.fn();
        const mockPlugin = {} as any;
        const { unmount } = render(<RibocodeViewer plugin={mockPlugin} viewerKey="A" onReady={onReady} />);
        unmount();
        // The last call to onReady should be with null
        expect(onReady).toHaveBeenLastCalledWith(null);
    });
});
