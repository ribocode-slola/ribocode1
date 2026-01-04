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

// /**
//  * Extracts atom types, chain IDs, and coordinates from Mol* atomicHierarchy and atomicConformation objects.
//  *
//  * @param plugin The Mol* PluginUIContext instance.
//  * @param trajectory The Mol* trajectory object.
//  * @returns An object containing arrays of atom types, chain IDs, and x, y, z coordinates.
//  */
// export function getAtomData(plugin: PluginUIContext, trajectory: any, filterChainId?: string): { symbolTypes: string[]; chainIds: string[]; xs: number[]; ys: number[]; zs: number[] } {
//     let symbolTypes: string[] = [];
//     let chainIds: string[] = [];
//     let xs: number[] = [];
//     let ys: number[] = [];
//     let zs: number[] = [];
//     // Step 1: Get the cell from the state using trajectory.ref
//     const trajCell = plugin.state.data.cells.get(trajectory.ref);
//     // Step 2: Inspect the cell and its data
//     // console.log('trajCell:', trajCell);
//     // console.log('trajCell.obj:', trajCell?.obj);
//     if (trajCell?.obj?.data) {
//         // console.log('trajCell.obj.data:', trajCell?.obj?.data);
//         // Inspect the first frame and representative
//         const frames = trajCell.obj.data.frames;
//         const nframes = frames.length;
//         if (nframes === 0) {
//             console.warn('No frames found in trajectory data.');
//             return { symbolTypes, chainIds, xs, ys, zs };
//         } else if (nframes > 1) {
//             console.warn(`Multiple frames (${nframes}) found in trajectory data. Centralisation/alignment will be applied only to the first frame.`);
//         }
//         // console.log('Representative:', trajCell.obj.data.representative);
//         const frame = frames[0];
//         if (frame) {
//             if (frame.atomicConformation && frame.atomicHierarchy) {
//                 xs = Array.from(frame.atomicConformation.x);
//                 ys = Array.from(frame.atomicConformation.y);
//                 zs = Array.from(frame.atomicConformation.z);
//                 const atoms = frame.atomicHierarchy.atoms;
//                 const chains = frame.atomicHierarchy.chains;
//                 for (let i = 0; i < atoms._rowCount; i++) {
//                     let chainId = '';
//                     if (i === 0) {
//                         console.log('[getAtomData] atoms:', atoms);
//                         console.log('[getAtomData] atoms.chainIndex:', atoms.chainIndex);
//                         console.log('[getAtomData] chains.auth_asym_id:', chains.auth_asym_id);
//                     }
//                     if (
//                         atoms.chainIndex &&
//                         typeof atoms.chainIndex.value === 'function' &&
//                         chains &&
//                         chains.auth_asym_id &&
//                         typeof chains.auth_asym_id.value === 'function'
//                     ) {
//                         const chainIdx = atoms.chainIndex.value(i);
//                         chainId = chains.auth_asym_id.value(chainIdx);
//                         if (i < 10) {
//                             console.log(`[getAtomData] atom ${i}: chainIdx=${chainIdx}, chainId='${chainId}'`);
//                         }
//                     } else {
//                         if (i < 10) {
//                             console.warn(`[getAtomData] atom ${i}: Missing chainIndex or auth_asym_id`);
//                         }
//                     }
//                     chainIds.push(chainId);
//                     if (atoms.type_symbol && typeof atoms.type_symbol.value === 'function') {
//                         symbolTypes.push(atoms.type_symbol.value(i));
//                     } else {
//                         symbolTypes.push('');
//                     }
//                 }
//             }
//         }
//     }
//     return { symbolTypes, chainIds, xs, ys, zs };
// }

/**
 * Robustly extract atom data (symbol type, chain ID, coordinates) from a Mol* structure object using structure.units.
 * Optionally filter by chainId.
 */
export function getAtomDataFromStructureUnits(structure: any, filterChainId?: string) {
    const symbolTypes: string[] = [];
    const chainIds: string[] = [];
    const xs: number[] = [];
    const ys: number[] = [];
    const zs: number[] = [];
    const uniqueChainIds = new Set<string>();
    if (!structure) return { symbolTypes, chainIds, xs, ys, zs };
    const units = structure.data?.units ?? structure.units;
    if (!units) return { symbolTypes, chainIds, xs, ys, zs };
    if (units.length > 0) {
        console.log('[getAtomDataFromStructureUnits] First unit:', units[0]);
        if (units[0].model) {
            console.log('[getAtomDataFromStructureUnits] First unit.model:', units[0].model);
        }
    }
    // Find chainIdx for filterChainId (if provided)
    let chainIdxToMatch: number | undefined = undefined;
    let chains: any = undefined;
    if (units.length > 0) {
        const model = units[0].model;
        chains = model.atomicHierarchy.chains;
        if (filterChainId && chains && chains.auth_asym_id && typeof chains.auth_asym_id.value === 'function') {
            for (let i = 0; i < chains._rowCount; i++) {
                if (chains.auth_asym_id.value(i) === filterChainId) { chainIdxToMatch = i; break; }
            }
        }
    }
    for (const unit of units) {
        // Only atomic units
        if (unit.kind !== 0) continue;
        const model = unit.model;
        const elements = unit.elements;
        const atoms = model.atomicHierarchy.atoms;
        const conformation = model.atomicConformation;
        const chainIndex = unit.chainIndex;
        for (let i = 0; i < elements.length; i++) {
            const atomIdx = elements[i];
            let chainIdx = chainIndex ? chainIndex[atomIdx] : undefined;
            let chainId = '';
            if (chains && chains.auth_asym_id && typeof chains.auth_asym_id.value === 'function' && chainIdx !== undefined) {
                chainId = chains.auth_asym_id.value(chainIdx);
            }
            if (chainId) uniqueChainIds.add(chainId);
            if (filterChainId && chainIdx !== chainIdxToMatch) continue;
            // Atom type
            let symbol = '';
            if (atoms.type_symbol && typeof atoms.type_symbol.value === 'function') {
                symbol = atoms.type_symbol.value(atomIdx);
            }
            // Coordinates
            let x = conformation.x?.[atomIdx] ?? NaN;
            let y = conformation.y?.[atomIdx] ?? NaN;
            let z = conformation.z?.[atomIdx] ?? NaN;
            symbolTypes.push(symbol);
            chainIds.push(chainId);
            xs.push(x);
            ys.push(y);
            zs.push(z);
        }
    }
    console.log('[getAtomDataFromStructureUnits] Unique chain IDs in structure:', Array.from(uniqueChainIds));
    return { symbolTypes, chainIds, xs, ys, zs };
}