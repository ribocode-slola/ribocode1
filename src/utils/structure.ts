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
