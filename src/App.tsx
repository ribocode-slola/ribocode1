import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import { parseColorFileContent, getColourTheme, createChainColorTheme } from './utils/colors';
import { parseDictionaryFileContent } from './utils/dictionary';
import { toggleViewerVisibility, toggleVisibility, ViewerKey, ViewerState } from './RibocodeViewer';
//import { loadMoleculeToViewer } from './utils/data';
import './App.css';
import { loadMoleculeFileToViewer, Molecule, PresetResult } from 'molstar/lib/extensions/ribocode/structure';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
//import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
//import { StructureRepresentation3D } from 'molstar/lib/mol-plugin-state/transforms/representation';
//import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
//import { ObjectListControl } from 'molstar/lib/mol-plugin-ui/controls/parameters';
//import { Overpaint } from 'molstar/lib/mol-theme/overpaint';
import { Unit, Structure, StructureElement, StructureQuery, StructureSelection } from 'molstar/lib/mol-model/structure';
//import { StructureSelectionQuery } from 'packages/molstar/src/mol-plugin-state/helpers/structure-selection-query';
import { QueryContext } from 'molstar/lib/mol-model/structure/query/context';
//import { ElementIndex } from 'molstar/lib/mol-model/structure';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/base';
import { VisibilityOutlinedSvg, VisibilityOffOutlinedSvg } from 'molstar/lib/mol-plugin-ui/controls/icons';
//import { Data } from 'molstar/lib/extensions/ribocode/colors';
//import { set } from 'lodash';
//import { AtomicHierarchy } from 'molstar/lib/mol-model/structure/model/properties/atomic';

