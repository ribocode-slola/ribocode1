/**
 * Test suite for SyncButton component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import SyncButton from './Sync';
import { idSuffix as syncSelectIdSuffix } from './Sync';

function createMockCamera(initialRadius = 10) {
    const listeners = new Set<() => void>();
    const snapshot = {
        position: [1, 2, 3],
        target: [4, 5, 6],
        up: [0, 1, 0],
        radius: initialRadius,
    };

    return {
        state: { mode: 'perspective' },
        stateChanged: {
            subscribe: (cb: () => void) => {
                listeners.add(cb);
                return {
                    unsubscribe: () => listeners.delete(cb),
                };
            },
        },
        getSnapshot: vi.fn(() => ({
            position: [...snapshot.position],
            target: [...snapshot.target],
            up: [...snapshot.up],
            radius: snapshot.radius,
        })),
        setState: vi.fn((next: any) => {
            snapshot.position = [...next.position];
            snapshot.target = [...next.target];
            snapshot.up = [...next.up];
            snapshot.radius = next.radius;
            listeners.forEach(listener => listener());
        }),
        emit: (next: Partial<typeof snapshot>) => {
            if (next.position) snapshot.position = [...next.position];
            if (next.target) snapshot.target = [...next.target];
            if (next.up) snapshot.up = [...next.up];
            if (typeof next.radius === 'number') snapshot.radius = next.radius;
            listeners.forEach(listener => listener());
        },
    };
}

function createMockViewer(camera: ReturnType<typeof createMockCamera>) {
    return {
        canvas3d: {
            camera,
            requestDraw: vi.fn(),
        },
    };
}

describe('SyncButton', () => {
    it('renders with correct label and options', () => {
        const { getByLabelText, getByText } = render(
            <SyncButton
                viewerA={null}
                viewerB={null}
                activeViewer={'A'}
                disabled={false}
                syncEnabled={false}
                setSyncEnabled={() => {}}
                id={syncSelectIdSuffix}
            />
        );
        expect(getByLabelText('Select Sync')).toBeInTheDocument();
        expect(getByText('On')).toBeInTheDocument();
        expect(getByText('Off')).toBeInTheDocument();
    });

    it('shows correct selected value based on syncEnabled', () => {
        const { getByLabelText, rerender } = render(
            <SyncButton
                viewerA={null}
                viewerB={null}
                activeViewer={'A'}
                disabled={false}
                syncEnabled={false}
                setSyncEnabled={() => {}}
                id={syncSelectIdSuffix}
            />
        );
        expect((getByLabelText('Select Sync') as HTMLSelectElement).value).toBe('Off');
        rerender(
            <SyncButton
                viewerA={null}
                viewerB={null}
                activeViewer={'A'}
                disabled={false}
                syncEnabled={true}
                setSyncEnabled={() => {}}
                id="test-sync-select"
            />
        );
        expect((getByLabelText('Select Sync') as HTMLSelectElement).value).toBe('On');
    });

    it('calls setSyncEnabled when option is changed', () => {
        const setSyncEnabled = vi.fn();
        const { getByLabelText } = render(
            <SyncButton
                viewerA={null}
                viewerB={null}
                activeViewer={'A'}
                disabled={false}
                syncEnabled={false}
                setSyncEnabled={setSyncEnabled}
                id={syncSelectIdSuffix}
            />
        );
        fireEvent.change(getByLabelText('Select Sync'), { target: { value: 'On' } });
        expect(setSyncEnabled).toHaveBeenCalledWith(true);
        fireEvent.change(getByLabelText('Select Sync'), { target: { value: 'Off' } });
        expect(setSyncEnabled).toHaveBeenCalledWith(false);
    });

    it('is disabled when disabled prop is true', () => {
        const { getByLabelText } = render(
            <SyncButton
                viewerA={null}
                viewerB={null}
                activeViewer={'A'}
                disabled={true}
                syncEnabled={false}
                setSyncEnabled={() => {}}
                id={syncSelectIdSuffix}
            />
        );
        expect(getByLabelText('Select Sync')).toBeDisabled();
    });

    it('syncs camera changes from viewer A to viewer B', () => {
        const cameraA = createMockCamera(10);
        const cameraB = createMockCamera(20);
        const viewerA = createMockViewer(cameraA);
        const viewerB = createMockViewer(cameraB);

        render(
            <SyncButton
                viewerA={viewerA as any}
                viewerB={viewerB as any}
                activeViewer={'A'}
                disabled={false}
                syncEnabled={true}
                setSyncEnabled={() => {}}
                id={syncSelectIdSuffix}
            />
        );

        act(() => {
            cameraA.emit({ position: [9, 8, 7], target: [6, 5, 4], up: [0, 0, 1], radius: 42 });
        });

        expect(cameraB.setState).toHaveBeenCalledWith(expect.objectContaining({
            position: [9, 8, 7],
            target: [6, 5, 4],
            up: [0, 0, 1],
            radius: 42,
        }));
        expect(viewerB.canvas3d.requestDraw).toHaveBeenCalled();
    });

    it('syncs camera changes from viewer B to viewer A', () => {
        const cameraA = createMockCamera(10);
        const cameraB = createMockCamera(20);
        const viewerA = createMockViewer(cameraA);
        const viewerB = createMockViewer(cameraB);

        render(
            <SyncButton
                viewerA={viewerA as any}
                viewerB={viewerB as any}
                activeViewer={'A'}
                disabled={false}
                syncEnabled={true}
                setSyncEnabled={() => {}}
                id={syncSelectIdSuffix}
            />
        );

        act(() => {
            cameraB.emit({ position: [3, 2, 1], target: [1, 2, 3], up: [1, 0, 0], radius: 77 });
        });

        expect(cameraA.setState).toHaveBeenCalledWith(expect.objectContaining({
            position: [3, 2, 1],
            target: [1, 2, 3],
            up: [1, 0, 0],
            radius: 77,
        }));
        expect(viewerA.canvas3d.requestDraw).toHaveBeenCalled();
    });
});
