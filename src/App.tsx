/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { extractAtomData } from './utils/Data';
import MoleculeUI from './components/Molecule';
import RepresentationSelectButton from './components/buttons/select/Representation';
import LoadDataRow from './components/LoadMolecule';
import { SyncProvider } from './context/SyncContext';
import MolstarContainer from './components/MolstarContainer';
import { parseColorFileContent, createChainColorTheme } from './utils/Colors';
import { parseDictionaryFileContent } from './utils/Dictionary';
import { toggleVisibility, ViewerKey, ViewerState } from './components/RibocodeViewer';
import { loadMoleculeFileToViewer, Molecule } from 'molstar/lib/extensions/ribocode/structure';
import { alignDatasetUsingChains } from 'molstar/lib/extensions/ribocode/utils/geometry';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { QueryContext } from 'molstar/lib/mol-model/structure/query/context';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/base';
import { allowedRepresentationTypes, AllowedRepresentationType } from './components/buttons/select/Representation';
import { useMolstarViewer } from './hooks/useMolstarViewer';
import { inferRibosomeSubunitChainIds } from './utils/Chain';
import SyncButton from './components/buttons/Sync';
import { ResidueLabelInfo } from './utils/Residue';
//import { RibosomeSubunitType, RibosomeSubunitTypes } from './components/select/SubunitSelectButton';

// Viewer keys
export const A: ViewerKey = 'A';
export const B: ViewerKey = 'B';

// File change modes for molecule loading.
export type FileChangeMode = 'AlignedTo' | 'Aligned';
export const AlignedTo: FileChangeMode = 'AlignedTo';
export const Aligned: FileChangeMode = 'Aligned';

/**
 * The main App component.
 * @returns The main App component.
 */
