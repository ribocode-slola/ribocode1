import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import { parseColorFileContent } from './utils/colors';
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
import { StructureRepresentation3D } from 'molstar/lib/mol-plugin-state/transforms/representation';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
//import { ObjectListControl } from 'molstar/lib/mol-plugin-ui/controls/parameters';
import { Overpaint } from 'molstar/lib/mol-theme/overpaint';
import { Unit, Structure, StructureElement, StructureQuery, StructureSelection } from 'molstar/lib/mol-model/structure';
import { StructureSelectionQuery } from 'packages/molstar/src/mol-plugin-state/helpers/structure-selection-query';
import { QueryContext } from 'molstar/lib/mol-model/structure/query/context';
import { ElementIndex } from 'molstar/lib/mol-model/structure';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { compile } from 'molstar/lib/mol-script/runtime/query/base';
import { VisibilityOutlinedSvg, VisibilityOffOutlinedSvg } from 'molstar/lib/mol-plugin-ui/controls/icons';
import { Data } from 'molstar/lib/extensions/ribocode/colors';
import { ThemeDataContext } from 'molstar/lib/mol-theme/theme';
import { AtomicHierarchy } from 'molstar/lib/mol-model/structure/model/properties/atomic';
import { ColorType } from 'molstar/lib/mol-geo/geometry/color-data';
import { ColorTheme } from 'molstar/lib/mol-theme/color';

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
    const colorsAlignedToFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    const colorsAlignedFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);

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
                    // Load alignedTo molecule into both viewers
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

    async function handleToggle(viewer: any, moleculeKey: string, setVisible: (v: boolean) => void, isVisible: boolean) {
        const molecule = viewer[moleculeKey];
        const model = molecule?.presetResult && (molecule.presetResult as any).model;
        if (model) {
            await toggleVisibility(viewer, model);
            setVisible(!isVisible);
        }
    }

    const toggleViewerAAlignedTo = {
        handleButtonClick: () =>
            handleToggle(
                viewerA,
                'moleculeAlignedTo',
                viewerA.setIsMoleculeAlignedToVisible,
                viewerA.isMoleculeAlignedToVisible
            ),
    };

    const toggleViewerAAligned = {
        handleButtonClick: () =>
            handleToggle(
                viewerA,
                'moleculeAligned',
                viewerA.setIsMoleculeAlignedVisible,
                viewerA.isMoleculeAlignedVisible
            ),
    };

    const toggleViewerBAlignedTo = {
        handleButtonClick: () =>
            handleToggle(
                viewerB,
                'moleculeAlignedTo',
                viewerB.setIsMoleculeAlignedToVisible,
                viewerB.isMoleculeAlignedToVisible
            ),
    };

    const toggleViewerBAligned = {
        handleButtonClick: () =>
            handleToggle(
                viewerB,
                'moleculeAligned',
                viewerB.setIsMoleculeAlignedVisible,
                viewerB.isMoleculeAlignedVisible
            ),
    };

    function createChainColorTheme(
        chainColorMap: Map<string, Color>) {
        const theme = (ctx: ThemeDataContext, props: {}) => ({
            granularity: 'group',
            color: (location: StructureElement.Location) => {
                console.log('Color function called for:', location);
                const { unit, element } = location;
                if (Unit.isAtomic(unit)) {
                    const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[element];
                    const asym_id: string = String(unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex));
                    return chainColorMap.get(asym_id) ?? Color(0xCCCCCC);
                }
                return Color(0xCCCCCC);
            },
            props: {},
            description: 'Colors chains according to a custom map.'
        });
    
        return {
            name: 'custom-chain-colors',
            label: 'Custom Chain Colors',
            category: ColorTheme.Category.Chain,
            factory: theme,
            getParams: () => ({}),
            defaultValues: {},
            isApplicable: () => true,
        };
    }
    
    // Update viewer colors based on loaded color data.
    async function updateDataAlignedToColors(colors: Array<Record<string, string>>) {
        console.log('Updating data aligned to colours:', colors);
        if (!viewerA.isMoleculeAlignedToLoaded) {
            console.warn('Viewer A data aligned to is not loaded. Cannot update colors.');
            return;
        }
        const pluginA = viewerA.ref.current;
        if (!pluginA) return;
        const pluginB = viewerB.ref.current;
        if (!pluginB) return;
        const viewerADataAlignedTo: Molecule | undefined = viewerA.moleculeAlignedTo;
        if (!viewerADataAlignedTo) {
            console.warn('No dataAlignedTo presetResult found.');
            return;
        }
        console.log('viewerADataAlignedTo:', viewerADataAlignedTo);
        const presetResultA: PresetResult = viewerADataAlignedTo.presetResult;
        if (!presetResultA) {
            console.warn('No presetResult found in dataAlignedTo.');
            return;
        }
        console.log('presetResultA:', presetResultA);
        // Object { model: {…}, modelProperties: {…}, unitcell: undefined, structure: {…}, structureProperties: {…}, representation: {…} }
        const model = (presetResultA as { model: any }).model;
        if (!model) {
            console.warn('No model found in presetResult.');
            return;
        }
        console.log('model:', model);
        const modelProperties = (presetResultA as { modelProperties: any }).modelProperties;
        if (!modelProperties) {
            console.warn('No modelProperties found in presetResult.');
            return;
        }
        console.log('modelProperties:', modelProperties);
        const structure = (presetResultA as { structure: any }).structure;
        if (!structure) {
            console.warn('No structure found in presetResult.');
            return;
        }
        console.log('structure:', structure);
        const structureProperties = (presetResultA as { structureProperties: any }).structureProperties;
        if (!structureProperties) {
            console.warn('No structureProperties found in presetResult.');
            return;
        }
        console.log('structureProperties:', structureProperties);
        // Get the representation.
        const representation = (presetResultA as { representation: any }).representation;
        if (!representation) {
            console.warn('No representation found in presetResult.');
            return;
        }
        console.log('representation:', representation);
        const components = representation.components;
        console.log('components:', components);
        const representations = representation.representations;
        console.log('representations:', representations);
        const polymer = representations.polymer;
        if (!polymer) {
            console.warn('No polymer representation found.');
            return;
        }
        console.log('polymer representation:', polymer);
        const ref = polymer.ref;
        if (!ref) {
            console.warn('No ref found in polymer representation.');
            return;
        }
        console.log('polymer ref:', ref);
        const state = polymer.state;
        if (!state) {
            console.warn('No state found in polymer representation.');
            return;
        }
        console.log('polymer state:', state);
        const reprCell = polymer.state.cells.get(ref);
        if (!reprCell) {
            console.warn('No representation cell found for ref:', ref);
            return;
        }
        console.log('Representation cell:', reprCell);
        const params = reprCell.transform.params;
        if (!params) {
            console.warn('No params found in representation cell.');
            return;
        }
        console.log('Representation params:', params);
        const colorTheme = params.colorTheme;
        if (!colorTheme) {
            console.warn('No colorTheme found in representation params.');
            return;
        }
        console.log('Current colorTheme:', colorTheme);
        // Create new colorTheme.
        const colorMap = new Map<string, string>();
        let data: Data[] = colors.map(row => ({
            pdb_chain: row['pdb_chain'],
            color: row['color']
        }));
        data.forEach(x => colorMap.set(x.pdb_chain, x.color));
        const colorList = Array.from(colorMap.entries())
            .map(([asym_id, color]) => {
                const colorObj = Color.fromHexStyle(color);
                if (!colorObj) {
                    console.warn(`Invalid color for asym_id ${asym_id}: ${color}`);
                    return null;
                }
                return { asym_id, color: colorObj };
            })
            .filter((item): item is { asym_id: string, color: Color } => item !== null);
        console.log('colorList:', colorList);
        // Get an array of colors for the new color theme.
        const colorsArray = colorList.map(item => item.color);
        const newColorTheme = {
            name: 'chain-id',
            params: {
                asymId: 'auth',
                palette: {
                    name: 'colors',
                    params: {
                        colors: colorsArray,
                    }
                }
            }
        };
        console.log('Updated colorTheme:', newColorTheme);

        // Update the representation using the plugin state API
        const builders = pluginA.builders;
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
        const stateA = pluginA.state.data;
        console.log('pluginA.state.data:', stateA);
        const root = pluginA.state.data.root;
        if (!root) {
            console.warn('No root found in plugin state data.');
            return;
        }
        console.log('pluginA.state.data.root:', root);
        const structureCell = pluginA.managers.structure.hierarchy.current.structures[0]?.cell;
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
        //const structureRefObj = { ref: structureCell.transform.ref }; // Wrap the ref string

        const builder = pluginA.state.data.build(); // Get the Root (builder)

        const newrep = representationBuilder.buildRepresentation(
            builder,
            structureRef,
            // structureCell,
            // structureRefObj,
            {
                type: 'spacefill',
                colorTheme: newColorTheme
            }
        );
        console.log('Built new representation:', newrep);

        

        // Add to representations object.
        const repKey = 'spacefill'; // or use newrep.ref for uniqueness
        representations[repKey] = newrep;
        console.log('representations:', representations);

        // This sort of works, but the colorsTheme is still the default one.
        // // Add the new representation to the state.
        // await pluginA.state.data.build()
        //     .to(structureCell.transform.ref)
        //     .apply(
        //         StateTransforms.Representation.StructureRepresentation3D, // Transformer for structure representations
        //         {
        //             type: { name: 'spacefill', params: {} },
        //             colorTheme: newColorTheme
        //         }
        //     )
        //     .commit();

        // console.log('New representation added to state.');

        
        // Build chain color map
        const chainColorMap = new Map<string, Color>();
        colors.forEach(row => {
            if (row.pdb_chain && row.color) {
                try {
                    chainColorMap.set(row.pdb_chain, Color.fromHexStyle(row.color));
                } catch {
                    console.warn(`Invalid color: ${row.color}`);
                }
            }
        });
        console.log('chainColorMap:', chainColorMap);

        const managers = pluginA.managers;
        if (!managers) {
            console.warn('No managers found in plugin.');
            return;
        }
        console.log('managers:', managers);
        const colorThemeRegistry = pluginA.representation.structure.themes.colorThemeRegistry;
        if (!colorThemeRegistry) {
            console.warn('No colorThemeRegistry found in representation structure themes.');
            return;
        }
        console.log('ColorThemeRegistry:', colorThemeRegistry);

        // Register custom theme if not already registered
        if (colorThemeRegistry.get('custom-chain-colors')) {
            colorThemeRegistry.add(
                createChainColorTheme(chainColorMap) as any
            );
        }
        console.log('Registered custom-chain-colors theme.');

        const structureComponent = pluginA.managers.structure.hierarchy.current.structures[0]?.components[0];
        if (!structureComponent) {
            console.warn('No structure component found to update representation.');
            return;
        }
        console.log('structureComponent:', structureComponent);

        const reprs = structureComponent.representations;
        if (!reprs || reprs.length === 0) {
            console.warn('No representations found in structure component.');
            return;
        }
        console.log('Representations:', reprs);

        console.log('Applied color theme:', representation.cell?.params?.values?.colorTheme);

        // Add the new representation to the state.
        await pluginA.state.data.build()
            .to(structureCell.transform.ref)
            .apply(
                StateTransforms.Representation.StructureRepresentation3D, // Transformer for structure representations
                {
                    type: { name: 'spacefill', params: {} },
                    colorTheme: { name: 'custom-chain-colors', params: {} }
                }
            )
            .commit();

        console.log('New representation added to state.');


        // Request redraw with new colors.
        if (pluginA.canvas3d) {
            pluginA.canvas3d.requestDraw?.();
        }
        if (pluginB.canvas3d) {
            pluginB.canvas3d.requestDraw?.();
        }
    }

    // Effect to update colors in viewerA when colorsAFile changes.
    useEffect(() => {
        if (colorsAlignedToFile.data && colorsAlignedToFile.data.length > 0) {
            updateDataAlignedToColors(colorsAlignedToFile.data);
        }
    }, [colorsAlignedToFile.data]);

    function createSelectAndZoomAligned(sourceViewer: React.RefObject<any>, targetViewer: React.RefObject<any>, label: string) {
        return {
            handleButtonClick: async () => {
                const pluginSource = sourceViewer.current;
                if (!pluginSource) return;
                const pluginTarget = targetViewer.current;
                if (!pluginTarget) return;

                const structures = pluginSource.managers.structure.hierarchy.current.structures;
                if (structures.length === 0) {
                    console.warn(`No structures found in viewer ${label}.`);
                    return;
                }
                console.log(`Structures in viewer ${label}:`, structures);

                console.log(`Number of structures:` + structures.length);
                //const structureObj = structures[0];
                const structureObj = structures[structures.length - 1];
                const structure = structureObj.cell.obj?.data;
                if (!structure) {
                    console.warn(`No structure found in viewer ${label}.`);
                    return;
                }
                // Select chain 'A', residues 10-20 (fallback if inRange/inSet are not available)
                const residueNumbers = [];
                for (let i = 10; i <= 20; i++) residueNumbers.push(i);

                const qb = MolScriptBuilder.struct.generator.atomGroups({
                    'chain-test': MolScriptBuilder.core.rel.eq([
                        MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id(),
                        'A'
                    ])
                    //'chain-test': MolScriptBuilder.core.set.has([
                    //    MolScriptBuilder.to(['A', 'B', 'C']),
                    //    MolScriptBuilder.struct.atomProperty.macromolecular.auth_asym_id()
                    //])
                });
                const compiled = compile(qb);
                const ctx = new QueryContext(structure);
                const selection = compiled(ctx);
                const loci = StructureSelection.toLociWithSourceUnits(selection);

                pluginSource.managers.camera.focusLoci(loci);
                pluginTarget.managers.camera.focusLoci(loci);
            }
        };
    }
    const selectAndZoomAlignedA = createSelectAndZoomAligned(viewerA.ref, viewerB.ref, 'A');
    const selectAndZoomAlignedB = createSelectAndZoomAligned(viewerB.ref, viewerA.ref, 'B');



    return (

        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.4.0</h1>
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
                                onClick={selectAndZoomAlignedA.handleButtonClick}
                                disabled={!viewerB.isMoleculeAlignedLoaded}
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
                                onClick={selectAndZoomAlignedB.handleButtonClick}
                                disabled={!viewerB.isMoleculeAlignedLoaded}
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