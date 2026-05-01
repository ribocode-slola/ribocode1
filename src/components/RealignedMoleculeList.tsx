/**
 * RealignedMoleculeList component for displaying and managing realigned molecules in Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React from 'react';
import MoleculeUI from './Molecule';

/**
 * Suffix for the RealignedMoleculeList root id, used for consistent id construction in code and tests.
 */
export const idSuffix = 'realigned-molecule-list';

/**
 * Props for the RealignedMoleculeList component
 * @property molecules The list of realigned molecules to display.
 * @property molstar The molstar instance for managing molecules and representations.
 * @property chainInfo Information about chain labels for zooming.
 * @property residueInfo Information about residue labels for zooming.
 * @property selectedResidueId The currently selected residue ID for zooming.
 * @property realignedStructRefs References to the realigned structures in molstar.
 * @property setRealignedMolecules State setter for updating the list of realigned molecules.
 * @property setRealignedRepRefs State setter for updating the representation references of realigned molecules.
 * @property setRealignedStructRefs State setter for updating the structure references of realigned molecules.
 * @property forceUpdate Function to force a re-render of the component.
 * @property viewerKey A key to identify which viewer this list belongs to (e.g., 'A' or 'B').
 * @property otherMolstar The molstar instance for the other viewer, used for synchronizing actions between viewers.
 * @property otherRealignedStructRefs References to the realigned structures in the other molstar instance.
 * @property setOtherRealignedMolecules State setter for updating the list of realigned molecules in the other viewer.
 * @property setOtherRealignedRepRefs State setter for updating the representation references of realigned molecules in the other viewer.
 * @property setOtherRealignedStructRefs State setter for updating the structure references of realigned molecules in the other viewer.
 * @property idPrefix An optional prefix for the id of the root div, used for consistent id construction in code and tests.
 */
interface RealignedMoleculeListProps {
    molecules: any[];
    molstar: any;
    chainInfo: { chainLabels: Map<string, string> };
    residueInfo: { residueLabels: Map<string, { name: string; insCode?: string }> };
    selectedResidueId: string;
    realignedStructRefs: Record<string, any>;
    setRealignedMolecules: React.Dispatch<React.SetStateAction<any[]>>;
    setRealignedRepRefs: React.Dispatch<React.SetStateAction<any>>;
    setRealignedStructRefs: React.Dispatch<React.SetStateAction<any>>;
    forceUpdate: () => void;
    viewerKey: string;
    otherMolstar: any;
    otherRealignedStructRefs: Record<string, any>;
    setOtherRealignedMolecules: React.Dispatch<React.SetStateAction<any[]>>;
    setOtherRealignedRepRefs: React.Dispatch<React.SetStateAction<any>>;
    setOtherRealignedStructRefs: React.Dispatch<React.SetStateAction<any>>;
    idPrefix?: string;
}

/**
 * Component for displaying and managing realigned molecules in Ribocode.
 * @param {RealignedMoleculeListProps} props - The props for the RealignedMoleculeList component.
 * @returns The RealignedMoleculeList component.
 */
