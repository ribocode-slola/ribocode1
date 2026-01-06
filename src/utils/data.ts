/**
 * Data utility functions for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';

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
 * Extract atom data (symbol type, chain ID, coordinates) from a Mol* structure.
 * @param structure The Mol* structure object.
 * @param filterChainId Optional chain ID to filter atoms by.
 * @returns An object containing arrays of symbol types, chain IDs, and coordinates (xs, ys, zs).
 */
export function getAtomDataFromStructureUnits(structure: any, filterChainId?: string): {
    symbolTypes: string[];
    chainIds: string[];
    xs: number[];
    ys: number[];
    zs: number[];
} {
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

/**
 * Update atom coordinates and log before/after for verification.
 * @param model The Mol* model object
 * @param xs Array of x coordinates
 * @param ys Array of y coordinates
 * @param zs Array of z coordinates
 */
export function updateAndLogAtomCoordinates(model: any, centroid: Vec3, rotmat: number[]) {
    const xs = model.atomicConformation.x;
    const ys = model.atomicConformation.y;
    const zs = model.atomicConformation.z;
    const n = xs.length;
    const np = Math.floor(n / 3);
    // Log before update
    console.log('Preparing to update atom coordinates:');
    for (let i = 0; i < n; i++) {
        if (i % np === 0) {
            console.log(`Preparing to update atom ${i}: new coords x=${xs[i]}, y=${ys[i]}, z=${zs[i]}`);
        }
    }
    // Recentering
    for (let i = 0; i < n; i++) {
        xs[i] = xs[i] - centroid[0];
        ys[i] = ys[i] - centroid[1];
        zs[i] = zs[i] - centroid[2];
    }
    // Rotation
    for (let i = 0; i < n; i++) {
        const x = xs[i];
        const y = ys[i];
        const z = zs[i];
        xs[i] = rotmat[0] * x + rotmat[1] * y + rotmat[2] * z;
        ys[i] = rotmat[3] * x + rotmat[4] * y + rotmat[5] * z;
        zs[i] = rotmat[6] * x + rotmat[7] * y + rotmat[8] * z;
    }
    // Reassign updated coordinates
    model.atomicConformation.x = xs;
    model.atomicConformation.y = ys;
    model.atomicConformation.z = zs;
    // Log after update
    console.log('Atom coordinates updated.');
    for (let i = 0; i < n; i++) {
        if (i % np === 0) {
            console.log(`Updated atom ${i}: new coords x=${model.atomicConformation.x[i]}, y=${model.atomicConformation.y[i]}, z=${model.atomicConformation.z[i]}`);
        }
    }
}