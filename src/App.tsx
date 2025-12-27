/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import MoleculeRow from './components/MoleculeRow';
import LoadDataRow from './components/LoadDataRow';
import { SyncProvider } from './SyncContext';
import SyncButton from './components/SyncButton';
import MolstarContainer from './components/MolstarContainer';
import { parseColorFileContent, getColourTheme, createChainColorTheme } from './utils/Colors';
import { parseDictionaryFileContent } from './utils/Dictionary';
import { toggleVisibility, ViewerKey, ViewerState } from './components/RibocodeViewer';
import './App.css';
import { loadMoleculeFileToViewer, Molecule, PresetResult } from 'molstar/lib/extensions/ribocode/structure';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { QueryContext } from 'molstar/lib/mol-model/structure/query/context';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/base';
import { AllowedRepresentationType } from './types/Representation';
import { useMolstarViewer } from './hooks/useMolstarViewer';

// Constants for structure ref keys.
export const s_AlignedTo: string = 'AlignedTo';
export const s_Aligned: string = 'Aligned';

/**
 * The main App component.
 * @returns The main App component.
 */
const App: React.FC = () => {

    // Create plugin refs and pass to both useMolstarViewer and MolstarContainer
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
        //chainAlignedToColorMap: Map<string, Color>,
        //chainAlignedColorMap: Map<string, Color>
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
            // Update only the alignedTo molecules for both viewers using their refs
            if (viewerA.moleculeAlignedTo && structureRefAAlignedTo) {
                updateMoleculeColors(
                    viewerA,
                    viewerA.moleculeAlignedTo,
                    { name: themeNameAlignedTo, params: {} },
                    representationTypeAlignedTo,
                    structureRefAAlignedTo,
                    s_AlignedTo
                ).then(forceUpdate);
            }
            if (viewerB.moleculeAlignedTo && structureRefBAlignedTo) {
                updateMoleculeColors(
                    viewerB,
                    viewerB.moleculeAlignedTo,
                    { name: themeNameAlignedTo, params: {} },
                    representationTypeAlignedTo,
                    structureRefBAlignedTo,
                    s_AlignedTo
                ).then(forceUpdate);
            }
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
            // Update only the aligned molecules for both viewers using their refs
            if (viewerA.moleculeAligned && structureRefAAligned) {
                updateMoleculeColors(
                    viewerA,
                    viewerA.moleculeAligned,
                    { name: themeNameAligned, params: {} },
                    representationTypeAligned,
                    structureRefAAligned,
                    s_Aligned
                ).then(forceUpdate);
            }
            if (viewerB.moleculeAligned && structureRefBAligned) {
                updateMoleculeColors(
                    viewerB,
                    viewerB.moleculeAligned,
                    { name: themeNameAligned, params: {} },
                    representationTypeAligned,
                    structureRefBAligned,
                    s_Aligned
                ).then(forceUpdate);
            }
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

    /**
     * Creates a handler to zoom to a chain.
     * @param structureIndex The index of the structure in the viewer hierarchy to zoom to.
     * @return An object with a handleButtonClick method.
     */
    function createZoomA(structureIndex: number, chain: string) {
        return {
            handleButtonClick: async () => {
                const pluginA = viewerA.ref.current;
                let structureRef = null;
                if (structureIndex === 0) structureRef = structureRefAAlignedTo;
                else if (structureIndex === 1) structureRef = structureRefAAligned;
                if (!pluginA || !structureRef) return;
                const structureObj = pluginA.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRef)?.cell.obj?.data;
                if (!structureObj) {
                    console.warn('No structure data found for alignedTo/aligned.');
                    return;
                }
                const qb = MolScriptBuilder.struct.generator.atomGroups({
                    'chain-test': MolScriptBuilder.core.rel.eq([
                        MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                        chain
                    ])
                });
                const compiled = compile(qb);
                const ctx = new QueryContext(structureObj);
                const selection = compiled(ctx);
                const loci = StructureSelection.toLociWithSourceUnits(selection);
                // Zoom
                pluginA.managers.camera.focusLoci(loci);
                if (syncEnabled) {
                    const pluginB = viewerB.ref.current;
                    if (!pluginB) return;
                    pluginB.managers.camera.focusLoci(loci);
                }
            }
        };
    }

    // Create zoomA handlers.
    const zoomAAlignedTo = createZoomA(0, selectedChainIdAlignedTo);
    const zoomAAligned = createZoomA(1, selectedChainIdAligned);

    /**
     * Creates a handler to zoom to a chain.
     * @return An object with a handleButtonClick method.
     * 
     * @param structureIndex The index of the structure in the viewer hierarchy to zoom to.
     * @return An object with a handleButtonClick method.
     */
    function createZoomB(structureIndex: number, chain: string) {
        return {
            handleButtonClick: async () => {
                const pluginB = viewerB.ref.current;
                let structureRef = null;
                if (structureIndex === 0) structureRef = structureRefBAlignedTo;
                else if (structureIndex === 1) structureRef = structureRefBAligned;
                if (!pluginB || !structureRef) return;
                const structureObj = pluginB.managers.structure.hierarchy.current.structures.find(s => s.cell.transform.ref === structureRef)?.cell.obj?.data;
                if (!structureObj) {
                    console.warn('No structure data found for alignedTo/aligned.');
                    return;
                }
                const qb = MolScriptBuilder.struct.generator.atomGroups({
                    'chain-test': MolScriptBuilder.core.rel.eq([
                        MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                        chain
                    ])
                });
                const compiled = compile(qb);
                const ctx = new QueryContext(structureObj);
                const selection = compiled(ctx);
                const loci = StructureSelection.toLociWithSourceUnits(selection);

                pluginB.managers.camera.focusLoci(loci);
                if (syncEnabled) {
                    const pluginA = viewerA.ref.current;
                    if (!pluginA) return;
                    pluginA.managers.camera.focusLoci(loci);
                }
            }
        };
    }

    // Create zoomB handlers.
    const zoomBAlignedTo = createZoomB(0, selectedChainIdAlignedTo);
    const zoomBAligned = createZoomB(1, selectedChainIdAligned);

    // Return the main app component.
    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.5.1 (please see <a href="https://github.com/ribocode-slola/ribocode1/?tab=readme-ov-file#ribocode" target="_blank">README</a> for information).</h1>
                <LoadDataRow
                    viewerTitle={viewerA.moleculeAlignedTo
                        ? `Molecule aligned to: ${viewerA.moleculeAlignedTo.name || viewerA.moleculeAlignedTo.filename}`
                        : ""}
                    isLoaded={viewerA.isMoleculeAlignedToLoaded}
                    onFileInputClick={viewerA.handleFileInputButtonClick}
                    fileInputRef={viewerA.fileInputRef}
                    onFileChange={e => handleFileChange(e, 'alignedTo')}
                    fileInputDisabled={!viewerAReady || !viewerBReady}
                    fileInputLabel="Load Molecule To Align To"
                    representationType={representationTypeAlignedTo}
                    onRepresentationTypeChange={setRepresentationTypeAlignedTo}
                    representationTypeDisabled={!viewerA.isMoleculeAlignedToLoaded}
                    onAddColorsClick={colorsAlignedToFile.handleButtonClick}
                    addColorsDisabled={!viewerA.isMoleculeAlignedToLoaded}
                    colorsInputRef={colorsAlignedToFile.inputRef}
                    onColorsFileChange={colorsAlignedToFile.handleFileChange}
                    chainIds={chainIdsAlignedTo}
                    selectedChainId={selectedChainIdAlignedTo}
                    onSelectChainId={setSelectedChainIdAlignedTo}
                    chainSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                />
                <LoadDataRow
                    viewerTitle={viewerB.moleculeAligned
                        ? `Molecule aligned: ${viewerB.moleculeAligned.name || viewerB.moleculeAligned.filename}`
                        : ""}
                    isLoaded={viewerB.isMoleculeAlignedLoaded}
                    onFileInputClick={viewerB.handleFileInputButtonClick}
                    fileInputRef={viewerB.fileInputRef}
                    onFileChange={e => handleFileChange(e, 'aligned')}
                    fileInputDisabled={!viewerA.isMoleculeAlignedToLoaded || !viewerAReady || !viewerBReady}
                    fileInputLabel="Load Molecule To Align"
                    representationType={representationTypeAligned}
                    onRepresentationTypeChange={setRepresentationTypeAligned}
                    representationTypeDisabled={!viewerB.isMoleculeAlignedLoaded}
                    onAddColorsClick={colorsAlignedFile.handleButtonClick}
                    addColorsDisabled={!viewerB.isMoleculeAlignedLoaded}
                    colorsInputRef={colorsAlignedFile.inputRef}
                    onColorsFileChange={colorsAlignedFile.handleFileChange}
                    chainIds={chainIdsAligned}
                    selectedChainId={selectedChainIdAligned}
                    onSelectChainId={setSelectedChainIdAligned}
                    chainSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                />
                <div>
                    <SyncButton
                        viewerA={viewerA.ref.current}
                        viewerB={viewerB.ref.current}
                        activeViewer={activeViewer}
                        disabled={!viewerB.isMoleculeAlignedToLoaded}
                        syncEnabled={syncEnabled}
                        setSyncEnabled={setSyncEnabled}
                    />
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
                <div className="grid-container">
                    <div className="viewer-wrapper">
                        <MoleculeRow
                            label={viewerA.moleculeAlignedTo?.label ?? 'Molecule Aligned To'}
                            plugin={viewerA.ref.current}
                            isVisible={viewerA.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerAAlignedTo.handleButtonClick}
                            zoomLabel={selectedChainIdAlignedTo}
                            onZoom={zoomAAlignedTo.handleButtonClick}
                            zoomDisabled={!selectedChainIdAlignedTo}
                            isLoaded={viewerA.isMoleculeAlignedToLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarA.representationRefs[s_AlignedTo] || []}
                        />
                        <MoleculeRow
                            label={viewerA.moleculeAligned?.label ?? 'Molecule Aligned'}
                            plugin={viewerA.ref.current}
                            isVisible={viewerA.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerAAligned.handleButtonClick}
                            zoomLabel={selectedChainIdAligned}
                            onZoom={zoomAAligned.handleButtonClick}
                            zoomDisabled={!selectedChainIdAligned}
                            isLoaded={viewerA.isMoleculeAlignedLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarA.representationRefs[s_Aligned] || []}
                        />
                        <MolstarContainer
                            ref={pluginRefA}
                            viewerKey={viewerA.viewerKey}
                            setViewer={setViewerAWrapper}
                            onMouseDown={() => setActiveViewer(viewerA.viewerKey)}
                            onReady={() => setViewerAReady(true)}
                        />
                    </div>
                    <div className="viewer-wrapper">
                        <MoleculeRow
                            label={viewerB.moleculeAlignedTo?.label ?? 'Molecule Aligned To'}
                            plugin={viewerB.ref.current}
                            isVisible={viewerB.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerBAlignedTo.handleButtonClick}
                            zoomLabel={selectedChainIdAlignedTo}
                            onZoom={zoomBAlignedTo.handleButtonClick}
                            zoomDisabled={!selectedChainIdAlignedTo}
                            isLoaded={viewerB.isMoleculeAlignedToLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarB.representationRefs[s_AlignedTo] || []}
                        />
                        <MoleculeRow
                            label={viewerB.moleculeAligned?.label ?? 'Molecule Aligned'}
                            plugin={viewerB.ref.current}
                            isVisible={viewerB.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerBAligned.handleButtonClick}
                            zoomLabel={selectedChainIdAligned}
                            onZoom={zoomBAligned.handleButtonClick}
                            zoomDisabled={!selectedChainIdAligned}
                            isLoaded={viewerB.isMoleculeAlignedLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarB.representationRefs[s_Aligned] || []}
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