const App: React.FC = () => {
    // State for zoom-to-residue options
    const [zoomExtraRadius, setZoomExtraRadius] = useState<number>(20);
    const [zoomMinRadius, setZoomMinRadius] = useState<number>(16);

    // Create plugin refs and pass to useMolstarViewers
    const pluginRefA: React.RefObject<PluginUIContext | null> = useRef<PluginUIContext | null>(null);
    const pluginRefB: React.RefObject<PluginUIContext | null> = useRef<PluginUIContext | null>(null);
    const molstarA: ReturnType<typeof useMolstarViewer> = useMolstarViewer(pluginRefA);
    const molstarB: ReturnType<typeof useMolstarViewer> = useMolstarViewer(pluginRefB);

    // Initialize viewer states.
    const viewerA: ViewerState = useViewerState(A);
    const viewerB: ViewerState = useViewerState(B);
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
    const [activeViewer, setActiveViewer] = useState<ViewerKey>(A);
    /**
     * Custom hook to manage viewer state.
     * @param viewerKey The key identifying the viewer ('A' or 'B').
     * @returns The viewer state object.
     */
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

    /**
     * Generic file input hook.
     * @param parseFn Function to parse file content.
     * @param initialValue Initial value for the data state.
     * @returns An object containing data, setData, inputRef, handleButtonClick, and handleFileChange.
     */
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
    // // Subunit selection state.
    // const [subunitOptionsAlignedTo, setSubunitOptionsAlignedTo] = useState<RibosomeSubunitType[]>([]);
    // const [selectedSubunitAlignedTo, setSelectedSubunitAlignedTo] = useState<RibosomeSubunitType>('Neither');
    // const [subunitOptionsAligned, setSubunitOptionsAligned] = useState<RibosomeSubunitType[]>([]);
    // const [selectedSubunitAligned, setSelectedSubunitAligned] = useState<RibosomeSubunitType>('Neither');
    // Chain ID selection state.
    const [chainInfoAlignedTo, setChainInfoAlignedTo] = useState<{
        chainLabels: Map<string, string>;}>({ chainLabels: new Map() });
    const [selectedChainIdAlignedTo, setSelectedChainIdAlignedTo] = useState<string>('');
    const [chainInfoAligned, setChainInfoAligned] = useState<{
        chainLabels: Map<string, string>;}>({ chainLabels: new Map() });
    const [selectedChainIdAligned, setSelectedChainIdAligned] = useState<string>('');
    // Residue ID selection state.
    const [residueInfoAlignedTo, setResidueInfoAlignedTo] = useState<{
        residueLabels: Map<string, ResidueLabelInfo>;
        residueToAtomIds: Record<string, string[]>;
    }>({ residueLabels: new Map(), residueToAtomIds: {} });
    const [selectedResidueIdAlignedTo, setSelectedResidueIdAlignedTo] = useState<string>('');
    const [residueInfoAligned, setResidueInfoAligned] = useState<{
        residueLabels: Map<string, ResidueLabelInfo>;
        residueToAtomIds: Record<string, string[]>;
    }>({ residueLabels: new Map(), residueToAtomIds: {} });
    const [selectedResidueIdAligned, setSelectedResidueIdAligned] = useState<string>('');

    // Handle file changes for molecule loading.
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
                if (mode === AlignedTo) {
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
                        trajectory: viewerAMoleculeAlignedTo.trajectory,
                        alignmentData: viewerAMoleculeAlignedTo.alignmentData
                    }));
                    // Set structureRef for robust lookup and start robust polling
                    const structureA = pluginA.managers.structure.hierarchy.current.structures[0];
                    if (structureA) {
                        const ref = structureA.cell.transform.ref;
                        molstarA.setStructureRef(AlignedTo, ref);
                    }
                    viewerA.setIsMoleculeAlignedToLoaded(true);
                    viewerA.setIsMoleculeAlignedToVisible(true);
                    // Viewer B
                    const viewerBMoleculeAlignedTo: Molecule | undefined = await loadMoleculeFileToViewer(
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
                        trajectory: viewerBMoleculeAlignedTo.trajectory,
                    }));
                    const structureB = pluginB.managers.structure.hierarchy.current.structures[0];
                    if (structureB) {
                        const ref = structureB.cell.transform.ref;
                        molstarB.setStructureRef(AlignedTo, ref);
                    }
                    viewerB.setIsMoleculeAlignedToLoaded(true);
                    viewerB.setIsMoleculeAlignedToVisible(true);
                } else if (mode === Aligned) {
                    // Require alignedTo data to be loaded
                    if (!viewerA.moleculeAlignedTo?.alignmentData) {
                        console.error(AlignedTo + ' molecule must be loaded before loading aligned molecule.');
                        return;
                    }
                    const alignmentData = viewerA.moleculeAlignedTo.alignmentData;
                    // Load aligned molecule into both viewers using alignment data
                    const viewerAMoleculeAligned: Molecule | undefined = await loadMoleculeFileToViewer(
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
                        trajectory: viewerAMoleculeAligned.trajectory,
                    }));
                    const structureA = pluginA.managers.structure.hierarchy.current.structures[1];
                    if (structureA) {
                        const ref = structureA.cell.transform.ref;
                        molstarA.setStructureRef(Aligned, ref);
                    }
                    viewerA.setIsMoleculeAlignedLoaded(true);
                    viewerA.setIsMoleculeAlignedVisible(true);

                    const viewerBMoleculeAligned: Molecule | undefined = await loadMoleculeFileToViewer(
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
                        trajectory: viewerBMoleculeAligned.trajectory,
                    }));
                    const structureB = pluginB.managers.structure.hierarchy.current.structures[1];
                    if (structureB) {
                        const ref = structureB.cell.transform.ref;
                        molstarB.setStructureRef(Aligned, ref);
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
    const structureRefAAlignedTo: string | null = molstarA.structureRefs[AlignedTo];
    const structureRefAAligned: string | null = molstarA.structureRefs[Aligned];
    const structureRefBAlignedTo: string | null = molstarB.structureRefs[AlignedTo];
    const structureRefBAligned: string | null = molstarB.structureRefs[Aligned];
    // Theme names for custom chain color themes.
    const themeNameAlignedTo = AlignedTo + '-custom-chain-colors';
    const themeNameAligned = Aligned + '-custom-chain-colors';

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

    // Representation type state.
    const [representationTypeAlignedTo, setRepresentationTypeAlignedTo] = useState<AllowedRepresentationType>('spacefill');
    const [representationTypeAligned, setRepresentationTypeAligned] = useState<AllowedRepresentationType>('spacefill');

    /**
     * Reusable effect for updating colors and registering themes.
     * @param colorFileData The color file data to process.
     * @param setIsColorsLoaded Function to set the colors loaded state.
     * @param themeName The name of the theme to register.
     * @param deps Additional dependencies for the effect.
     */
    function useUpdateColors(
        colorFileData: Array<Record<string, string>>,
        setIsColorsLoaded: React.Dispatch<React.SetStateAction<boolean>>,
        themeName: string,
        deps: any[]
    ) {
        useEffect(() => {
            if (colorFileData && colorFileData.length > 0) {
                setIsColorsLoaded(true);
                // Build and set the chain color map before registering the theme
                const themeChainColorMap = new Map<string, Color>();
                colorFileData.forEach(row => {
                    if (row.pdb_chain && row.color) {
                        try {
                            themeChainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                        } catch {
                            console.warn(`Invalid color: ${row.color}`);
                        }
                    }
                });
                chainColorMaps.set(themeName, themeChainColorMap);
                // Register the custom theme on both plugins before updating representations
                if (viewerA.ref.current) {
                    registerThemeIfNeeded(viewerA.ref.current, themeName);
                }
                if (viewerB.ref.current) {
                    registerThemeIfNeeded(viewerB.ref.current, themeName);
                }
                // Do not update representations here; only register the theme and set color map
            }
        }, [colorFileData, setIsColorsLoaded, themeName, ...deps]);
    }

    // Use the reusable effect for both color sets
    useUpdateColors(
        colorsAlignedToFile.data,
        setIsMoleculeAlignedToColoursLoaded,
        themeNameAlignedTo,
        [viewerA.moleculeAlignedTo, viewerB.moleculeAlignedTo, representationTypeAlignedTo, structureRefAAlignedTo, structureRefBAlignedTo]
    );
    useUpdateColors(
        colorsAlignedFile.data,
        setIsMoleculeAlignedColoursLoaded,
        themeNameAligned,
        [viewerA.moleculeAligned, viewerB.moleculeAligned, representationTypeAligned, structureRefAAligned, structureRefBAligned]
    );

    /**
     * Reusable effect for updating chain IDs.
     * @param pluginRef The plugin ref (viewerA.ref or viewerB.ref).
     * @param structureRef The structure ref to get chain IDs from.
     * @param molstar The molstar viewer hook instance.
     * @param setChainInfo Function to set the chain IDs state.
     * @param label Label for logging purposes.
     * @param deps Additional dependencies for the effect.
     */
    function useUpdateChainInfo(
        pluginRef: React.RefObject<PluginUIContext | null>,
        structureRef: string | null,
        molstar: ReturnType<typeof useMolstarViewer>,
        setChainInfo: React.Dispatch<React.SetStateAction<{ chainLabels: Map<string, string>; }>>,
        label: string
    ) {
        useEffect(() => {
            console.log(`Updating chain IDs for ${label}`);
            const plugin = pluginRef.current;
            if (!plugin || !structureRef) return;
            const structureObj = plugin.managers.structure.hierarchy.current.structures.find(
                s => s.cell.transform.ref === structureRef
            )?.cell.obj?.data;
            if (!structureObj) return;
            setChainInfo(molstar.getChainInfo(structureObj));
        }, [pluginRef, structureRef]);
    }

    // Use useUpdateChainIds
    // viewerA AlignedTo
    useUpdateChainInfo(viewerA.ref, structureRefAAlignedTo, molstarA,
        setChainInfoAlignedTo, AlignedTo);
    // viewerB Aligned
    useUpdateChainInfo(viewerB.ref, structureRefBAligned, molstarB,
        setChainInfoAligned, Aligned);

    // Generalized effect for residue ID selection
    function useUpdateResidueInfo(
        viewerRef: React.RefObject<PluginUIContext | null>,
        structureRef: string | null,
        molstar: ReturnType<typeof useMolstarViewer>,
        selectedChainId: string,
        setResidueInfo: React.Dispatch<React.SetStateAction<{ residueLabels: Map<string, ResidueLabelInfo>; residueToAtomIds: Record<string, string[]> }>>,
        selectedResidueId: string,
        setSelectedResidueId: React.Dispatch<React.SetStateAction<string>>,
        label: string
    ) {
        useEffect(() => {
            // Only update residue IDs when a chain is selected
            if (!selectedChainId) {
                setResidueInfo({ residueLabels: new Map(), residueToAtomIds: {} });
                setSelectedResidueId('');
                return;
            }
            console.log(`Updating Residue IDs for ${label}, chain:`, selectedChainId);
            const plugin = viewerRef.current;
            if (!plugin) return;
            const structureObj = plugin.managers.structure.hierarchy.current.structures.find(
                s => s.cell.transform.ref === structureRef
            )?.cell.obj?.data;
            if (!structureObj) return;
            // Filter residue IDs to only those in the selected chain
            const residueInfo = molstar.getResidueInfo(structureObj, selectedChainId);
            setResidueInfo(residueInfo);
            // Reset selected residue if not in new list
            if (!residueInfo.residueLabels.has(selectedResidueId)) {
                setSelectedResidueId('');
            }
        }, [viewerRef, structureRef, selectedChainId]);
    }

    // Use useUpdateResidueIds
    // viewerA AlignedTo
    useUpdateResidueInfo(
        viewerA.ref,
        structureRefAAlignedTo,
        molstarA,
        selectedChainIdAlignedTo,
        setResidueInfoAlignedTo,
        selectedResidueIdAlignedTo,
        setSelectedResidueIdAlignedTo,
        AlignedTo
    );
    // viewerB Aligned
    useUpdateResidueInfo(
        viewerB.ref,
        structureRefBAligned,
        molstarB,
        selectedChainIdAligned,
        setResidueInfoAligned,
        selectedResidueIdAligned,
        setSelectedResidueIdAligned,
        Aligned
    );

    // --- Shared chain/residue loci and focus utilities ---
    /**
     * Get the loci for a given chain in a structure.
     */
    function getChainLoci(plugin: PluginUIContext, structureRef: string, chainId: string) {
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
    function focusLociOnChain(
        plugin: PluginUIContext,
        structureRef: string,
        chainId: string,
        syncPlugin?: PluginUIContext
    ) {
        const loci = getChainLoci(plugin, structureRef, chainId);
        if (!loci) return;
        plugin.managers.camera.focusLoci(loci);
        if (syncPlugin) {
            syncPlugin.managers.camera.focusLoci(loci);
        }
    }

    /**
     * Get the loci for a given residue in a chain.
     * Enhanced to allow optional insertion code for precise selection.
     * @param plugin The Mol* plugin instance.
     * @param structureRef The structure reference.
     * @param chainId The chain identifier.
     * @param residueId The residue identifier.
     * @param insCode Optional insertion code for the residue.
     * @returns The loci for the specified residue, or null if not found.
     */
    function getResidueLoci(
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
        if (typeof insCode === 'string' && insCode.length > 0) {
            tests['inscode-test'] = MolScriptBuilder.core.rel.eq([
                MolScriptBuilder.struct.atomProperty.macromolecular.pdbx_PDB_ins_code(),
                insCode
            ]);
        }
        console.log('[getResidueLoci] Query params:', { chainId, residueId, insCode });
        const qb = MolScriptBuilder.struct.generator.atomGroups(tests);
        const compiled = compile(qb);
        const ctx = new QueryContext(structureObj);
        const selection = compiled(ctx);
        // Debug: log selection size
        let selectionSize = 0;
        try {
            if (selection?.groups) {
                selectionSize = selection.groups.length;
            }
        } catch (e) {
            // ignore
        }
        console.log('[getResidueLoci] Selection size:', selectionSize, selection);
        
        // DEBUG: Log all auth_asym_id and auth_seq_id for the selected chain
            try {
                if (structureObj && structureObj.units) {
                    let found = false;
                    for (const unit of structureObj.units) {
                        if (unit.kind !== 0) continue; // Only atomic units
                        const { chainIndex, residueIndex, elements, model } = unit;
                        const chains = model.atomicHierarchy.chains;
                        const residues = model.atomicHierarchy.residues;
                        for (let i = 0; i < elements.length; i++) {
                            const atomIdx = elements[i];
                            const chainIdx = chainIndex[atomIdx];
                            let asymId = '';
                            if (chains && chains.auth_asym_id) {
                                if (typeof chains.auth_asym_id.value === 'function') {
                                    asymId = (chains.auth_asym_id.value as (idx: number) => string)(chainIdx);
                                } else if (Array.isArray(chains.auth_asym_id.value)) {
                                    asymId = (chains.auth_asym_id.value as unknown as any[])[chainIdx];
                                }
                            }
                            if (asymId !== chainId) continue;
                            const resIdx = residueIndex[atomIdx];
                            let seqId = '';
                            if (residues && residues.auth_seq_id) {
                                if (typeof residues.auth_seq_id.value === 'function') {
                                    seqId = (residues.auth_seq_id.value as (idx: number) => any)(resIdx)?.toString();
                                } else if (Array.isArray(residues.auth_seq_id.value)) {
                                    seqId = (residues.auth_seq_id.value as unknown as any[])[resIdx]?.toString();
                                }
                            }
                            let insCode = '';
                            if (residues && residues.pdbx_PDB_ins_code) {
                                if (typeof residues.pdbx_PDB_ins_code.value === 'function') {
                                    insCode = (residues.pdbx_PDB_ins_code.value as (idx: number) => any)(resIdx) || '';
                                } else if (Array.isArray(residues.pdbx_PDB_ins_code.value)) {
                                    insCode = (residues.pdbx_PDB_ins_code.value as unknown as any[])[resIdx] || '';
                                }
                            }
                            if (!found) {
                                found = true;
                                console.log('[getResidueLoci] Listing all residues for chain', chainId);
                            }
                            console.log(`[getResidueLoci] chainId: ${asymId}, auth_seq_id: ${seqId}, insCode: '${insCode}'`);
                        }
                    }
                }
            } catch (e) {
                console.warn('[getResidueLoci] Error logging residues:', e);
            }
        
        return StructureSelection.toLociWithSourceUnits(selection);
    }

    /**
     * Focus the camera on a residue loci, with optional sync to another plugin.
     */
    function focusLociOnResidue(
        plugin: PluginUIContext,
        structureRef: string,
        chainId: string,
        residueId: string,
        insCode?: string,
        syncPlugin?: PluginUIContext
    ) {
        const loci = getResidueLoci(plugin, structureRef, chainId, residueId, insCode);
        if (!loci) return;
        const focusOptions = { extraRadius: zoomExtraRadius, minRadius: zoomMinRadius };
        plugin.managers.camera.focusLoci(loci, focusOptions);
        if (syncPlugin) {
            syncPlugin.managers.camera.focusLoci(loci, focusOptions);
        }
    }

    /**
     * Creates a handler to zoom to a selection based on a structure property.
     * Uses shared chain/residue loci/focus utilities.
     */
    function createZoomHandler(
        pluginRef: React.RefObject<PluginUIContext | null>,
        structureRef: string | null,
        property: 'entity-test' | 'chain-test' | 'residue-test' | 'atom-test' | 'group-by',
        chainId: string,
        sync: boolean = false,
        syncPluginRef?: React.RefObject<PluginUIContext | null>,
        residueId?: string,
        insCode?: string
    ) {
        return {
            handleButtonClick: async () => {
                const plugin = pluginRef.current;
                if (!plugin || !structureRef) return;
                if (property === 'chain-test') {
                    focusLociOnChain(
                        plugin,
                        structureRef,
                        chainId,
                        sync && syncPluginRef?.current ? syncPluginRef.current : undefined
                    );
                } else if (property === 'residue-test') {
                    focusLociOnResidue(
                        plugin,
                        structureRef,
                        chainId,
                        residueId ?? '',
                        insCode,
                        sync && syncPluginRef?.current ? syncPluginRef.current : undefined
                    );
                } else {
                    // fallback: use chain loci for other property types for now
                    focusLociOnChain(
                        plugin,
                        structureRef,
                        chainId,
                        sync && syncPluginRef?.current ? syncPluginRef.current : undefined
                    );
                }
            }
        };
    }

    // Create chain zoomA handlers.
    const chainZoomAAlignedTo = createZoomHandler(
        viewerA.ref,
        structureRefAAlignedTo,
        'chain-test',
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerB.ref
    );
    const chainZoomAAligned = createZoomHandler(
        viewerA.ref,
        structureRefAAligned,
        'chain-test',
        selectedChainIdAligned,
        syncEnabled,
        viewerB.ref
    );

    // Create chain zoomB handlers.
    const chainZoomBAlignedTo = createZoomHandler(
        viewerB.ref,
        structureRefBAlignedTo,
        'chain-test',
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerA.ref
    );
    const chainZoomBAligned = createZoomHandler(
        viewerB.ref,
        structureRefBAligned,
        'chain-test',
        selectedChainIdAligned,
        syncEnabled,
        viewerA.ref
    );

    // Create Residue zoomA handlers.
    const residueZoomAAlignedTo = createZoomHandler(
        viewerA.ref,
        structureRefAAlignedTo,
        'residue-test',
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerB.ref,
        selectedResidueIdAlignedTo,
        residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.insCode
    );
    const residueZoomAAligned = createZoomHandler(
        viewerA.ref,
        structureRefAAligned,
        'residue-test',
        selectedChainIdAligned,
        syncEnabled,
        viewerB.ref,
        selectedResidueIdAligned,
        residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.insCode
    );

    // Create Residue zoomB handlers.
    const residueZoomBAlignedTo = createZoomHandler(
        viewerB.ref,
        structureRefBAlignedTo,
        'residue-test',
        selectedChainIdAlignedTo,
        syncEnabled,
        viewerA.ref,
        selectedResidueIdAlignedTo,
        residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.insCode
    );
    const residueZoomBAligned = createZoomHandler(
        viewerB.ref,
        structureRefBAligned,
        'residue-test',
        selectedChainIdAligned,
        syncEnabled,
        viewerA.ref,
        selectedResidueIdAligned,
        residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.insCode
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
            if (molstar.structureRefs[AlignedTo]) {
                molstar.refreshRepresentationRefs(AlignedTo, molstar.structureRefs[AlignedTo]!);
            }
            if (molstar.structureRefs[Aligned]) {
                molstar.refreshRepresentationRefs(Aligned, molstar.structureRefs[Aligned]!);
            }
            if (doForceUpdate) forceUpdate();
        });
    };

    // Realign handler using selected chains
    const handleRealignToChains = () => {
        const pluginA = viewerA.ref.current;
        if (!pluginA) {
            console.warn('Viewer A not initialized.');
            return;
        }
        // Step 1: Extract atom data for selected chains in both structures
        if (!structureRefAAlignedTo || !selectedChainIdAlignedTo) {
            console.warn('Viewer A, structure, or chain not selected.');
            return;
        }
        // Get objects
        const structureAlignedTo = pluginA.managers.structure.hierarchy.current.structures.find(
            s => s.cell.transform.ref === structureRefAAlignedTo
        )?.cell.obj?.data;
        console.log('structureAlignedTo:', structureAlignedTo);
        if (!viewerA.moleculeAlignedTo) {
            console.warn('Viewer A moleculeAlignedTo not available.');
            return;
        }
        const trajectoryAlignedTo = viewerA.moleculeAlignedTo.trajectory;
        if (!viewerA.moleculeAligned) {
            console.warn('Viewer A moleculeAligned not available.');
            return;
        }
        const trajectoryAligned = viewerA.moleculeAligned.trajectory;
        const structureAligned = pluginA.managers.structure.hierarchy.current.structures.find(
            s => s.cell.transform.ref === structureRefAAligned
        )?.cell.obj?.data;
        console.log('structureAligned:', structureAligned);
        if (!structureAlignedTo || !structureAligned) {
            console.warn('Could not find structure objects for selected refs.');
            return;
        }
        // Get model from first unit in structure object
        const modelAlignedTo = structureAlignedTo?.units?.[0]?.model;
        const modelAligned = structureAligned?.units?.[0]?.model;
        if (!modelAlignedTo || !modelAligned) {
            console.warn('Could not find models in structures.');
            return;
        }

        // Extract atom data for each structure using atomicHierarchy and atomicConformation from model
        const atomDataAlignedTo = extractAtomData(pluginA, trajectoryAlignedTo);
        const atomDataAligned = extractAtomData(pluginA, trajectoryAligned);
        // Filter atoms by selected chain
        const indicesAlignedTo = atomDataAlignedTo.chain_ids
            .map((id: string, i: number) => id === selectedChainIdAlignedTo ? i : -1)
            .filter((i: number) => i !== -1);
        const indicesAligned = atomDataAligned.chain_ids
            .map((id: string, i: number) => id === selectedChainIdAligned ? i : -1)
            .filter((i: number) => i !== -1);
        const filteredAlignedTo = {
            symbol_type: indicesAlignedTo.map((i: number) => atomDataAlignedTo.symbol_type[i]),
            chain_ids: indicesAlignedTo.map((i: number) => atomDataAlignedTo.chain_ids[i]),
            xs: indicesAlignedTo.map((i: number) => atomDataAlignedTo.xs[i]),
            ys: indicesAlignedTo.map((i: number) => atomDataAlignedTo.ys[i]),
            zs: indicesAlignedTo.map((i: number) => atomDataAlignedTo.zs[i]),
        };
        const filteredAligned = {
            symbol_type: indicesAligned.map((i: number) => atomDataAligned.symbol_type[i]),
            chain_ids: indicesAligned.map((i: number) => atomDataAligned.chain_ids[i]),
            xs: indicesAligned.map((i: number) => atomDataAligned.xs[i]),
            ys: indicesAligned.map((i: number) => atomDataAligned.ys[i]),
            zs: indicesAligned.map((i: number) => atomDataAligned.zs[i]),
        };
        console.log('Filtered atom data for alignment:');
        console.log('AlignedTo atoms:', filteredAlignedTo);
        console.log('Aligned atoms:', filteredAligned);
        // Step 2: Debug: show atom selection for alignment
        const selectedAtomTypes: { [key: string]: boolean } = { 'P': true };
        // Count atoms in selected chains and atom types
        const movingSelected = atomDataAlignedTo.symbol_type
            .map((type, i) => (atomDataAlignedTo.chain_ids[i] === selectedChainIdAligned && selectedAtomTypes[type]) ? i : -1)
            .filter(i => i !== -1);
        const referenceSelected = atomDataAligned.symbol_type
            .map((type, i) => (atomDataAligned.chain_ids[i] === selectedChainIdAligned && selectedAtomTypes[type]) ? i : -1)
            .filter(i => i !== -1);
        console.log('Moving atoms selected for alignment:', movingSelected.length);
        console.log('Reference atoms selected for alignment:', referenceSelected.length);
        console.log('Atom types in moving chain:', Array.from(new Set(atomDataAlignedTo.symbol_type.filter((type, i) => atomDataAlignedTo.chain_ids[i] === selectedChainIdAligned))));
        console.log('Atom types in reference chain:', Array.from(new Set(atomDataAligned.symbol_type.filter((type, i) => atomDataAligned.chain_ids[i] === selectedChainIdAligned))));
        // Step 3: Call alignment function
        try {
            const result = alignDatasetUsingChains(
                atomDataAlignedTo.symbol_type,
                atomDataAlignedTo.chain_ids,
                atomDataAlignedTo.xs,
                atomDataAlignedTo.ys,
                atomDataAlignedTo.zs,
                atomDataAligned.symbol_type,
                atomDataAligned.chain_ids,
                atomDataAligned.xs,
                atomDataAligned.ys,
                atomDataAligned.zs,
                selectedChainIdAligned,
                selectedAtomTypes
            );
            console.log('Aligned coordinates:', result);
        } catch (err) {
            console.error('Alignment error:', err);
        }
    };

    // Return the main app component.
    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.6.0 (please see <a href="https://github.com/ribocode-slola/ribocode1/?tab=readme-ov-file#ribocode" target="_blank">README</a> for information).</h1>
                <div className="General-Controls">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <label>
                            Residue Zoom extraRadius:
                            <input
                                type="number"
                                value={zoomExtraRadius}
                                min={0}
                                max={100}
                                step={1}
                                style={{ width: 60, marginLeft: 4 }}
                                onChange={e => setZoomExtraRadius(Number(e.target.value))}
                            />
                        </label>
                        <label>
                            minRadius:
                            <input
                                type="number"
                                value={zoomMinRadius}
                                min={0}
                                max={100}
                                step={1}
                                style={{ width: 60, marginLeft: 4 }}
                                onChange={e => setZoomMinRadius(Number(e.target.value))}
                            />
                        </label>
                    </div>
                    <SyncButton
                        viewerA={viewerA.ref.current}
                        viewerB={viewerB.ref.current}
                        activeViewer={activeViewer}
                        disabled={!viewerB.isMoleculeAlignedToLoaded}
                        syncEnabled={syncEnabled}
                        setSyncEnabled={setSyncEnabled}
                    />
                    <button
                        disabled={!selectedChainIdAlignedTo || !selectedChainIdAligned}
                        onClick={handleRealignToChains}
                    >
                        {selectedChainIdAlignedTo && selectedChainIdAligned
                            ? `Re-Align: ${selectedChainIdAlignedTo} → ${selectedChainIdAligned}`
                            : 'Re-Align to Chains'}
                    </button>
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
                <div className="Two-Columns-Container">
                    <div className="Column">
                        <LoadDataRow
                            viewerTitle={viewerA.moleculeAlignedTo ? AlignedTo + `: ${viewerA.moleculeAlignedTo.name || viewerA.moleculeAlignedTo.filename}` : ""}
                            isLoaded={viewerA.isMoleculeAlignedToLoaded}
                            onFileInputClick={viewerA.handleFileInputButtonClick}
                            fileInputRef={viewerA.fileInputRef}
                            onFileChange={e => handleFileChange(e, AlignedTo)}
                            fileInputDisabled={!viewerAReady || !viewerBReady}
                            fileInputLabel={`Load ` + AlignedTo}
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
                                    colorTheme = { name: AlignedTo + '-custom-chain-colors', params: {} };
                                } else {
                                    colorTheme = { name: 'default', params: {} };
                                }
                                // Generate a repId and use for both viewers
                                const repId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
                                if (viewerA.moleculeAlignedTo && structureRefAAlignedTo) {
                                    molstarA.addRepresentation(
                                        AlignedTo,
                                        structureRefAAlignedTo,
                                        representationTypeAlignedTo,
                                        colorTheme,
                                        repId
                                    );
                                }
                                if (viewerB.moleculeAlignedTo && structureRefBAlignedTo) {
                                    molstarB.addRepresentation(
                                        AlignedTo,
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
                            //selectedSubunit={selectedSubunitAlignedTo}
                            //onSelectSubunit={setSelectedSubunitAlignedTo}
                            //subunitSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            chainInfo={chainInfoAlignedTo}
                            selectedChainId={selectedChainIdAlignedTo}
                            onSelectChainId={setSelectedChainIdAlignedTo}
                            chainSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                            residueInfo={residueInfoAlignedTo}
                            selectedResidueId={selectedResidueIdAlignedTo}
                            onSelectResidueId={setSelectedResidueIdAlignedTo}
                            residueSelectDisabled={!viewerA.isMoleculeAlignedToLoaded}
                        />
                        <MoleculeUI
                            key={molstarA.representationRefs[AlignedTo]?.join('-') || A + '-' + AlignedTo}
                            label={viewerA.moleculeAlignedTo?.label ?? AlignedTo}
                            plugin={viewerA.ref.current}
                            isVisible={viewerA.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerAAlignedTo.handleButtonClick}
                            chainZoomLabel={chainInfoAlignedTo.chainLabels.get(selectedChainIdAlignedTo)!}
                            onChainZoom={chainZoomAAlignedTo.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAlignedTo}
                            residueZoomLabel={residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.name || ''}
                            onResidueZoom={residueZoomAAlignedTo.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAlignedTo}
                            isLoaded={viewerA.isMoleculeAlignedToLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarA.representationRefs[AlignedTo] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarA for viewerA's row
                                const repId = Object.entries(molstarA.repIdMap[AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[AlignedTo][repId], AlignedTo, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[AlignedTo][repId], AlignedTo, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarA.repIdMap[AlignedTo][repId], AlignedTo, molstarA);
                                } else {
                                    // fallback for legacy/edge
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, AlignedTo, molstarA, false),
                                            deleteRepresentation(ref, AlignedTo, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, AlignedTo, molstarA);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerA
                                const repId = Object.entries(molstarA.repIdMap[AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarA.repIdMap[AlignedTo][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarA.representationRefs[AlignedTo].indexOf(ref);
                                    if (idx >= 0) repRef = molstarA.representationRefs[AlignedTo][idx];
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
                        <MoleculeUI
                            key={molstarA.representationRefs[Aligned]?.join('-') || A + '-' + Aligned}
                            label={viewerA.moleculeAligned?.label ?? Aligned}
                            plugin={viewerA.ref.current}
                            isVisible={viewerA.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerAAligned.handleButtonClick}
                            chainZoomLabel={chainInfoAligned.chainLabels.get(selectedChainIdAligned)!}
                            onChainZoom={chainZoomAAligned.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAligned}
                            residueZoomLabel={residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.name || ''}
                            onResidueZoom={residueZoomAAligned.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAligned}
                            isLoaded={viewerA.isMoleculeAlignedLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarA.representationRefs[Aligned] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarA for viewerA's row
                                const repId = Object.entries(molstarA.repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[Aligned][repId], Aligned, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[Aligned][repId], Aligned, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarA.repIdMap[Aligned][repId], Aligned, molstarA);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, Aligned, molstarA, false),
                                            deleteRepresentation(ref, Aligned, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, Aligned, molstarA);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerA
                                const repId = Object.entries(molstarA.repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarA.repIdMap[Aligned][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarA.representationRefs[Aligned].indexOf(ref);
                                    if (idx >= 0) repRef = molstarA.representationRefs[Aligned][idx];
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
                            viewerTitle={viewerB.moleculeAligned ? Aligned + `: ${viewerB.moleculeAligned.name || viewerB.moleculeAligned.filename}` : ""}
                            isLoaded={viewerB.isMoleculeAlignedLoaded}
                            onFileInputClick={viewerB.handleFileInputButtonClick}
                            fileInputRef={viewerB.fileInputRef}
                            onFileChange={e => handleFileChange(e, Aligned)}
                            fileInputDisabled={!viewerA.isMoleculeAlignedToLoaded || !viewerAReady || !viewerBReady}
                            fileInputLabel={`Load ${Aligned}`}
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
                                    colorTheme = { name: Aligned + '-custom-chain-colors', params: {} };
                                } else {
                                    colorTheme = { name: 'default', params: {} };
                                }
                                // Generate a repId and use for both viewers
                                const repId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
                                if (viewerA.moleculeAligned && structureRefAAligned) {
                                    molstarA.addRepresentation(
                                        Aligned,
                                        structureRefAAligned,
                                        representationTypeAligned,
                                        colorTheme,
                                        repId
                                    );
                                }
                                if (viewerB.moleculeAligned && structureRefBAligned) {
                                    molstarB.addRepresentation(
                                        Aligned,
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
                            //selectedSubunit={selectedSubunitAligned}
                            //onSelectSubunit={setSelectedSubunitAligned}
                            //subunitSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                            chainInfo={chainInfoAligned}
                            selectedChainId={selectedChainIdAligned}
                            onSelectChainId={setSelectedChainIdAligned}
                            chainSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                            residueInfo={residueInfoAligned}
                            selectedResidueId={selectedResidueIdAligned}
                            onSelectResidueId={setSelectedResidueIdAligned}
                            residueSelectDisabled={!viewerB.isMoleculeAlignedLoaded}
                        />
                        <MoleculeUI
                            key={molstarB.representationRefs[AlignedTo]?.join('-') || B + `-` + AlignedTo}
                            label={viewerB.moleculeAlignedTo?.label ?? AlignedTo}
                            plugin={viewerB.ref.current}
                            isVisible={viewerB.isMoleculeAlignedToVisible}
                            onToggleVisibility={toggleViewerBAlignedTo.handleButtonClick}
                            chainZoomLabel={chainInfoAlignedTo.chainLabels.get(selectedChainIdAlignedTo)!}
                            onChainZoom={chainZoomBAlignedTo.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAlignedTo}
                            residueZoomLabel={residueInfoAlignedTo.residueLabels.get(selectedResidueIdAlignedTo)?.name || ''}
                            onResidueZoom={residueZoomBAlignedTo.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAlignedTo}
                            isLoaded={viewerB.isMoleculeAlignedToLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarB.representationRefs[AlignedTo] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarB for viewerB's row
                                const repId = Object.entries(molstarB.repIdMap[AlignedTo]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[AlignedTo][repId], AlignedTo, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[AlignedTo][repId], AlignedTo, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarB.repIdMap[AlignedTo][repId], AlignedTo, molstarB);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, AlignedTo, molstarA, false),
                                            deleteRepresentation(ref, AlignedTo, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, AlignedTo, molstarB);
                                    }
                                }
                            }}
                            onToggleRepVisibility={ref => {
                                // Toggle visibility for this representation only in viewerB
                                const repId = Object.entries(molstarB.repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                                let repRef = repId ? molstarB.repIdMap[Aligned][repId] : ref;
                                if (!repRef) {
                                    const idx = molstarB.representationRefs[Aligned].indexOf(ref);
                                    if (idx >= 0) repRef = molstarB.representationRefs[Aligned][idx];
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
                        <MoleculeUI
                            key={molstarB.representationRefs[Aligned]?.join('-') || B + `-` + Aligned}
                            label={viewerB.moleculeAligned?.label ?? Aligned}
                            plugin={viewerB.ref.current}
                            isVisible={viewerB.isMoleculeAlignedVisible}
                            onToggleVisibility={toggleViewerBAligned.handleButtonClick}
                            chainZoomLabel={chainInfoAligned.chainLabels.get(selectedChainIdAligned)!}
                            onChainZoom={chainZoomBAligned.handleButtonClick}
                            chainZoomDisabled={!selectedChainIdAligned}
                            residueZoomLabel={residueInfoAligned.residueLabels.get(selectedResidueIdAligned)?.name || ''}
                            onResidueZoom={residueZoomBAligned.handleButtonClick}
                            residueZoomDisabled={!selectedResidueIdAligned}
                            isLoaded={viewerB.isMoleculeAlignedLoaded}
                            forceUpdate={forceUpdate}
                            representationRefs={molstarB.representationRefs[Aligned] || []}
                            onDeleteRepresentation={ref => {
                                // Always use repId from molstarB for viewerB's row
                                const repId = Object.entries(molstarB.repIdMap[Aligned]).find(([id, r]) => r === ref)?.[0];
                                if (syncEnabled && repId) {
                                    Promise.all([
                                        deleteRepresentation(molstarA.repIdMap[Aligned][repId], Aligned, molstarA, false),
                                        deleteRepresentation(molstarB.repIdMap[Aligned][repId], Aligned, molstarB, false)
                                    ]).then(forceUpdate);
                                } else if (repId) {
                                    deleteRepresentation(molstarB.repIdMap[Aligned][repId], Aligned, molstarB);
                                } else {
                                    if (syncEnabled) {
                                        Promise.all([
                                            deleteRepresentation(ref, Aligned, molstarA, false),
                                            deleteRepresentation(ref, Aligned, molstarB, false)
                                        ]).then(forceUpdate);
                                    } else {
                                        deleteRepresentation(ref, Aligned, molstarB);
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