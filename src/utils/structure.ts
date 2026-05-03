/**
 * Utility functions for working with molecular structures in the Mol* plugin, including camera focus on specific loci, and retrieval of structure representations for session management.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { QueryContext } from 'molstar/lib/mol-model/structure/query/context';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/base';

/**
 * Focus the camera on a residue loci, with optional sync to another plugin.
 * Accepts zoom options for extraRadius and minRadius.
 */
export function focusLociOnResidue(
    plugin: PluginUIContext,
    structureRef: string,
    chainId: string,
    residueId: string,
    insCode?: string,
    syncPlugin?: PluginUIContext,
    zoomExtraRadius?: number,
    zoomMinRadius?: number,
    getResidueLociFn: (plugin: PluginUIContext, structureRef: string, chainId: string, residueId: string, insCode?: string) => any = getResidueLoci
) {
    const loci = getResidueLociFn(plugin, structureRef, chainId, residueId, insCode);
    if (!loci) return;
    const focusOptions = (zoomExtraRadius !== undefined && zoomMinRadius !== undefined)
        ? { extraRadius: zoomExtraRadius, minRadius: zoomMinRadius }
        : undefined;
    plugin.managers.camera.focusLoci(loci, focusOptions);
    if (syncPlugin) {
        syncPlugin.managers.camera.focusLoci(loci, focusOptions);
    }
}

/**
 * Computes the loci for a given chain in a structure using Mol* APIs.
 */
export function getChainLoci(plugin: PluginUIContext, structureRef: string, chainId: string) {
    const structureObj = plugin.managers.structure.hierarchy.current.structures.find(
        s => s.cell.transform.ref === structureRef
    )?.cell.obj?.data;
    if (!structureObj) return null;
    const qb = MolScriptBuilder.struct.generator.atomGroups({
        'chain-test': MolScriptBuilder.core.rel.eq([
            MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
            chainId
        ])
    });
    const compiled = compile(qb);
    const ctx = new QueryContext(structureObj);
    const selection = compiled(ctx);
    return StructureSelection.toLociWithSourceUnits(selection);
}

/**
 * Focus the camera on a chain loci, with optional sync to another plugin.
 */
export function focusLociOnChain(
    plugin: PluginUIContext,
    structureRef: string,
    chainId: string,
    syncPlugin?: PluginUIContext,
    getChainLociFn: (plugin: PluginUIContext, structureRef: string, chainId: string) => any = getChainLoci
) {
    const loci = getChainLociFn(plugin, structureRef, chainId);
    if (!loci) return;
    plugin.managers.camera.focusLoci(loci);
    if (syncPlugin) {
        syncPlugin.managers.camera.focusLoci(loci);
    }
}

/**
 * Computes the loci for a given residue in a chain, optionally with insertion code.
 */
export function getResidueLoci(
    plugin: PluginUIContext,
    structureRef: string,
    chainId: string,
    residueId: string,
    insCode?: string
) {
    const structureObj = plugin.managers.structure.hierarchy.current.structures.find(
        s => s.cell.transform.ref === structureRef
    )?.cell.obj?.data;
    if (!structureObj) return null;
    // Build query with optional insertion code
    const parsedResidueId = (typeof residueId === 'string' && !isNaN(Number(residueId))) ? Number(residueId) : residueId;
    const tests: any = {
        'chain-test': MolScriptBuilder.core.rel.eq([
            MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
            chainId
        ]),
        'residue-test': MolScriptBuilder.core.rel.eq([
            MolScriptBuilder.struct.atomProperty.macromolecular.auth_seq_id(),
            parsedResidueId
        ])
    };
    if (insCode) {
        tests['inscode-test'] = MolScriptBuilder.core.rel.eq([
            MolScriptBuilder.struct.atomProperty.macromolecular.pdbx_PDB_ins_code(),
            insCode
        ]);
    }
    const qb = MolScriptBuilder.struct.generator.atomGroups(tests);
    const compiled = compile(qb);
    const ctx = new QueryContext(structureObj);
    const selection = compiled(ctx);
    return StructureSelection.toLociWithSourceUnits(selection);
}

/**
 * Utility to get all Representation3D nodes for a structure.
 *
 * This function is useful for session save/restore logic, allowing you to capture
 * and later restore the full set of 3D representations (type, parameters, color themes, etc.)
 * for a given structure in the Mol* plugin state.
 *
 * @param plugin The Mol* plugin instance.
 * @param structureRef The structure reference to inspect.
 * @returns Array of representation info objects for the structure.
 */
export function getStructureRepresentations(plugin: any, structureRef: string) {
    const state = plugin.state.data;
    const reps = [];
    const children = state.tree.children.get(structureRef)?.toArray() || [];
    for (const childRef of children) {
        const cell = state.cells.get(childRef);
        if (cell?.obj?.type?.name === 'Structure Component') {
            const compChildren = state.tree.children.get(childRef)?.toArray() || [];
            for (const repRef of compChildren) {
                const repCell = state.cells.get(repRef);
                if (repCell?.obj?.type?.name === 'Representation3D') {
                    reps.push({
                        type: repCell.obj?.type?.name,
                        params: repCell.params,
                        colorTheme: repCell.obj?.props?.colorTheme,
                        repRef: repRef
                    });
                }
            }
        }
    }
    return reps;
}