const App: React.FC = () => {
    console.log('App rendered');

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
    const [chainColorMap, setChainColorMap] = useState<Map<string, Map<string, Color>>>(new Map());
    //const [chainAlignedToColorMap, setChainAlignedToColorMap] = useState<Map<string, Color>>(new Map());
    //const [chainAlignedColorMap, setChainAlignedColorMap] = useState<Map<string, Color>>(new Map());
    //const [chainIdsAlignedTo, setChainIdsAlignedTo] = useState<Set<string>>(new Set());
    //const [chainIdsAligned, setChainIdsAligned] = useState<Set<string>>(new Set());
        
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

    /**
     * Update colorTheme for a molecule.
     * @param viewer The viewer state.
     * @param molecule The molecule to update.
     * @param colorTheme The color theme to apply.
     * @param type The representation type.
     * @param structureIndex The index of the structure to be updated in the 
     * viewer hierarchy. This is hardcoded to 0 or 1 depending on whether the
     * molecule is alignedTo or aligned. If the user reorders the structures,
     * this could cause problems. There may be a better way to ascertain the 
     * structure index for the molecule in each viewer which may change.
     */
    async function updateMoleculeColors(
        viewer: ViewerState,
        molecule: Molecule,
        colorTheme: any,
        type: 'spacefill' | 'cartoon' | 'ball-and-stick',
        structureIndex: number,
    ) {
        const plugin = viewer.ref.current;
        if (!plugin) return;
        const pr: PresetResult = molecule.presetResult;
        if (!pr) {
            console.warn('No presetResult found in moleculeAlignedTo.');
            return;
        }
        console.log('presetResult:', pr);
        // Object { model: {…}, modelProperties: {…}, unitcell: undefined, structure: {…}, structureProperties: {…}, representation: {…} }
        const model = (pr as { model: any }).model;
        if (!model) {
            console.warn('No model found in presetResult.');
            return;
        }
        console.log('model:', model);
        const modelProperties = (pr as { modelProperties: any }).modelProperties;
        if (!modelProperties) {
            console.warn('No modelProperties found in presetResult.');
            return;
        }
        console.log('modelProperties:', modelProperties);
        const structure = (pr as { structure: any }).structure;
        if (!structure) {
            console.warn('No structure found in presetResult.');
            return;
        }
        console.log('structure:', structure);
        const structureProperties = (pr as { structureProperties: any }).structureProperties;
        if (!structureProperties) {
            console.warn('No structureProperties found in presetResult.');
            return;
        }
        console.log('structureProperties:', structureProperties);
        // Get the representation.
        const representation = (pr as { representation: any }).representation;
        if (!representation) {
            console.warn('No representation found in presetResult.');
            return;
        }
        // console.log('representation:', representation);
        // const components = representation.components;
        // console.log('components:', components);
        const representations = representation.representations;
        console.log('representations:', representations);
        // Update the representation using the plugin state API
        const builders = plugin.builders;
        if (!builders) {
            console.warn('No builders found in plugin.');
            return;
        }
        console.log('builders:', builders); 
        const structureBuilder = builders.structure;
        if (!structureBuilder) {
            console.warn('No structure found in builders.');
            return;
        }
        console.log('builders.structure:', structureBuilder);
        const representationBuilder = structureBuilder.representation;
        if (!representationBuilder) {
            console.warn('No representation found in structure builders.');
            return;
        }
        console.log('builders.structure.representation:', representationBuilder);
        // Get the plugin state root
        const psd = plugin.state.data;
        console.log('plugin.state.data:', psd);
        const root = psd.root;
        if (!root) {
            console.warn('No root found in plugin.state.data.');
            return;
        }
        console.log('plugin.state.data.root:', root);
        const structures = plugin.managers.structure.hierarchy.current.structures;
        if (!structures || structures.length === 0) {
            console.warn('No structures found in hierarchy.');
            return;
        }
        console.log('structures in hierarchy:', structures);
        const structureCell = plugin.managers.structure.hierarchy.current.structures[structureIndex]?.cell;
        if (!structureCell) {
            console.warn('No structure cell found in hierarchy.');
            return;
        }
        console.log('structureCell:', structureCell);
        const structureRef = structureCell.transform.ref;
        if (!structureRef) {
            console.warn('No structureRef found in hierarchy.');
            return;
        }
        console.log('structureRef:', structureRef);
        // const structureRefObj = { ref: structureCell.transform.ref }; // Wrap the ref string
        // console.log('structureRefObj:', structureRefObj);
        // Build the current state to get the structure.
        const builder = psd.build();
        // Build new representation with updated color theme.
        const newrep = representationBuilder.buildRepresentation(
            builder,
            structureRef,
            // structureCell,
            // structureRefObj,
            {
                type: type,
                colorTheme: colorTheme
            }
        );
        console.log('Built new representation:', newrep);
        // Add to representations object.
        const repKey = type; // or use newrep.ref for uniqueness
        representations[repKey] = newrep;
        console.log('representations:', representations);
        // Get plugin managers.
        const managers = plugin.managers;
        if (!managers) {
            console.warn('No managers found in plugin.');
            return;
        }
        console.log('managers:', managers);
        // Get the structure component.
        const structureComponent = managers.structure.hierarchy.current.structures[0]?.components[0];
        if (!structureComponent) {
            console.warn('No structure component found to update representation.');
            return;
        }
        console.log('structureComponent:', structureComponent);
        // Get existing representations.
        const reprs = structureComponent.representations;
        if (!reprs || reprs.length === 0) {
            console.warn('No representations found in structure component.');
            return;
        }
        console.log('Representations:', reprs);
        //console.log('Applied color theme:', representation.cell?.params?.values?.colorTheme);
        // Add the new representation to the state.
        await psd.build()
            .to(structureCell.transform.ref)
            .apply(
                StateTransforms.Representation.StructureRepresentation3D, // Transformer for structure representations
                {
                    type: { name: type, params: {} },
                    colorTheme: { name: colorTheme.name, params: {} }
                }
            )
            .commit();
        console.log('New representation added to state.');
        // Request redraw with new colors.
        if (plugin.canvas3d) {
            plugin.canvas3d.requestDraw?.();
        }
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
            createChainColorTheme(themeName, chainColorMap.get(themeName)!) as any
        );
        // if (themeName === themeNameAlignedTo) {
        //     colorThemeRegistry.add(
        //         createChainColorTheme(themeName, chainAlignedToColorMap!) as any
        //     );
        // } else if (themeName === themeNameAligned) {
        //     colorThemeRegistry.add(
        //         createChainColorTheme(themeName, chainAlignedColorMap!) as any
        //     );
        // } else {
        //     console.warn(`Unknown theme name: ${themeName}`);
        //     return;
        // }
        console.log(`Registered ${themeName} theme.`);
    }

    /**
     * Updates theme used to style a molecule.
     * @param molA The molecule in viewer A.
     * @param molB The molecule in viewer B.
     * @param themeName The name of the theme.
     * @param type The representation type. This can be 'spacefill', 'cartoon',
     * or 'ball-and-stick'.
     * @param colors The array of color mapping objects.
     * @param structureIndex The index of the structure to be updated in the 
     * viewer hierarchy. This is hardcoded to 0 or 1 depending on whether the
     * molecule is alignedTo or aligned. If the user reorders the structures,
     * this could cause problems. There may be a better way to ascertain the 
     * structure index for the molecule in each viewer which may change.
     */
    function updateColorsForViewers(
        molA: Molecule | undefined,
        molB: Molecule | undefined,
        themeName: string,
        type: 'spacefill' | 'cartoon' | 'ball-and-stick',
        colors: Array<Record<string, string>>,
        structureIndex: number,
    ) {
        const ct = getColourTheme(themeName, colors);
        // Build chain color map:
        const themeChainColorMap = new Map<string, Color>();
        colors.forEach(row => {
            if (row.pdb_chain && row.color) {
                try {
                    themeChainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                } catch {
                    console.warn(`Invalid color: ${row.color}`);
                }
            }
        });
        console.log('themeChainColorMap:', themeChainColorMap);
        chainColorMap.set(themeName, themeChainColorMap);
        // // Update appropriate chain color map state:
        // if (themeName === themeNameAlignedTo) {
        //     setChainAlignedToColorMap(themeChainColorMap);
        //     setChainIdsAlignedTo(new Set(themeChainColorMap.keys()));
        // } else if (themeName === themeNameAligned) {
        //     setChainAlignedColorMap(themeChainColorMap);
        //     setChainIdsAligned(new Set(themeChainColorMap.keys()));
        // } else {
        //     console.warn(`Unknown theme name: ${themeName}`);
        //     return;
        // }
        // Register custom theme if needed:
        registerThemeIfNeeded(
            viewerA.ref.current!,
            themeName,
            //chainAlignedToColorMap,
            //chainAlignedColorMap
        );
        registerThemeIfNeeded(
            viewerB.ref.current!,
            themeName,
            //chainAlignedToColorMap,
            //chainAlignedColorMap
        );
        console.log('Registered theme:', themeName);
        // Update molecule colors in both viewers:
        if (molA && molB && colors.length) {
            updateMoleculeColors(viewerA, molA, ct, type, structureIndex);
            updateMoleculeColors(viewerB, molB, ct, type, structureIndex);
        }
    }
    // Effects to update colors when files are loaded.
    // AlignedTo:
    useEffect(() => {
        if (colorsAlignedToFile.data && colorsAlignedToFile.data.length > 0) {
            setIsMoleculeAlignedToColoursLoaded(true);
            updateColorsForViewers(
                viewerA.moleculeAlignedTo,
                viewerB.moleculeAlignedTo,
                themeNameAlignedTo,
                'spacefill',
                colorsAlignedToFile.data,
                0,
            );
        }
    }, [colorsAlignedToFile.data, viewerA.moleculeAlignedTo, viewerB.moleculeAlignedTo]);
    // Aligned:
    useEffect(() => {
        if (colorsAlignedFile.data && colorsAlignedFile.data.length > 0) {
            setIsMoleculeAlignedColoursLoaded(true);
            updateColorsForViewers(
                viewerA.moleculeAligned,
                viewerB.moleculeAligned,
                themeNameAligned,
                'spacefill',
                colorsAlignedFile.data,
                1,
            );
        }
    }, [colorsAlignedFile.data, viewerA.moleculeAligned, viewerB.moleculeAligned]);

    const [selectedChain, setSelectedChain] = useState('');
    
    /**
     * Creates a handler to select and zoom to a specific region in both viewers.
     * @return An object with a handleButtonClick method.
     */
    function createSelectAndZoom() {
        return {
            handleButtonClick: async () => {
                const pluginA = viewerA.ref.current;
                if (!pluginA) return;
                const pluginB = viewerB.ref.current;
                if (!pluginB) return;
                const chain = "LY";
                //const chain = selectedChain;
                // Get structures from viewer A.
                const structuresA = pluginA.managers.structure.hierarchy.current.structures;
                if (!structuresA) {
                    console.warn('No structures found in viewer A.');
                    return;
                }
                console.log(`Structures in viewer A:`, structuresA);
                console.log(`Number of structures:` + structuresA.length);
                const structureAAlignedTo = structuresA[0].cell.obj?.data;
                if (!structureAAlignedTo) {
                    console.warn('No structure data found for alignedTo in viewer A.');
                    return;
                }
                // const structureAAligned = structuresA[1].cell.obj?.data;
                // if (!structureAAligned) {
                //     console.warn('No structure data found for aligned in viewer A.');
                //     return;
                // }
                const qb = MolScriptBuilder.struct.generator.atomGroups({
                    'chain-test': MolScriptBuilder.core.rel.eq([
                        MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                        chain
                    ])
                    // For pdb_strand_id, use:
                    // MolScriptBuilder.struct.atomProperty.macromolecular.pdb_strand_id()
                });
                // const qb = MolScriptBuilder.struct.generator.atomGroups({
                //     'chain-test': MolScriptBuilder.core.rel.eq([
                //         MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                //         'A'
                //     ]),
                //     'residue-test': MolScriptBuilder.core.rel.inRange([
                //         MolScriptBuilder.struct.atomProperty.macromolecular.auth_seq_id(),
                //         10, 20
                //     ])
                // });
                const compiled = compile(qb);
                const ctx = new QueryContext(structureAAlignedTo);
                const selection = compiled(ctx);
                const loci = StructureSelection.toLociWithSourceUnits(selection);

                pluginA.managers.camera.focusLoci(loci);
                pluginB.managers.camera.focusLoci(loci);
            }
        };
    }
    // Create select and zoom handlers.
    const selectAndZoomA = createSelectAndZoom();
    const selectAndZoomB = createSelectAndZoom();
    
    // Return the main app component.
    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.4.2</h1>
                <div className="load-data-row">
                    <div className="viewer-title">
                        {viewerA.moleculeAlignedTo
                            ? `Molecule aligned to: ${viewerA.moleculeAlignedTo.name || viewerA.moleculeAlignedTo.filename}`
                            : ""}
                    </div>
                    {!viewerA.isMoleculeAlignedToLoaded && (
                        <>
                            <button
                                onClick={viewerA.handleFileInputButtonClick}
                                disabled={!viewerAReady || !viewerBReady}
                            >
                                Load Molecule To Align To
                            </button>
                            <input
                                type="file"
                                accept=".cif,.mmcif"
                                style={{ display: 'none' }}
                                ref={viewerA.fileInputRef}
                                onChange={e => handleFileChange(e, 'alignedTo')}
                            />
                        </>
                    )}
                    <button
                        onClick={colorsAlignedToFile.handleButtonClick}
                        disabled={!viewerA.isMoleculeAlignedToLoaded}
                    >
                        Load Colours
                    </button>
                    <input
                        type="file"
                        accept=".csv,.tsv,.txt,.json"
                        style={{ display: 'none' }}
                        ref={colorsAlignedToFile.inputRef}
                        onChange={colorsAlignedToFile.handleFileChange}
                    />
                </div>
                <div className="load-data-row">
                    <div className="viewer-title">
                        {viewerB.moleculeAligned
                            ? `Molecule aligned: ${viewerB.moleculeAligned.name || viewerB.moleculeAligned.filename}`
                            : ""}
                    </div>
                    {!viewerB.isMoleculeAlignedLoaded && (
                        <>
                            <button
                                onClick={viewerB.handleFileInputButtonClick}
                                disabled={!viewerA.isMoleculeAlignedToLoaded || !viewerAReady || !viewerBReady}
                            >
                                Load Molecule To Align
                            </button>
                            <input
                                type="file"
                                accept=".cif,.mmcif"
                                style={{ display: 'none' }}
                                ref={viewerB.fileInputRef}
                                onChange={e => handleFileChange(e, 'aligned')}
                            />
                        </>
                    )}
                    <button
                        onClick={colorsAlignedFile.handleButtonClick}
                        disabled={!viewerB.isMoleculeAlignedLoaded}
                    >
                        Load Colours
                    </button>
                    <input
                        type="file"
                        accept=".csv,.tsv,.txt,.json"
                        style={{ display: 'none' }}
                        ref={colorsAlignedFile.inputRef}
                        onChange={colorsAlignedFile.handleFileChange}
                    />
                </div>
                <div>
                    <SyncButton
                        viewerA={viewerA.ref.current}
                        viewerB={viewerB.ref.current}
                        activeViewer={activeViewer}
                        disabled={!viewerB.isMoleculeAlignedLoaded}
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
                        <div>
                            <button
                                onClick={toggleViewerAAlignedTo.handleButtonClick}
                                disabled={!viewerA.isMoleculeAlignedToLoaded}
                            >
                                {viewerA.isMoleculeAlignedToVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
                                <span style={{ marginLeft: 8 }}>
                                    {viewerA.moleculeAlignedTo?.label ?? 'Molecule Aligned'}
                                </span>
                            </button>
                            <button
                                onClick={toggleViewerAAligned.handleButtonClick}
                                disabled={!viewerA.isMoleculeAlignedLoaded}
                            >
                                {viewerA.isMoleculeAlignedVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
                                <span style={{ marginLeft: 8 }}>
                                    {viewerA.moleculeAligned?.label ?? 'Molecule Aligned'}
                                </span>
                            </button>
                            <button
                                onClick={selectAndZoomA.handleButtonClick}
                                disabled={!isMoleculeAlignedToColoursLoaded}
                            >
                                Select and Zoom
                            </button>
                        </div>
                        <MolstarContainer
                            viewerKey={viewerA.viewerKey}
                            setViewer={setViewerAWrapper}
                            onMouseDown={() => setActiveViewer(viewerA.viewerKey)}
                            onReady={() => setViewerAReady(true)}
                        />
                    </div>
                    <div className="viewer-wrapper">
                        <div>
                            <button
                                onClick={toggleViewerBAlignedTo.handleButtonClick}
                                disabled={!viewerB.isMoleculeAlignedToLoaded}
                            >
                                {viewerB.isMoleculeAlignedToVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
                                <span style={{ marginLeft: 8 }}>
                                    {viewerB.moleculeAlignedTo?.label ?? 'Molecule Aligned To'}
                                </span>
                            </button>
                            <button
                                onClick={toggleViewerBAligned.handleButtonClick}
                                disabled={!viewerB.isMoleculeAlignedLoaded}
                            >
                                {viewerB.isMoleculeAlignedVisible ? <VisibilityOutlinedSvg /> : <VisibilityOffOutlinedSvg />}
                                <span style={{ marginLeft: 8 }}>
                                    {viewerB.moleculeAligned?.label ?? 'Molecule Aligned'}
                                </span>
                            </button>
                            <button
                                onClick={selectAndZoomB.handleButtonClick}
                                disabled={!isMoleculeAlignedColoursLoaded}
                            >
                                Select and Zoom
                            </button>
                        </div>
                        <MolstarContainer
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