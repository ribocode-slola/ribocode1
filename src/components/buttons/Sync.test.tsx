import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SyncButton from './Sync';

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
            />
        );
        expect(getByLabelText('Select Sync').value).toBe('Off');
        rerender(
            <SyncButton
                viewerA={null}
                viewerB={null}
                activeViewer={'A'}
                disabled={false}
                syncEnabled={true}
                setSyncEnabled={() => {}}
            />
        );
        expect(getByLabelText('Select Sync').value).toBe('On');
    });

    it('calls setSyncEnabled when option is changed', () => {
        const setSyncEnabled = jest.fn();
        const { getByLabelText } = render(
            <SyncButton
                viewerA={null}
                viewerB={null}
                activeViewer={'A'}
                disabled={false}
                syncEnabled={false}
                setSyncEnabled={setSyncEnabled}
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
            />
        );
        expect(getByLabelText('Select Sync')).toBeDisabled();
    });
});