const RealignedMoleculeList: React.FC<RealignedMoleculeListProps> = ({
    molecules,
    molstar,
    chainInfo,
    residueInfo,
    selectedResidueId,
    realignedStructRefs,
    setRealignedMolecules,
    setRealignedRepRefs,
    setRealignedStructRefs,
    forceUpdate,
    viewerKey,
    otherMolstar,
    otherRealignedStructRefs,
    setOtherRealignedMolecules,
    setOtherRealignedRepRefs,
    setOtherRealignedStructRefs,
    idPrefix
}) => {
    // Helper to create zoom handlers (stub, should be passed in or implemented as needed)
    const createZoomHandler = (viewerRef: any, structRef: any, type: string, chainId: string, isB: boolean, ...rest: any[]) => ({
        handleButtonClick: () => {},
    });
    return (
        <div className="realigned-molecule-list" id={idPrefix ? `${idPrefix}-${idSuffix}` : idSuffix}>
            {molecules.map(mol => {
                const plugin = molstar.pluginRef.current;
                const repRefs: string[] = molstar.representationRefs[mol.id] || [];
                let isVisible = false;
                if (plugin && repRefs.length > 0) {
                    isVisible = repRefs.some((ref: string) => {
                        const cell = plugin.state?.data?.cells?.get(ref);
                        return cell?.state?.isHidden !== true;
                    });
                }
                // Use 'to' chain for zoom
                const chainId = mol.to;
                const chainLabel = chainInfo.chainLabels.get(chainId) || chainId || '';
                const chainZoomHandler = createZoomHandler(
                    molstar.pluginRef,
                    realignedStructRefs[mol.id],
                    'chain-test',
                    chainId,
                    viewerKey === 'B'
                );
                // Residue zoom: use selected residue for aligned chain if available
                const residueId = selectedResidueId;
                const residueLabel = residueInfo.residueLabels.get(residueId)?.name || '';
                const residueZoomHandler = createZoomHandler(
                    molstar.pluginRef,
                    realignedStructRefs[mol.id],
                    'residue-test',
                    chainId,
                    viewerKey === 'B',
                    undefined,
                    residueId,
                    residueInfo.residueLabels.get(residueId)?.insCode
                );
                return (
                    <MoleculeUI
                        key={mol.id}
                        label={mol.label}
                        plugin={plugin}
                        isVisible={isVisible}
                        idPrefix={idPrefix ? `${idPrefix}-realigned-${mol.id}` : undefined}
                        onToggleVisibility={() => {
                            repRefs.forEach(ref => {
                                const plugin = molstar.pluginRef.current;
                                if (!plugin) return;
                                const cell = plugin.state?.data?.cells?.get(ref);
                                if (cell) {
                                    import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                        PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
                                        plugin.canvas3d?.requestDraw?.();
                                        forceUpdate();
                                    });
                                }
                            });
                        }}
                        chainZoomLabel={chainLabel}
                        onChainZoom={chainZoomHandler.handleButtonClick}
                        chainZoomDisabled={!chainId}
                        residueZoomLabel={residueLabel}
                        onResidueZoom={residueZoomHandler.handleButtonClick}
                        residueZoomDisabled={!residueId}
                        isLoaded={true}
                        forceUpdate={forceUpdate}
                        representationRefs={repRefs}
                        onDeleteRepresentation={ref => {
                            const repId = Object.entries(molstar.repIdMap[mol.id] || {}).find(([id, r]) => r === ref)?.[0];
                            if (repId) {
                                molstar.deleteRepresentation(molstar.repIdMap[mol.id][repId], mol.id, molstar);
                            } else {
                                molstar.deleteRepresentation(ref, mol.id, molstar);
                            }
                            if (realignedStructRefs[mol.id]) molstar.refreshRepresentationRefs(mol.id, realignedStructRefs[mol.id]);
                            forceUpdate();
                        }}
                        onToggleRepVisibility={ref => {
                            const plugin = molstar.pluginRef.current;
                            if (!plugin) return;
                            const cell = plugin.state?.data?.cells?.get(ref);
                            if (cell) {
                                import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                    PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref }]);
                                    plugin.canvas3d?.requestDraw?.();
                                    forceUpdate();
                                });
                            }
                        }}
                        onRemove={async () => {
                            async function removeTopNode(molstar: any, structRef: any) {
                                if (!structRef || !molstar.pluginRef.current) return;
                                const plugin = molstar.pluginRef.current;
                                const state = plugin.state.data;
                                const cell = state.cells.get(structRef);
                                if (cell) {
                                    console.log('Mol* REMOVE: structRef', structRef, 'type:', cell.obj?.type?.name, 'label:', cell.obj?.label);
                                } else {
                                    console.warn('Mol* REMOVE: structRef', structRef, 'not found in state.cells');
                                }
                                await import('molstar/lib/mol-plugin/commands').then(async ({ PluginCommands }) => {
                                    await PluginCommands.State.RemoveObject.apply(plugin, [plugin, { state: plugin.state.data, ref: structRef }]);
                                });
                            }
                            await Promise.all([
                                removeTopNode(molstar, realignedStructRefs[mol.id]),
                                removeTopNode(otherMolstar, otherRealignedStructRefs[mol.id])
                            ]);
                            setRealignedMolecules((prev: any[]) => prev.filter(m => m.id !== mol.id));
                            setOtherRealignedMolecules((prev: any[]) => prev.filter(m => m.id !== mol.id));
                            setRealignedRepRefs((prev: any) => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                            setOtherRealignedRepRefs((prev: any) => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                            setRealignedStructRefs((prev: any) => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                            setOtherRealignedStructRefs((prev: any) => { const copy = { ...prev }; delete copy[mol.id]; return copy; });
                            forceUpdate();
                        }}
                    />
                );
            })}
        </div>
    );
};

export default RealignedMoleculeList;
