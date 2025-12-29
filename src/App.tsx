/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import MoleculeRow from './components/MoleculeRow';
import RepresentationSelectButton from './components/select/RepresentationSelectButton';
import LoadDataRow from './components/LoadDataRow';
import { SyncProvider } from './SyncContext';
import MolstarContainer from './components/MolstarContainer';
import { parseColorFileContent, createChainColorTheme } from './utils/Colors';
import { parseDictionaryFileContent } from './utils/Dictionary';
import { toggleVisibility, ViewerKey, ViewerState } from './components/RibocodeViewer';
//import './App.css';
import { loadMoleculeFileToViewer, Molecule } from 'molstar/lib/extensions/ribocode/structure';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { QueryContext } from 'molstar/lib/mol-model/structure/query/context';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/base';
import { allowedRepresentationTypes, AllowedRepresentationType } from './types/Representation';
import { useMolstarViewer } from './hooks/useMolstarViewer';
import { set } from 'lodash';

// Constants for structure ref keys.
export const s_AlignedTo: string = 'AlignedTo';
export const s_Aligned: string = 'Aligned';

/**
 * The main App component.
 * @returns The main App component.
 */
const App: React.FC = () => {

    // Create plugin refs and pass to useMolstarViewers
    const pluginRefA = useRef<PluginUIContext | null>(null);
    const pluginRefB = useRef<PluginUIContext | null>(null);
    const molstarA = useMolstarViewer(pluginRefA);
    const molstarB = useMolstarViewer(pluginRefB);

    // Initialize viewer states.
    const viewerA: ViewerState = useViewerState('A');
    const viewerB: ViewerState = useViewerState('B');
    const setViewerAWrapper = useCallback((viewer: PluginUIContext) => {
        viewerA.ref.current = viewer;
    }, [viewerA]);
    const setViewerBWrapper = useCallback((viewer: PluginUIContext) => {
        viewerB.ref.current = viewer;
    }, [viewerB]);
    const [viewerAReady, setViewerAReady] = useState(false);
    const [viewerBReady, setViewerBReady] = useState(false);
    const [syncEnabled, setSyncEnabled] = useState(false);

    // Viewer state management
    // -----------------------
    const [activeViewer, setActiveViewer] = useState<ViewerKey>('A');
    // Custom hook to manage viewer state.
    function useViewerState(viewerKey: ViewerKey): ViewerState {
        const [moleculeAlignedTo, setMoleculeAlignedTo] = useState<Molecule>();
        const [moleculeAligned, setMoleculeAligned] = useState<Molecule>();
        const [isMoleculeAlignedToLoaded, setIsMoleculeAlignedToLoaded] = useState(false);
        const [isMoleculeAlignedLoaded, setIsMoleculeAlignedLoaded] = useState(false);
        const [isMoleculeAlignedToVisible, setIsMoleculeAlignedToVisible] = useState(false);
        const [isMoleculeAlignedVisible, setIsMoleculeAlignedVisible] = useState(false);
        const ref = useRef<PluginUIContext | null>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const handleFileInputButtonClick = useCallback(() => {
            fileInputRef.current?.click();
        }, []);
        const setViewerRef = useCallback((viewer: PluginUIContext) => {
            ref.current = viewer;
        }, []);
        return {
            moleculeAlignedTo: moleculeAlignedTo,
            setMoleculeAlignedTo: setMoleculeAlignedTo,
            moleculeAligned: moleculeAligned,
            setMoleculeAligned: setMoleculeAligned,
            isMoleculeAlignedToLoaded: isMoleculeAlignedToLoaded,
            setIsMoleculeAlignedToLoaded: setIsMoleculeAlignedToLoaded,
            isMoleculeAlignedLoaded: isMoleculeAlignedLoaded,
            setIsMoleculeAlignedLoaded: setIsMoleculeAlignedLoaded,
            isMoleculeAlignedToVisible: isMoleculeAlignedToVisible,
            setIsMoleculeAlignedToVisible: setIsMoleculeAlignedToVisible,
            isMoleculeAlignedVisible: isMoleculeAlignedVisible,
            setIsMoleculeAlignedVisible: setIsMoleculeAlignedVisible,
            ref: ref,
            fileInputRef: fileInputRef,
            handleFileInputButtonClick: handleFileInputButtonClick,
            setViewerRef: setViewerRef,
            viewerKey: viewerKey
        };
    }

    // Generic file input hook.
    function useFileInput<T>(
        parseFn: (text: string, file: File) => Promise<T>,
        initialValue: T
    ) {
        // State and refs for file input handling.
        const [data, setData] = useState<T>(initialValue);
        const inputRef = useRef<HTMLInputElement>(null);
        // Handlers for button click and file change.
        const handleButtonClick = () => {
            inputRef.current?.click();
        };
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async () => {
                    const text = reader.result as string;
                    const parsed = await parseFn(text, file); // Pass both text and file
                    setData(parsed);
                    console.log('data:', parsed);
                };
                reader.readAsText(file);
            }
        };
        return { data, setData, inputRef, handleButtonClick, handleFileChange };
    }

    // File inputs for dictionary and colors.
    const dictionaryFile = useFileInput<Array<Record<string, string>>>(parseDictionaryFileContent, []);
    const alignmentFile = useFileInput<Array<Record<string, string>>>(parseDictionaryFileContent, []);
    const [isMoleculeAlignedToColoursLoaded, setIsMoleculeAlignedToColoursLoaded] = useState(false);
    const [isMoleculeAlignedColoursLoaded, setIsMoleculeAlignedColoursLoaded] = useState(false);
    const colorsAlignedToFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    const colorsAlignedFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    // Chain color map state.
    const [chainColorMaps] = useState<Map<string, Map<string, Color>>>(new Map());
    // Chain ID selection state.
    const [chainIdsAlignedTo, setChainIdsAlignedTo] = useState<string[]>([]);
    const [selectedChainIdAlignedTo, setSelectedChainIdAlignedTo] = useState<string>('');
    const [chainIdsAligned, setChainIdsAligned] = useState<string[]>([]);
    const [selectedChainIdAligned, setSelectedChainIdAligned] = useState<string>('');
    // Residue ID selection state.
    const [residueIdsAlignedTo, setResidueIdsAlignedTo] = useState<string[]>([]);
    const [selectedResidueIdAlignedTo, setSelectedResidueIdAlignedTo] = useState<string>('');
    const [residueIdsAligned, setResidueIdsAligned] = useState<string[]>([]);
    const [selectedResidueIdAligned, setSelectedResidueIdAligned] = useState<string>('');
    
    // Handle file changes for molecule loading.
    type FileChangeMode = 'alignedTo' | 'aligned';

    const handleFileChange = useCallback(
        async (
            e: React.ChangeEvent<HTMLInputElement>,
            mode: FileChangeMode
        ) => {
            const pluginA = viewerA.ref.current;
            const pluginB = viewerB.ref.current;
            if (!pluginA || !pluginB) {
                console.error('One or both viewers are not initialized.');
                return;
            }
            try {
                const file = e.target.files?.[0];
                if (!file) return;
                const assetFile = Asset.File(new File([file], file.name));
                if (mode === 'alignedTo') {
                    // Load alignedTo molecule into both viewers:
                    // Viewer A
                    const viewerAMoleculeAlignedTo = await loadMoleculeFileToViewer(
                        pluginA, assetFile, true, true
                    );
                    if (!viewerAMoleculeAlignedTo) {
                        console.error('Failed to load molecule into viewer A.');
                        return;
                    }
                    viewerA.setMoleculeAlignedTo(prev => ({
                        label: viewerAMoleculeAlignedTo.label,
                        name: viewerAMoleculeAlignedTo.name,
                        filename: viewerAMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                        presetResult: viewerAMoleculeAlignedTo.presetResult ?? "Unknown",
                        alignmentData: viewerAMoleculeAlignedTo.alignmentData
                    }));
                    // Set structureRef for robust lookup and start robust polling
                    const structureA = pluginA.managers.structure.hierarchy.current.structures[0];
                    if (structureA) {
                        const ref = structureA.cell.transform.ref;
                        molstarA.setStructureRef(s_AlignedTo, ref);
                    }
                    viewerA.setIsMoleculeAlignedToLoaded(true);
                    viewerA.setIsMoleculeAlignedToVisible(true);
                    // Viewer B
                    const viewerBMoleculeAlignedTo = await loadMoleculeFileToViewer(
                        pluginB, assetFile, false, true
                    );
                    if (!viewerBMoleculeAlignedTo) {
                        console.error('Failed to load molecule into viewer B.');
                        return;
                    }
                    viewerB.setMoleculeAlignedTo(prev => ({
                        label: viewerBMoleculeAlignedTo.label,
                        name: viewerBMoleculeAlignedTo.name,
                        filename: viewerBMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                        presetResult: viewerBMoleculeAlignedTo.presetResult ?? "Unknown",
                    }));
                    const structureB = pluginB.managers.structure.hierarchy.current.structures[0];
                    if (structureB) {
                        const ref = structureB.cell.transform.ref;
                        molstarB.setStructureRef(s_AlignedTo, ref);
                    }
                    viewerB.setIsMoleculeAlignedToLoaded(true);
                    viewerB.setIsMoleculeAlignedToVisible(true);
                } else if (mode === 'aligned') {
                    // Require alignedTo data to be loaded
                    if (!viewerA.moleculeAlignedTo?.alignmentData) {
                        console.error('AlignedTo molecule must be loaded before loading aligned molecule.');
                        return;
                    }
                    // Load aligned molecule into both viewers using alignment data
                    const alignmentData = viewerA.moleculeAlignedTo.alignmentData;
                    const viewerAMoleculeAligned = await loadMoleculeFileToViewer(
                        pluginA, assetFile, false, true, alignmentData
                    );
                    if (!viewerAMoleculeAligned) {
                        console.error('Failed to load molecule into viewer A.');
                        return;
                    }
                    viewerA.setMoleculeAligned(prev => ({
                        label: viewerAMoleculeAligned.label,
                        name: viewerAMoleculeAligned.name,
                        filename: viewerAMoleculeAligned.filename ?? prev?.filename ?? "",
                        presetResult: viewerAMoleculeAligned.presetResult ?? "Unknown",
                    }));
                    const structureA = pluginA.managers.structure.hierarchy.current.structures[1];
                    if (structureA) {
                        const ref = structureA.cell.transform.ref;
                        molstarA.setStructureRef(s_Aligned, ref);
                    }
                    viewerA.setIsMoleculeAlignedLoaded(true);
                    viewerA.setIsMoleculeAlignedVisible(true);

                    const viewerBMoleculeAligned = await loadMoleculeFileToViewer(
                        pluginB, assetFile, false, true, alignmentData
                    );
                    if (!viewerBMoleculeAligned) {
                        console.error('Failed to load molecule into viewer B.');
                        return;
                    }
                    viewerB.setMoleculeAligned(prev => ({
                        label: viewerBMoleculeAligned.label,
                        name: viewerBMoleculeAligned.name,
                        filename: viewerBMoleculeAligned.filename ?? prev?.filename ?? "",
                        presetResult: viewerBMoleculeAligned.presetResult ?? "Unknown",
                    }));
                    const structureB = pluginB.managers.structure.hierarchy.current.structures[1];
                    if (structureB) {
                        const ref = structureB.cell.transform.ref;
                        molstarB.setStructureRef(s_Aligned, ref);
                    }
                    viewerB.setIsMoleculeAlignedLoaded(true);
                    viewerB.setIsMoleculeAlignedVisible(true);
                }
            } catch (err) {
                console.error('Error loading molecule:', err);
            }
        },
        [viewerA, viewerB]
    );

    /**
     * Handle toggling visibility of a molecule.
     * @param viewer The viewer state.
     * @param moleculeKey The key of the molecule to toggle.
     * @param setVisible The setter function for visibility state.
     * @param isVisible The current visibility state.
     */
    async function handleToggle(viewer: any, moleculeKey: string, setVisible: (v: boolean) => void, isVisible: boolean) {
        const molecule = viewer[moleculeKey];
        const model = molecule?.presetResult && (molecule.presetResult as any).model;
        if (model) {
            await toggleVisibility(viewer, model);
            setVisible(!isVisible);
        }
    }

    // Toggle visibility for moleculeAlignedTo in viewer A.
    const toggleViewerAAlignedTo = {
        handleButtonClick: () =>
            handleToggle(
                viewerA,
                'moleculeAlignedTo',
                viewerA.setIsMoleculeAlignedToVisible,
                viewerA.isMoleculeAlignedToVisible
            ),
    };

    // Toggle visibility for moleculeAligned in viewer A.
    const toggleViewerAAligned = {
        handleButtonClick: () =>
            handleToggle(
                viewerA,
                'moleculeAligned',
                viewerA.setIsMoleculeAlignedVisible,
                viewerA.isMoleculeAlignedVisible
            ),
    };

    // Toggle visibility for moleculeAlignedTo in viewer B.
    const toggleViewerBAlignedTo = {
        handleButtonClick: () =>
            handleToggle(
                viewerB,
                'moleculeAlignedTo',
                viewerB.setIsMoleculeAlignedToVisible,
                viewerB.isMoleculeAlignedToVisible
            ),
    };

    // Toggle visibility for moleculeAligned in viewer B.
    const toggleViewerBAligned = {
        handleButtonClick: () =>
            handleToggle(
                viewerB,
                'moleculeAligned',
                viewerB.setIsMoleculeAlignedVisible,
                viewerB.isMoleculeAlignedVisible
            ),
    };

    // Dummy state to force re-render after toggling representation visibility
    const [, setForceUpdate] = useState(0);
    const forceUpdate = () => setForceUpdate(f => f + 1);
    // Get structure refs for both viewers.
    const structureRefAAlignedTo = molstarA.structureRefs[s_AlignedTo];
    const structureRefAAligned = molstarA.structureRefs[s_Aligned];
    const structureRefBAlignedTo = molstarB.structureRefs[s_AlignedTo];
    const structureRefBAligned = molstarB.structureRefs[s_Aligned];

    /**
     * Update colorTheme for a molecule.
     * @param viewer The viewer state.
     * @param molecule The molecule to update.
     * @param colorTheme The color theme to apply.
     * @param type The representation type.
     * @param structureRef The structure ref string for robust lookup.
     * @param setLastAddedRepresentationRef Callback to track last added rep.
     */
    // Use the hook's addRepresentation API for adding/updating representations
    async function updateMoleculeColors(
        viewer: ViewerState,
        molecule: Molecule,
        colorTheme: any,
        type: AllowedRepresentationType,
        structureRef: string | null,
        key: string
    ) {
        if (!structureRef) return;
        let molstar;
        if (structureRef === structureRefAAlignedTo || structureRef === structureRefAAligned) molstar = molstarA;
        else if (structureRef === structureRefBAlignedTo || structureRef === structureRefBAligned) molstar = molstarB;
        else return;
        await molstar.addRepresentation(key, structureRef, type, colorTheme);
    }

    const themeNameAlignedTo = 'alignedTo-custom-chain-colors';
    const themeNameAligned = 'aligned-custom-chain-colors';

    /**
     * Registers a custom chain color theme if it is not already registered.
     * @param plugin The Mol* plugin instance.
     * @param themeName The name of the theme to register.
     * @returns A promise that resolves when the theme is registered.
     */
    function registerThemeIfNeeded(
        plugin: PluginUIContext,
        themeName: string,
    ) {
        if (!plugin) return;
        // Get color theme registry.
        const colorThemeRegistry = plugin.representation.structure.themes.colorThemeRegistry;
        if (!colorThemeRegistry) {
            console.warn('No colorThemeRegistry found in representation structure themes.');
            return;
        }
        console.log('ColorThemeRegistry:', colorThemeRegistry);
        // Remove the old theme if it exists.
        const existingTheme = colorThemeRegistry.get(themeName);
        if (existingTheme) {
            colorThemeRegistry.remove(existingTheme);
            console.log(`Removed old ${themeName} theme.`);
        }
        // Add the new theme.
        colorThemeRegistry.add(
            createChainColorTheme(themeName, chainColorMaps.get(themeName)!) as any
        );
        console.log(`Registered ${themeName} theme.`);
    }

    const [representationTypeAlignedTo, setRepresentationTypeAlignedTo] = useState<AllowedRepresentationType>('spacefill');
    const [representationTypeAligned, setRepresentationTypeAligned] = useState<AllowedRepresentationType>('spacefill');

    // Effects to update colors when files are loaded.
    // AlignedTo:
    useEffect(() => {
        if (colorsAlignedToFile.data && colorsAlignedToFile.data.length > 0) {
            setIsMoleculeAlignedToColoursLoaded(true);
            // Build and set the chain color map before registering the theme
            const themeChainColorMap = new Map<string, Color>();
            colorsAlignedToFile.data.forEach(row => {
                if (row.pdb_chain && row.color) {
                    try {
                        themeChainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                    } catch {
                        console.warn(`Invalid color: ${row.color}`);
                    }
                }
            });
            chainColorMaps.set(themeNameAlignedTo, themeChainColorMap);
            // Register the custom theme on both plugins before updating representations
            if (viewerA.ref.current) {
                registerThemeIfNeeded(viewerA.ref.current, themeNameAlignedTo);
            }
            if (viewerB.ref.current) {
                registerThemeIfNeeded(viewerB.ref.current, themeNameAlignedTo);
            }
            // Do not update representations here; only register the theme and set color map
        }
    }, [colorsAlignedToFile.data, viewerA.moleculeAlignedTo, viewerB.moleculeAlignedTo, representationTypeAlignedTo, structureRefAAlignedTo, structureRefBAlignedTo]);
    // Aligned:
    useEffect(() => {
        if (colorsAlignedFile.data && colorsAlignedFile.data.length > 0) {
            setIsMoleculeAlignedColoursLoaded(true);
            // Build and set the chain color map before registering the theme
            const themeChainColorMap = new Map<string, Color>();
            colorsAlignedFile.data.forEach(row => {
                if (row.pdb_chain && row.color) {
                    try {
                        themeChainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                    } catch {
                        console.warn(`Invalid color: ${row.color}`);
                    }
                }
            });
            chainColorMaps.set(themeNameAligned, themeChainColorMap);
            // Register the custom theme on both plugins before updating representations
            if (viewerA.ref.current) {
                registerThemeIfNeeded(viewerA.ref.current, themeNameAligned);
            }
            if (viewerB.ref.current) {
                registerThemeIfNeeded(viewerB.ref.current, themeNameAligned);
            }
            // Do not update representations here; only register the theme and set color map
        }
    }, [colorsAlignedFile.data, viewerA.moleculeAligned, viewerB.moleculeAligned, representationTypeAligned, structureRefAAligned, structureRefBAligned]);

    // Effect for moleculeAlignedTo Chain ID selection.
    useEffect(() => {
        console.log('Updating chain IDs for moleculeAlignedTo');
        const pluginA = viewerA.ref.current;
        if (!pluginA || !structureRefAAlignedTo) return;
        const structureObj = pluginA.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRefAAlignedTo)?.cell.obj?.data;
        if (!structureObj) return;
        setChainIdsAlignedTo(
            molstarA.getChainIds(structureRefAAlignedTo)
        );
    }, [viewerA.moleculeAlignedTo, structureRefAAlignedTo]);

    // Effect for moleculeAligned Chain ID selection.
    useEffect(() => {
        console.log('Updating chain IDs for moleculeAligned');
        const pluginB = viewerB.ref.current;
        if (!pluginB || !structureRefBAligned) return;
        const structureObj = pluginB.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRefBAligned)?.cell.obj?.data;
        if (!structureObj) return;
        setChainIdsAligned(
            molstarB.getChainIds(structureRefBAligned)
        );
    }, [viewerB.moleculeAligned, structureRefBAligned]);

    // Effect for moleculeAlignedTo Residue ID selection.
    useEffect(() => {
        console.log('Updating Residue IDs for moleculeAlignedTo');
        const pluginA = viewerA.ref.current;
        if (!pluginA || !structureRefAAlignedTo) return;
        const structureObj = pluginA.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRefAAlignedTo)?.cell.obj?.data;
        if (!structureObj) return;
        setResidueIdsAlignedTo(
            molstarA.getResidueIds(structureRefAAlignedTo)
        );
    }, [viewerA.moleculeAlignedTo, structureRefAAlignedTo]);

    // Effect for moleculeAligned Residue ID selection.
    useEffect(() => {
        console.log('Updating RNA IDs for moleculeAligned');
        const pluginB = viewerB.ref.current;
        if (!pluginB || !structureRefBAligned) return;
        const structureObj = pluginB.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRefBAligned)?.cell.obj?.data;
        if (!structureObj) return;
        setResidueIdsAligned(
            molstarB.getResidueIds(structureRefBAligned)
        );
    }, [viewerB.moleculeAligned, structureRefBAligned]);
    
    /**
     * Creates a handler to zoom to a selection based on a structure property.
     * @param pluginRef The plugin ref (viewerA.ref or viewerB.ref).
     * @param structureRefs Array of structure refs (e.g., [structureRefAAlignedTo, structureRefAAligned]).
     * @param structureIndex Index in the structureRefs array.
     * @param propertyBuilder A MolScriptBuilder property function (e.g., MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id).
     * @param value The value to match (e.g., chain, rnaId, paralogId).
     * @param sync Whether to sync zoom to the other viewer.
     * @param syncPluginRef The other plugin ref (optional, for sync).
     */
    function createZoomHandler(
        pluginRef: React.RefObject<PluginUIContext | null>,
        structureRefs: (string | null | undefined)[],
        structureIndex: number,
        property: 'entity-test' | 'chain-test' | 'residue-test' | 'atom-test' | 'group-by',
        propertyBuilder: () => any,
        value: string,
        sync: boolean = false,
        syncPluginRef?: React.RefObject<PluginUIContext | null>
    ) {
        return {
            handleButtonClick: async () => {
                const plugin = pluginRef.current;
                const structureRef = structureRefs[structureIndex];
                if (!plugin || !structureRef) return;
                const structureObj = plugin.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRef)?.cell.obj?.data;
                if (!structureObj) return;
                const qb = MolScriptBuilder.struct.generator.atomGroups({
                    [property]: MolScriptBuilder.core.rel.eq([
                        propertyBuilder(),
                        value
                    ])
                });
                const compiled = compile(qb);
                const ctx = new QueryContext(structureObj);
                const selection = compiled(ctx);
                const loci = StructureSelection.toLociWithSourceUnits(selection);
                plugin.managers.camera.focusLoci(loci);
                if (sync && syncPluginRef?.current) {
                    syncPluginRef.current.managers.camera.focusLoci(loci);
                }
            }
        };
    }

    // /**
    //  * Creates a handler to zoom to a chain.
    //  * @param structureIndex The index of the structure in the viewer hierarchy to zoom to.
    //  * @param chain The chain identifier to zoom to.
    //  * @return An object with a handleButtonClick method.
    //  */
    // function createChainZoomA(structureIndex: number, chain: string) {
    //     return {
    //         handleButtonClick: async () => {
    //             const pluginA = viewerA.ref.current;
    //             let structureRef = null;
    //             if (structureIndex === 0) structureRef = structureRefAAlignedTo;
    //             else if (structureIndex === 1) structureRef = structureRefAAligned;
    //             if (!pluginA || !structureRef) return;
    //             const structureObj = pluginA.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRef)?.cell.obj?.data;
    //             if (!structureObj) {
    //                 console.warn('No structure data found for alignedTo/aligned.');
    //                 return;
    //             }
    //             const qb = MolScriptBuilder.struct.generator.atomGroups({
    //                 'chain-test': MolScriptBuilder.core.rel.eq([
    //                     MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
    //                     chain
    //                 ])
    //             });
    //             const compiled = compile(qb);
    //             const ctx = new QueryContext(structureObj);
    //             const selection = compiled(ctx);
    //             const loci = StructureSelection.toLociWithSourceUnits(selection);
    //             // Zoom
    //             pluginA.managers.camera.focusLoci(loci);
    //             if (syncEnabled) {
    //                 const pluginB = viewerB.ref.current;
    //                 if (!pluginB) return;
    //                 pluginB.managers.camera.focusLoci(loci);
    //             }
    //         }
    //     };
    // }
    // // Create chain zoomA handlers.
    // const chainZoomAAlignedTo = createChainZoomA(0, selectedChainIdAlignedTo);
    // const chainZoomAAligned = createChainZoomA(1, selectedChainIdAligned);

    // Create chain zoomA handlers.
    const chainZoomAAlignedTo = createZoomHandler(
        viewerA.ref,
        [structureRefAAlignedTo, structureRefAAligned],
        0,
        'chain-test',
        () => MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id,
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerB.ref
    );
    const chainZoomAAligned = createZoomHandler(
        viewerA.ref,
        [structureRefAAlignedTo, structureRefAAligned],
        1,
        'chain-test',
        () => MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id,
        selectedChainIdAligned,
        syncEnabled,
        viewerB.ref
    );

    // /**
    //  * Creates a handler to zoom to a chain.
    //  * @param structureIndex The index of the structure in the viewer hierarchy to zoom to.
    //  * @param chain The chain identifier to zoom to.
    //  * @return An object with a handleButtonClick method.
    //  */
    // function createChainZoomB(structureIndex: number, chain: string) {
    //     return {
    //         handleButtonClick: async () => {
    //             const pluginB = viewerB.ref.current;
    //             let structureRef = null;
    //             if (structureIndex === 0) structureRef = structureRefBAlignedTo;
    //             else if (structureIndex === 1) structureRef = structureRefBAligned;
    //             if (!pluginB || !structureRef) return;
    //             const structureObj = pluginB.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRef)?.cell.obj?.data;
    //             if (!structureObj) {
    //                 console.warn('No structure data found for alignedTo/aligned.');
    //                 return;
    //             }
    //             const qb = MolScriptBuilder.struct.generator.atomGroups({
    //                 'chain-test': MolScriptBuilder.core.rel.eq([
    //                     MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
    //                     chain
    //                 ])
    //             });
    //             const compiled = compile(qb);
    //             const ctx = new QueryContext(structureObj);
    //             const selection = compiled(ctx);
    //             const loci = StructureSelection.toLociWithSourceUnits(selection);
    //             pluginB.managers.camera.focusLoci(loci);
    //             if (syncEnabled) {
    //                 const pluginA = viewerA.ref.current;
    //                 if (!pluginA) return;
    //                 pluginA.managers.camera.focusLoci(loci);
    //             }
    //         }
    //     };
    // }
    // // Create zoomB handlers.
    // const chainZoomBAlignedTo = createChainZoomB(0, selectedChainIdAlignedTo);
    // const chainZoomBAligned = createChainZoomB(1, selectedChainIdAligned);

    // Create zoomB handlers.
    const chainZoomBAlignedTo = createZoomHandler(
        viewerB.ref,
        [structureRefBAlignedTo, structureRefBAligned],
        0,
        'chain-test',
        () => MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id,
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerA.ref
    );
    const chainZoomBAligned = createZoomHandler(
        viewerB.ref,
        [structureRefBAlignedTo, structureRefBAligned],
        1,
        'chain-test',
        () => MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id,
        selectedChainIdAligned,
        syncEnabled,
        viewerA.ref
    );

    // Create Residue zoomA handlers.
    const residueZoomAAlignedTo = createZoomHandler(
        viewerA.ref,
        [structureRefAAlignedTo, structureRefAAligned],
        0,
        'residue-test',
        () => MolScriptBuilder.struct.atomProperty.macromolecular.auth_comp_id,
        selectedResidueIdAlignedTo,
        syncEnabled,
        viewerB.ref
    );
    const residueZoomAAligned = createZoomHandler(
        viewerA.ref,
        [structureRefAAlignedTo, structureRefAAligned],
        1,
        'residue-test',
        () => MolScriptBuilder.struct.atomProperty.macromolecular.auth_comp_id,
        selectedResidueIdAligned,
        syncEnabled,
        viewerB.ref
    );
    
    // Create Residue zoomB handlers.
    const residueZoomBAlignedTo = createZoomHandler(
        viewerB.ref,
        [structureRefBAlignedTo, structureRefBAligned],
        0,
        'residue-test',
        () => MolScriptBuilder.struct.atomProperty.macromolecular.auth_comp_id,
        selectedResidueIdAlignedTo,
        syncEnabled,
        viewerA.ref
    );
    const residueZoomBAligned = createZoomHandler(
        viewerB.ref,
        [structureRefBAlignedTo, structureRefBAligned],
        1,
        'residue-test',
        () => MolScriptBuilder.struct.atomProperty.macromolecular.auth_comp_id,
        selectedResidueIdAligned,
        syncEnabled,
        viewerA.ref
    );

    // Unified robust delete handler for any representation
    const deleteRepresentation = async (ref: string, key: string, molstar: any, doForceUpdate = true) => {
        // Try to find repId for this ref
        let repId = Object.entries(molstar.repIdMap[key]).find(([id, r]) => r === ref)?.[0];
        let repRef = repId ? molstar.repIdMap[key][repId] : ref;
        // Fallback to array index if not found in repIdMap
        if (!repRef) {
            const idx = molstar.representationRefs[key].indexOf(ref);
            if (idx >= 0) repRef = molstar.representationRefs[key][idx];
        }
        if (!repRef) return;
        const plugin = molstar.pluginRef.current;
        if (!plugin) return;
        await import('molstar/lib/mol-plugin/commands').then(async ({ PluginCommands }) => {
            await PluginCommands.State.RemoveObject.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
            // Remove parent component if empty
            const state = plugin.state.data;
            const repCell = state.cells.get(repRef);
            const parentRef = repCell?.transform.parent;
            if (parentRef) {
                const isComponent = state.cells.get(parentRef)?.obj?.type?.name === 'Structure Component';
                const children = state.tree.children.get(parentRef)?.toArray?.() || [];
                let rep3dCount = 0;
                for (const childRef of children) {
                    const c = state.cells.get(childRef);
                    if (c?.obj?.type?.name === 'Representation3D') rep3dCount++;
                }
                if (isComponent && rep3dCount === 0) {
                    await PluginCommands.State.RemoveObject.apply(plugin, [plugin, { state: plugin.state.data, ref: parentRef }]);
                }
            }
            // Remove from repIdMap if present
            if (repId && molstar.repIdMap[key][repId]) {
                const newMap = { ...molstar.repIdMap[key] };
                delete newMap[repId];
                molstar.setRepIdMap(key, newMap);
            }
            plugin.canvas3d?.requestDraw?.();
            if (molstar.structureRefs[s_AlignedTo]) {
                molstar.refreshRepresentationRefs(s_AlignedTo, molstar.structureRefs[s_AlignedTo]!);
            }
            if (molstar.structureRefs[s_Aligned]) {
                molstar.refreshRepresentationRefs(s_Aligned, molstar.structureRefs[s_Aligned]!);
            }
            if (doForceUpdate) forceUpdate();
        });
    };

    // Return the main app component.
    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.5.1 (please see <a href="https://github.com/ribocode-slola/ribocode1/?tab=readme-ov-file#ribocode" target="_blank">README</a> for information).</h1>
                <div className="General-Controls">
                    <RepresentationSelectButton
                        label="Select Sync"
                        options={['On', 'Off']}
                        selected={syncEnabled ? 'On' : 'Off'}
                        onSelect={option => setSyncEnabled(option === 'On')}
                        disabled={!viewerB.isMoleculeAlignedToLoaded}
                    />
                    <div>
                        <button
                            onClick={dictionaryFile.handleButtonClick}
                            disabled={!viewerB.isMoleculeAlignedLoaded}
                        >
                            Load Dictionary
                        </button>
                        <input
                            type="file"
                            accept=".csv,.txt"
                            style={{ display: 'none' }}
                            ref={dictionaryFile.inputRef}
                            onChange={dictionaryFile.handleFileChange}
                        />
                        <button
                            onClick={alignmentFile.handleButtonClick}
                            disabled={!viewerB.isMoleculeAlignedLoaded}
                        >
                            Load Alignment
                        </button>
                        <input
                            type="file"
                            accept=".csv,.txt"
                            style={{ display: 'none' }}
                            ref={alignmentFile.inputRef}
                            onChange={alignmentFile.handleFileChange}
                        />
                    </div>
                </div>
                <div className="Two-Columns-Container">
                    <div className="Column">
                        <LoadDataRow
                            viewerTitle={viewerA.moleculeAlignedTo ? `Aligned to: ${viewerA.moleculeAlignedTo.name || viewerA.moleculeAlignedTo.filename}` : ""}
                            isLoaded={viewerA.isMoleculeAlignedToLoaded}
                            onFileInputClick={viewerA.handleFileInputButtonClick}
                            fileInputRef={viewerA.fileInputRef}
                            onFileChange={e => handleFileChange(e, 'alignedTo')}
                            fileInputDisabled={!viewerAReady || !viewerBReady}
                            fileInputLabel="Load Molecule To Align To"
                            representationType={representationTypeAlignedTo}
                            onRepresentationTypeChange={setRepresentationTypeAlignedTo}
                            representationTypeDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            representationTypeSelector={
                                <RepresentationSelectButton
                                    label="Select Representation"
                                    options={[...allowedRepresentationTypes]}
                                    selected={representationTypeAlignedTo}
                                    onSelect={option => setRepresentationTypeAlignedTo(option as AllowedRepresentationType)}
                                    disabled={!viewerA.isMoleculeAlignedToLoaded}
                                />
                            }
                            onAddColorsClick={colorsAlignedToFile.handleButtonClick}
                            addColorsDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            onAddRepresentationClick={() => {
                                // Add representation for alignedTo in both viewers
                                let colorTheme;
                                if (isMoleculeAlignedToColoursLoaded) {
                                    colorTheme = { name: 'alignedTo-custom-chain-colors', params: {} };
                                } else {
                                    colorTheme = { name: 'default', params: {} };
                                }
                                // Generate a repId and use for both viewers
                                const repId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
                                if (viewerA.moleculeAlignedTo && structureRefAAlignedTo) {
                                    molstarA.addRepresentation(
                                        s_AlignedTo,
                                        structureRefAAlignedTo,
                                        representationTypeAlignedTo,
                                        colorTheme,
                                        repId
                                    );
                                }
                                if (viewerB.moleculeAlignedTo && structureRefBAlignedTo) {
                                    molstarB.addRepresentation(
                                        s_AlignedTo,
                                        structureRefBAlignedTo,
                                        representationTypeAlignedTo,
                                        colorTheme,
                                        repId
                                    );
                                }
                            }}
                            addRepresentationDisabled={!viewerA.isMoleculeAlignedToLoaded || !structureRefAAlignedTo}
                            colorsInputRef={colorsAlignedToFile.inputRef}
                            onColorsFileChange={colorsAlignedToFile.handleFileChange}
                            chainIds={chainIdsAlignedTo}
                            selectedChainId={selectedChainIdAlignedTo}
                            onSelectChainId={setSelectedChainIdAlignedTo}
                            chainSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            residueIds={residueIdsAlignedTo}
                            selectedResidueId={selectedResidueIdAlignedTo}
                            onSelectResidueId={setSelectedResidueIdAlignedTo}
                            residueSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                        />
                        <MoleculeRow
                            key={molstarA.representationRefs[s_AlignedTo]?.join('-') || 'A-AlignedTo'}
                            label={viewerA.moleculeAlignedTo?.label ?? 'Molecule Aligned To'}
                            plugin={viewerA.ref.current}
                            isVisible={viewerA.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerAAlignedTo.handleButtonClick}
                            chainZoomLabel={selectedChainIdAlignedTo}
                            onChainZoom={chainZoomAAlignedTo.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAlignedTo}
                            residueZoomLabel={selectedResidueIdAlignedTo}
                            onResidueZoom={residueZoomAAlignedTo.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAlignedTo}
                            isLoaded={viewerA.isMoleculeAlignedToLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarA.representationRefs[s_AlignedTo] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarA for viewerA's row
                                const repId = Object.entries(molstarA.repIdMap[s_AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[s_AlignedTo][repId], s_AlignedTo, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[s_AlignedTo][repId], s_AlignedTo, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarA.repIdMap[s_AlignedTo][repId], s_AlignedTo, molstarA);
                                } else {
                                    // fallback for legacy/edge
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, s_AlignedTo, molstarA, false),
                                            deleteRepresentation(ref, s_AlignedTo, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, s_AlignedTo, molstarA);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerA
                                const repId = Object.entries(molstarA.repIdMap[s_AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarA.repIdMap[s_AlignedTo][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarA.representationRefs[s_AlignedTo].indexOf(ref);
                                    if (idx >= 0) repRef = molstarA.representationRefs[s_AlignedTo][idx];
                                }
                                if (repRef) {
                                    const plugin = molstarA.pluginRef.current;
                                    if (!plugin) return;
                                    const cell = plugin.state?.data?.cells?.get(repRef);
                                    if (cell) {
                                        import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                            PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
                                            plugin.canvas3d?.requestDraw?.();
                                            forceUpdate();
                                        });
                                    }
                                }
                            }}
                            // Removed invalid zoomToRna/zoomToParalog props for MoleculeRow
                        />
                        <MoleculeRow
                            key={molstarA.representationRefs[s_Aligned]?.join('-') || 'A-Aligned'}
                            label={viewerA.moleculeAligned?.label ?? 'Molecule Aligned'}
                            plugin={viewerA.ref.current}
                            isVisible={viewerA.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerAAligned.handleButtonClick}
                            chainZoomLabel={selectedChainIdAligned}
                            onChainZoom={chainZoomAAligned.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAligned}
                            residueZoomLabel={selectedResidueIdAligned}
                            onResidueZoom={residueZoomAAligned.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAligned}
                            isLoaded={viewerA.isMoleculeAlignedLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarA.representationRefs[s_Aligned] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarA for viewerA's row
                                const repId = Object.entries(molstarA.repIdMap[s_Aligned]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[s_Aligned][repId], s_Aligned, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[s_Aligned][repId], s_Aligned, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarA.repIdMap[s_Aligned][repId], s_Aligned, molstarA);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, s_Aligned, molstarA, false),
                                            deleteRepresentation(ref, s_Aligned, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, s_Aligned, molstarA);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerA
                                const repId = Object.entries(molstarA.repIdMap[s_Aligned]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarA.repIdMap[s_Aligned][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarA.representationRefs[s_Aligned].indexOf(ref);
                                    if (idx >= 0) repRef = molstarA.representationRefs[s_Aligned][idx];
                                }
                                if (repRef) {
                                    const plugin = molstarA.pluginRef.current;
                                    if (!plugin) return;
                                    const cell = plugin.state?.data?.cells?.get(repRef);
                                    if (cell) {
                                        import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                            PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
                                            plugin.canvas3d?.requestDraw?.();
                                            forceUpdate();
                                        });
                                    }
                                }
                            }}
                        />
                        <MolstarContainer
                            ref={pluginRefA}
                            viewerKey={viewerA.viewerKey}
                            setViewer={setViewerAWrapper}
                            onMouseDown={() => setActiveViewer(viewerA.viewerKey)}
                            onReady={() => setViewerAReady(true)}
                        />
                    </div>
                    <div className='Column'>
                        <LoadDataRow
                            viewerTitle={viewerB.moleculeAligned ? `Aligned: ${viewerB.moleculeAligned.name || viewerB.moleculeAligned.filename}` : ""}
                            isLoaded={viewerB.isMoleculeAlignedLoaded}
                            onFileInputClick={viewerB.handleFileInputButtonClick}
                            fileInputRef={viewerB.fileInputRef}
                            onFileChange={e => handleFileChange(e, 'aligned')}
                            fileInputDisabled={!viewerA.isMoleculeAlignedToLoaded || !viewerAReady || !viewerBReady}
                            fileInputLabel="Load Molecule To Align"
                            representationType={representationTypeAligned}
                            onRepresentationTypeChange={setRepresentationTypeAligned}
                            representationTypeDisabled={!viewerB.isMoleculeAlignedLoaded}
                            representationTypeSelector={
                                <RepresentationSelectButton
                                    label="Select Representation"
                                    options={[...allowedRepresentationTypes]}
                                    selected={representationTypeAligned}
                                    onSelect={option => setRepresentationTypeAligned(option as AllowedRepresentationType)}
                                    disabled={!viewerB.isMoleculeAlignedLoaded}
                                />
                            }
                            onAddColorsClick={colorsAlignedFile.handleButtonClick}
                            addColorsDisabled={!viewerB.isMoleculeAlignedLoaded}
                            onAddRepresentationClick={() => {
                                // Add representation for aligned in both viewers
                                let colorTheme;
                                if (isMoleculeAlignedColoursLoaded) {
                                    colorTheme = { name: 'aligned-custom-chain-colors', params: {} };
                                } else {
                                    colorTheme = { name: 'default', params: {} };
                                }
                                // Generate a repId and use for both viewers
                                const repId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
                                if (viewerA.moleculeAligned && structureRefAAligned) {
                                    molstarA.addRepresentation(
                                        s_Aligned,
                                        structureRefAAligned,
                                        representationTypeAligned,
                                        colorTheme,
                                        repId
                                    );
                                }
                                if (viewerB.moleculeAligned && structureRefBAligned) {
                                    molstarB.addRepresentation(
                                        s_Aligned,
                                        structureRefBAligned,
                                        representationTypeAligned,
                                        colorTheme,
                                        repId
                                    );
                                }
                            }}
                            addRepresentationDisabled={!viewerB.isMoleculeAlignedLoaded || !structureRefBAligned}
                            colorsInputRef={colorsAlignedFile.inputRef}
                            onColorsFileChange={colorsAlignedFile.handleFileChange}
                            chainIds={chainIdsAligned}
                            selectedChainId={selectedChainIdAligned}
                            onSelectChainId={setSelectedChainIdAligned}
                            chainSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                            residueIds={residueIdsAligned}
                            selectedResidueId={selectedResidueIdAligned}
                            onSelectResidueId={setSelectedResidueIdAligned}
                            residueSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                        />
                        <MoleculeRow
                            key={molstarB.representationRefs[s_AlignedTo]?.join('-') || 'B-AlignedTo'}
                            label={viewerB.moleculeAlignedTo?.label ?? 'Molecule Aligned To'}
                            plugin={viewerB.ref.current}
                            isVisible={viewerB.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerBAlignedTo.handleButtonClick}
                            chainZoomLabel={selectedChainIdAlignedTo}
                            onChainZoom={chainZoomBAlignedTo.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAlignedTo}
                            residueZoomLabel={selectedResidueIdAlignedTo}
                            onResidueZoom={residueZoomBAlignedTo.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAlignedTo}
                            isLoaded={viewerB.isMoleculeAlignedToLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarB.representationRefs[s_AlignedTo] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarB for viewerB's row
                                const repId = Object.entries(molstarB.repIdMap[s_AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[s_AlignedTo][repId], s_AlignedTo, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[s_AlignedTo][repId], s_AlignedTo, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarB.repIdMap[s_AlignedTo][repId], s_AlignedTo, molstarB);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, s_AlignedTo, molstarA, false),
                                            deleteRepresentation(ref, s_AlignedTo, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, s_AlignedTo, molstarB);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerB
                                const repId = Object.entries(molstarB.repIdMap[s_Aligned]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarB.repIdMap[s_Aligned][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarB.representationRefs[s_Aligned].indexOf(ref);
                                    if (idx >= 0) repRef = molstarB.representationRefs[s_Aligned][idx];
                                }
                                if (repRef) {
                                    const plugin = molstarB.pluginRef.current;
                                    if (!plugin) return;
                                    const cell = plugin.state?.data?.cells?.get(ref);
                                    if (cell) {
                                        import('molstar/lib/mol-plugin/commands').then(({ PluginCommands }) => {
                                            PluginCommands.State.ToggleVisibility.apply(plugin, [plugin, { state: plugin.state.data, ref: repRef }]);
                                            plugin.canvas3d?.requestDraw?.();
                                            forceUpdate();
                                        });
                                    }
                                }
                            }}
                        />
                        <MoleculeRow
                            key={molstarB.representationRefs[s_Aligned]?.join('-') || 'B-Aligned'}
                            label={viewerB.moleculeAligned?.label ?? 'Molecule Aligned'}
                            plugin={viewerB.ref.current}
                            isVisible={viewerB.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerBAligned.handleButtonClick}
                            chainZoomLabel={selectedChainIdAligned}
                            onChainZoom={chainZoomBAligned.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAligned}
                            residueZoomLabel={selectedResidueIdAligned}
                            onResidueZoom={residueZoomBAligned.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAligned}
                            isLoaded={viewerB.isMoleculeAlignedLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarB.representationRefs[s_Aligned] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarB for viewerB's row
                                const repId = Object.entries(molstarB.repIdMap[s_Aligned]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[s_Aligned][repId], s_Aligned, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[s_Aligned][repId], s_Aligned, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarB.repIdMap[s_Aligned][repId], s_Aligned, molstarB);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, s_Aligned, molstarA, false),
                                            deleteRepresentation(ref, s_Aligned, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, s_Aligned, molstarB);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                [molstarA, molstarB].forEach(molstar => {
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
                        />
                        <MolstarContainer
                            ref={pluginRefB}
                            viewerKey={viewerB.viewerKey}
                            setViewer={setViewerBWrapper}
                            onMouseDown={() => setActiveViewer(viewerB.viewerKey)}
                            onReady={() => setViewerBReady(true)}
                        />
                    </div>
                </div>
            </div>
        </SyncProvider>
    );
};

export default App;