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
import { render, fireEvent } from '@testing-library/react';
import SyncButton from './Sync';
import { idSuffix as syncSelectIdSuffix } from './Sync';

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
});
