/**
 * Test suite for SyncContext.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SyncProvider, useSync } from './SyncContext';

function ConsumerComponent() {
    const ctx = useSync();
    return (
        <div>
            <span data-testid="sync-enabled">{ctx.syncEnabled ? 'yes' : 'no'}</span>
            <button onClick={() => ctx.setSyncEnabled(true)}>Enable Sync</button>
        </div>
    );
}

describe('SyncContext', () => {
    let originalLog: any;
    beforeAll(() => {
        originalLog = console.log;
        console.log = vi.fn();
    });
    afterAll(() => {
        console.log = originalLog;
    });
    it('throws if used outside provider', () => {
        // Suppress error output for this test
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => {
            render(<ConsumerComponent />);
        }).toThrow('useSync must be used within a SyncProvider');
        spy.mockRestore();
    });

    it('provides default state and allows updates', () => {
        render(
            <SyncProvider>
                <ConsumerComponent />
            </SyncProvider>
        );
        // Default is syncEnabled false
        expect(screen.getByTestId('sync-enabled').textContent).toBe('no');
        // Click to enable sync and assert in act()
        act(() => {
            screen.getByText('Enable Sync').click();
        });
        expect(screen.getByTestId('sync-enabled').textContent).toBe('yes');
    });
});
