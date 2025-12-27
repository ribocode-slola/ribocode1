/**
 * RepresentationVisibilityToggle component for toggling the visibility of a molecular representation.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { VisibilityOutlinedSvg, VisibilityOffOutlinedSvg } from 'molstar/lib/mol-plugin-ui/controls/icons';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

/**
 * Props for the RepresentationVisibilityToggle component.
 * @param plugin The Mol* PluginUIContext instance.
 * @param rep The representation object whose visibility is to be toggled.
 * @param forceUpdate A function to force the parent component to re-render.
 */
interface RepresentationVisibilityToggleProps {
    plugin: PluginUIContext | null;
    rep: any;
    forceUpdate: () => void;
}

/**
 * A button component to toggle the visibility of a molecular representation.
 * @param plugin The Mol* PluginUIContext instance.
 * @param rep The representation object whose visibility is to be toggled.
 * @param forceUpdate A function to force the parent component to re-render.
 * @returns The RepresentationVisibilityToggle component.
 */
const RepresentationVisibilityToggle: React.FC<RepresentationVisibilityToggleProps> = ({ plugin, rep, forceUpdate }) => {
    if (!plugin || !rep) return null;
    const cell = plugin.state.data.cells.get(rep.cell.transform.ref);
    // Treat undefined isHidden as visible (Mol* default)
    const isVisible = cell?.state?.isHidden !== true;
    const handleToggle = async () => {
        await PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: rep.cell.transform.ref }]);
        plugin.canvas3d?.requestDraw?.();
        forceUpdate();
    };
    return (
        <button
            key={rep.cell?.transform?.ref}
            onClick={handleToggle}
            style={{ marginLeft: 4 }}
        >
            {isVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
            <span style={{ marginLeft: 4, fontSize: '0.9em' }}>{rep.cell?.params?.values?.type?.name || 'repr'}</span>
        </button>
    );
};

export default RepresentationVisibilityToggle;
