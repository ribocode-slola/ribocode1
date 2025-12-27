/**
 * Data utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Asset } from 'molstar/lib/mol-util/assets';

/**
 * Load a molecule from a URL into the Molstar viewer.
 * @param viewer The Molstar viewer/plugin instance.
 * @param molecule The molecule to load, with id and url.
 * @returns The loaded structure.
 */
export async function loadMoleculeToViewer(viewer: PluginUIContext, molecule: { id: string; url: string }) {
    const data = await viewer.builders.data.download(
        { url: molecule.url },
        { state: { isGhost: true } }
    );
    if (!data) return;
    const trajectory = await viewer.builders.structure.parseTrajectory(data, 'mmcif');
    const model = await viewer.builders.structure.createModel(trajectory);
    const structure = await viewer.builders.structure.createStructure(model);
    await viewer.builders.structure.hierarchy.applyPreset(trajectory, 'default');
    return structure;
}

/**
 * Load a molecule from a file into the Molstar viewer.
 * @param viewer The Molstar viewer/plugin instance.
 * @param file The file to load.
 * @returns The loaded structure.
 */
export async function loadMoleculeFileToViewer(viewer: PluginUIContext, file: Asset.File) {
    const data = await viewer.builders.data.readFile(
        { file, label: file.name },
        { state: { isGhost: true } }
    );
    if (!data) return;
    const trajectory = await viewer.builders.structure.parseTrajectory(data.data, 'mmcif');
    const model = await viewer.builders.structure.createModel(trajectory);
    const structure = await viewer.builders.structure.createStructure(model);
    await viewer.builders.structure.hierarchy.applyPreset(trajectory, 'default');
    return structure;
}