/**
 * Test suite for SelectionContext.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { render, screen } from '@testing-library/react';
import { SelectionProvider, useSelection } from './SelectionContext';

// Test component to consume the context
function TestComponent() {
  const { selectedChainId, setSelectedChainId } = useSelection();
  return (
    <div>
      <span data-testid="selection">{selectedChainId}</span>
      <button onClick={() => setSelectedChainId('test-value')}>Set Selection</button>
    </div>
  );
}

describe('SelectionContext', () => {
  it('provides default selectedChainId value', () => {
    render(
      <SelectionProvider>
        <TestComponent />
      </SelectionProvider>
    );
    expect(screen.getByTestId('selection').textContent).toBe('');
  });

  it('updates selectedChainId value', async () => {
    render(
      <SelectionProvider>
        <TestComponent />
      </SelectionProvider>
    );
    const button = screen.getByText('Set Selection');
    button.click();
    const selectionSpan = await screen.findByTestId('selection');
    expect(selectionSpan.textContent).toBe('test-value');
  });
});
