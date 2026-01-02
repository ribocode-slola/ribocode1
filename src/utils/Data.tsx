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
 * @returns The loaded trajectory, model, and structure.
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
    return { trajectory, model, structure };
}

/**
 * Load a molecule from a file into the Molstar viewer.
 * @param viewer The Molstar viewer/plugin instance.
 * @param file The file to load.
 * @returns The loaded trajectory, model, and structure.
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
    return { trajectory, model, structure };
}

/**
 * Atom data extracted from a Mol* structure object.
 */
export type ExtractedAtomData = {
    symbol_type: string[];
    chain_ids: string[];
    xs: number[];
    ys: number[];
    zs: number[];
};

/**
 * Extracts atom types, chain IDs, and coordinates from Mol* atomicHierarchy and atomicConformation objects.
 *
 * @param trajectory The Mol* trajectory object.
 * @returns An object containing symbol_type, chain_ids, xs, ys, zs arrays.
 */
export function extractAtomData(plugin: PluginUIContext, trajectory: any): {
    symbol_type: string[];
    chain_ids: string[];
    xs: number[];
    ys: number[];
    zs: number[];
} {
    // Step 1: Get the cell from the state using trajectory.ref
    const trajCell = plugin.state.data.cells.get(trajectory.ref);
    // Step 2: Inspect the cell and its data
    // console.log('trajCell:', trajCell);
    // console.log('trajCell.obj:', trajCell?.obj);
    if (trajCell?.obj?.data) {
        // console.log('trajCell.obj.data:', trajCell?.obj?.data);
        // Inspect the first frame and representative
        const nframes = trajCell.obj.data.frames.length;
        if (nframes === 0) {
            console.warn('No frames found in trajectory data.');
            return { symbol_type: [], chain_ids: [], xs: [], ys: [], zs: [] };
        } else if (nframes > 1) {
            console.warn(`Multiple frames (${nframes}) found in trajectory data. Centralisation/alignment will be applied only to the first frame.`);
        }
        // console.log('Representative:', trajCell.obj.data.representative);
        const frame = trajCell.obj.data.frames[0];
        if (frame) {
            // console.log('Frame data:', frame);
            if (frame.atomicConformation && frame.atomicHierarchy) {
                // console.log('atomicConformation:', frame.atomicConformation);
                const x: number[] = Array.from(frame.atomicConformation.x);
                const y: number[] = Array.from(frame.atomicConformation.y);
                const z: number[] = Array.from(frame.atomicConformation.z);
                const atoms = frame.atomicHierarchy.atoms;
                // console.log('atoms:', atoms);
                const type_symbol = atoms.type_symbol.__array as string[];
                const auth_asym_id = atoms.auth_asym_id;
                const chain_ids: string[] = [];
                const atomCount = type_symbol.length;
                for (let i = 0; i < atomCount; i++) {
                    chain_ids.push(auth_asym_id.value(i));
                }
                return {
                    symbol_type: type_symbol,
                    chain_ids: chain_ids,
                    xs: x,
                    ys: y,
                    zs: z
                };
            }
        }
    }
    return { symbol_type: [], chain_ids: [], xs: [], ys: [], zs: [] };
}