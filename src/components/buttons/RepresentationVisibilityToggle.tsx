/**
 * RepresentationVisibilityToggle component for toggling the visibility of a molecular representation.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React from 'react';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { VisibilityOutlinedSvg, VisibilityOffOutlinedSvg } from 'molstar/lib/mol-plugin-ui/controls/icons';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

/**
 * Suffix for the RepresentationVisibilityToggle id, used for consistent id construction in code and tests.
 */
export const idSuffix = 'toggle-visibility-rep';

/**
 * Props for the RepresentationVisibilityToggle component.
 * @param plugin The Mol* PluginUIContext instance.
 * @param rep The representation object whose visibility is to be toggled.
 * @param forceUpdate A function to force the parent component to re-render.
 */
interface RepresentationVisibilityToggleProps {
    plugin: PluginUIContext | null
    rep: any
    forceUpdate: () => void
    toggleVisibility?: (plugin: PluginUIContext, repRef: any) => Promise<void>
    idPrefix?: string;
}

/**
 * A button component to toggle the visibility of a molecular representation.
 * @param plugin The Mol* PluginUIContext instance.
 * @param rep The representation object whose visibility is to be toggled.
 * @param forceUpdate A function to force the parent component to re-render.
 * @returns The RepresentationVisibilityToggle component.
 */
const RepresentationVisibilityToggle: React.FC<RepresentationVisibilityToggleProps> = ({ plugin, rep, forceUpdate, toggleVisibility, idPrefix }) => {
    if (!plugin || !rep) return null;
    const cell = plugin.state.data.cells.get(rep.cell.transform.ref);
    // Treat undefined isHidden as visible (Mol* default)
    const isVisible = cell?.state?.isHidden !== true;
    const handleToggle = async () => {
        if (toggleVisibility) {
            await toggleVisibility(plugin, rep.cell.transform.ref);
        } else {
            await PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: rep.cell.transform.ref }]);
        }
        plugin.canvas3d?.requestDraw?.();
        forceUpdate();
    };
    return (
        <button
            key={rep.cell?.transform?.ref}
            onClick={handleToggle}
            id={idPrefix ? `${idPrefix}-${idSuffix}-${rep.cell?.transform?.ref}` : undefined}
        >
            {isVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
            <span>{rep.cell?.params?.values?.type?.name || 'repr'}</span>
        </button>
    );
};

export default RepresentationVisibilityToggle;
