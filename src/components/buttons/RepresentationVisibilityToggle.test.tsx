import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import RepresentationVisibilityToggle from './RepresentationVisibilityToggle';

describe('RepresentationVisibilityToggle', () => {
    it('renders nothing if plugin or rep is missing', () => {
        const { container } = render(<RepresentationVisibilityToggle plugin={null} rep={null} forceUpdate={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('shows visible icon and toggles visibility', async () => {
        const mockToggle = jest.fn().mockResolvedValue(undefined);
        const mockRequestDraw = jest.fn();
        const mockForceUpdate = jest.fn();
        const repRef = 'rep-123';
        const rep = {
            cell: {
                transform: { ref: repRef },
                params: { values: { type: { name: 'cartoon' } } }
            }
        };
        const plugin = {
            state: {
                data: {
                    cells: {
                        get: jest.fn(() => ({ state: { isHidden: false } }))
                    }
                }
            },
            canvas3d: { requestDraw: mockRequestDraw }
        };
        // Patch PluginCommands.State.ToggleVisibility.apply
        jest.spyOn(require('molstar/lib/mol-plugin/commands').PluginCommands.State.ToggleVisibility, 'apply').mockImplementation(async () => { mockToggle(); });
        const { getByRole, getByText } = render(
            <RepresentationVisibilityToggle plugin={plugin as any} rep={rep} forceUpdate={mockForceUpdate} />
        );
        expect(getByRole('button')).toBeInTheDocument();
        expect(getByText('cartoon')).toBeInTheDocument();
        await fireEvent.click(getByRole('button'));
        expect(mockToggle).toHaveBeenCalled();
        expect(mockRequestDraw).toHaveBeenCalled();
        expect(mockForceUpdate).toHaveBeenCalled();
    });
});
