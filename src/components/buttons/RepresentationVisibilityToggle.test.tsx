import { vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';




import RepresentationVisibilityToggle from './RepresentationVisibilityToggle';

describe('RepresentationVisibilityToggle', () => {
    it('renders nothing if plugin or rep is missing', () => {
        const { container } = render(<RepresentationVisibilityToggle plugin={null} rep={null} forceUpdate={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('shows visible icon and toggles visibility', async () => {
        const mockToggleVisibility = vi.fn().mockResolvedValue(undefined);
        const mockRequestDraw = vi.fn();
        const mockForceUpdate = vi.fn();
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
                        get: vi.fn(() => ({ state: { isHidden: false } }))
                    }
                }
            },
            canvas3d: { requestDraw: mockRequestDraw },
            commands: {
                dispatch: vi.fn()
            }
        };
        const { getByRole, getByText } = render(
            <RepresentationVisibilityToggle
                plugin={plugin as any}
                rep={rep}
                forceUpdate={mockForceUpdate}
                toggleVisibility={mockToggleVisibility}
            />
        );
        expect(getByRole('button')).toBeInTheDocument();
        expect(getByText('cartoon')).toBeInTheDocument();
        await fireEvent.click(getByRole('button'));
        expect(mockToggleVisibility).toHaveBeenCalledWith(plugin, repRef);
        expect(mockRequestDraw).toHaveBeenCalled();
        expect(mockForceUpdate).toHaveBeenCalled();
    });
});
