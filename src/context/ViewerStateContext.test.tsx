/**
 * Test suite for ViewerStateContext.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { render, screen } from '@testing-library/react';
import { ViewerStateProvider, useViewerStateContext } from './ViewerStateContext';

describe('ViewerStateContext', () => {
  function TestComponent() {
    const { activeViewer, setActiveViewer, viewerAReady, setViewerAReady, viewerBReady, setViewerBReady } = useViewerStateContext();
    return (
      <div>
        <span data-testid="active-viewer">{activeViewer}</span>
        <span data-testid="viewerA-ready">{String(viewerAReady)}</span>
        <span data-testid="viewerB-ready">{String(viewerBReady)}</span>
        <button onClick={() => setActiveViewer('B')}>Set Active Viewer B</button>
        <button onClick={() => setViewerAReady(true)}>Set ViewerA Ready</button>
        <button onClick={() => setViewerBReady(true)}>Set ViewerB Ready</button>
      </div>
    );
  }

  it('provides default values', () => {
    render(
      <ViewerStateProvider>
        <TestComponent />
      </ViewerStateProvider>
    );
    expect(screen.getByTestId('active-viewer').textContent).toBe('A');
    expect(screen.getByTestId('viewerA-ready').textContent).toBe('false');
    expect(screen.getByTestId('viewerB-ready').textContent).toBe('false');
  });

  it('updates values', async () => {
    render(
      <ViewerStateProvider>
        <TestComponent />
      </ViewerStateProvider>
    );
    screen.getByText('Set Active Viewer B').click();
    screen.getByText('Set ViewerA Ready').click();
    screen.getByText('Set ViewerB Ready').click();
    expect(await screen.findByTestId('active-viewer')).toHaveTextContent('B');
    expect(await screen.findByTestId('viewerA-ready')).toHaveTextContent('true');
    expect(await screen.findByTestId('viewerB-ready')).toHaveTextContent('true');
  });
});
