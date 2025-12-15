import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import { parseColorFileContent } from './utils/colors';
import { parseDictionaryFileContent } from './utils/dictionary';
import { toggleViewerVisibility, ViewerKey, ViewerState } from './RibocodeViewer';
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

const App: React.FC = () => {
    console.log('App rendered');

    // Viewer state management
    // -----------------------
    
    const [activeViewer, setActiveViewer] = useState<ViewerKey>('A');

    // Custom hook to manage viewer state.
    function useViewerState(viewerKey: ViewerKey): ViewerState {
        const [moleculeAlignedTo, setMoleculeAlignedTo] = useState<Molecule | null>(null);
        const [moleculeAligned, setMoleculeAligned] = useState<Molecule | null>(null);
        const [isMoleculeAlignedToLoaded, setIsMoleculeAlignedToLoaded] = useState(false);
        const [isMoleculeAlignedLoaded, setIsMoleculeAlignedLoaded] = useState(false);
        const ref = useRef<PluginUIContext | null>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const handleFileInputButtonClick = useCallback(() => {
            fileInputRef.current?.click();
        }, []);
        const setViewerRef = useCallback((viewer: PluginUIContext) => {
            ref.current = viewer;
        }, []);
        return {
            moleculeAlignedTo: moleculeAlignedTo, setMoleculeAlignedTo: setMoleculeAlignedTo,
            moleculeAligned: moleculeAligned, setMoleculeAligned: setMoleculeAligned,
            isMoleculeAlignedToLoaded: isMoleculeAlignedToLoaded, setIsMoleculeAlignedToLoaded: setIsMoleculeAlignedToLoaded,
            isMoleculeAlignedLoaded: isMoleculeAlignedLoaded, setIsMoleculeAlignedLoaded: setIsMoleculeAlignedLoaded,
            ref, fileInputRef, handleFileInputButtonClick,
            setViewerRef, viewerKey
        };
    }

    // Initialize viewer states.
    const viewerA = useViewerState('A');
    const viewerB = useViewerState('B');
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
    
    // File change handler for viewerA.
    const handleFileChangeA = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const pluginA = viewerA.ref.current;
        const pluginB = viewerB.ref.current;
        if (!pluginA || !pluginB) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            const file = e.target.files?.[0];
            if (file) {
                const assetFile = Asset.File(new File([file], file.name));
                const viewerAMoleculeAlignedTo: Molecule | undefined = await loadMoleculeFileToViewer(
                    pluginA, assetFile, true, true);
                if (!viewerAMoleculeAlignedTo) {
                    console.error('Failed to load molecule into viewer A.');
                    return;
                }
                console.log('viewerAMoleculeAlignedTo:', viewerAMoleculeAlignedTo);
                
                // Find the viewerAMoleculeAlignedTo model in pluginA.
                const state = pluginA.state;
                // Get all models in the state.
                const models = state.data.selectQ(q => q.ofType(PluginStateObject.Molecule.Model));
                console.log('All models in pluginA state:', models);
                
                models.forEach(m => {
                    console.log('Model data:', m.obj?.data);
                });
                viewerA.setMoleculeAlignedTo(prev => ({
                    name: viewerAMoleculeAlignedTo.name,
                    filename: viewerAMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                    presetResult: viewerAMoleculeAlignedTo.presetResult ?? "Unknown",
                    alignmentData: viewerAMoleculeAlignedTo.alignmentData
                }));
                viewerA.setIsMoleculeAlignedToLoaded(true);
                //await loadMoleculeFileToViewer(viewerA.ref.current, selectedFile, false);
                const viewerBMoleculeAlignedTo = await loadMoleculeFileToViewer(
                    pluginB, assetFile, false, true);
                if (!viewerBMoleculeAlignedTo) {
                    console.error('Failed to load molecule into viewer B.');
                    return;
                }
                console.log('viewerBMoleculeAlignedTo:', viewerBMoleculeAlignedTo);
                if (!viewerBMoleculeAlignedTo) {
                    console.error('Failed to load molecule into viewer B.');
                    return;
                }
                viewerB.setMoleculeAlignedTo(prev => ({
                    name: viewerBMoleculeAlignedTo.name,
                    filename: viewerBMoleculeAlignedTo.filename ?? prev?.filename ?? "",
                    presetResult: viewerBMoleculeAlignedTo.presetResult ?? "Unknown",
                }));
                //await loadMoleculeFileToViewer(viewerB.ref.current, selectedFile, false);
                // After loading, hide all representations in viewerB
                await toggleViewerVisibility(viewerB.ref);
            }
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    }, [viewerA, viewerB]);

    // Alignment state.
    //const [alignment, setAlignment] = useState<any>(null);

    // File change handler for viewerB.
    const handleFileChangeB = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const pluginA = viewerA.ref.current;
        const pluginB = viewerB.ref.current;
        if (!pluginA || !pluginB) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            const file = e.target.files?.[0];
            if (file) {
                const assetFile = Asset.File(new File([file], file.name));
                await toggleViewerVisibility(viewerA.ref);
                const viewerAMoleculeAligned = await loadMoleculeFileToViewer(
                    pluginA, assetFile, false, true, viewerA.moleculeAlignedTo!.alignmentData);
                if (!viewerAMoleculeAligned) {
                    console.error('Failed to load molecule into viewer A.');
                    return;
                }
                console.log('viewerAMoleculeAligned:', viewerAMoleculeAligned);
                viewerA.setMoleculeAligned(prev => ({
                    name: viewerAMoleculeAligned.name,
                    filename: viewerAMoleculeAligned.filename ?? prev?.filename ?? "",
                    presetResult: viewerAMoleculeAligned.presetResult ?? "Unknown",
                }));
                viewerA.setIsMoleculeAlignedLoaded(true);
                await toggleViewerVisibility(viewerA.ref);
                const viewerBMoleculeAligned = await loadMoleculeFileToViewer(
                    pluginB, assetFile, false, true, viewerA.moleculeAlignedTo!.alignmentData);
                if (!viewerBMoleculeAligned) {
                    console.error('Failed to load molecule into viewer B.');
                    return;
                }
                console.log('viewerBMoleculeAligned:', viewerBMoleculeAligned);
                viewerB.setMoleculeAligned(prev => ({
                    name: viewerBMoleculeAligned.name,
                    filename: viewerBMoleculeAligned.filename ?? prev?.filename ?? "",
                    presetResult: viewerBMoleculeAligned.presetResult ?? "Unknown",
                }));
                viewerB.setIsMoleculeAlignedLoaded(true);
            }                
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    }, [viewerA, viewerB]);

    // Update viewer colors based on loaded color data.
    async function updateDataAlignedToColors(colors: Array<Record<string, string>>) {
        console.log('Updating data aligned to colours:', colors);
        if (!viewerA.isMoleculeAlignedToLoaded) {
            console.warn('Viewer A data aligned to is not loaded. Cannot update colors.');
            return;
        }
        const plugin = viewerA.ref.current;
        if (!plugin) return;
        const viewerADataAlignedTo: Molecule | null = viewerA.moleculeAlignedTo;
        if (!viewerADataAlignedTo) {
            console.warn('No dataAlignedTo presetResult found.');
            return;
        }
        console.log('viewerADataAlignedTo:', viewerADataAlignedTo);
        const presetResult: PresetResult = viewerADataAlignedTo.presetResult;
        if (!presetResult) {
            console.warn('No presetResult found in dataAlignedTo.');
            return;
        }
        console.log('presetResult:', presetResult);
        // Object { model: {…}, modelProperties: {…}, unitcell: undefined, structure: {…}, structureProperties: {…}, representation: {…} }
        const model = (presetResult as { model: any }).model;
        if (!model) {
            console.warn('No model found in presetResult.');
            return;
        }
        const modelProperties = (presetResult as { modelProperties: any }).modelProperties;
        if (!modelProperties) {
            console.warn('No modelProperties found in presetResult.');
            return;
        }
        const structure = (presetResult as { structure: any }).structure;
        if (!structure) {
            console.warn('No structure found in presetResult.');
            return;
        }
        const structureProperties = (presetResult as { structureProperties: any }).structureProperties;
        if (!structureProperties) {
            console.warn('No structureProperties found in presetResult.');
            return;
        }
        const representation = (presetResult as { representation: any }).representation;
        if (!representation) {
            console.warn('No representation found in presetResult.');
            return;
        }
        console.log('representation:', representation);
        const representations = representation.representations;
        console.log('representations:', representations);
        let targetRep = null;
        if (representations.assembly) {
            targetRep = representations.assembly;
            console.log('Using assembly representation for color update.');
        } else if (representations.polymer) {
            targetRep = representations.polymer;
            console.log('Using polymer representation for color update.');
        } else {
            console.warn('No assembly or polymer representation found.');
            return;
        }
        const state = targetRep.state;
        if (!state) {
            console.warn('No state found in target representation.');
            return;
        }
        // Update the colors in the representation
        console.log('Processing model for color update:', model);
        // const managersStructure = plugin.managers.structure;
        // const buildersData = plugin.builders.data;
        // const buildersStructure = plugin.builders.structure;
        // const representation = buildersStructure.representation;
        // const stateData = plugin.state.data;
        // const buildersHierarchy = buildersStructure.hierarchy;
        // const models = managersStructure.hierarchy.current?.models || [];
        console.log('Processing model for color update:', model);
        
        const ref = model.cell.transform.ref;

        // Build a state update tree for the representation
        const update = plugin.state.data.build();
        update.to(ref).update(StateTransforms.Representation.StructureRepresentation3D, (old : any) => ({
            ...old,
            colorTheme: {
                name: 'custom',
                params: {
                    data: colors.map(colorEntry => ({
                        chainId: colorEntry['chain'] || '',
                        residueNumber: parseInt(colorEntry['residue_number'] || '0', 10),
                        color: Color.fromHexString(colorEntry['color'] || '#FFFFFF')
                    }))
                }
            }
        }));

        // Apply the update
        console.log('Applying color update to model:', model);
        await plugin.state.data.updateTree(update).run();
    }

    // Effect to update colors in viewerA when colorsAFile changes.
    useEffect(() => {
        if (colorsAlignedToFile.data && colorsAlignedToFile.data.length > 0) {
            updateDataAlignedToColors(colorsAlignedToFile.data);
        }
    }, [colorsAlignedToFile.data]);

    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.3.11</h1>
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
                    <SyncButton
                        viewerA={viewerA.ref.current}
                        viewerB={viewerB.ref.current}
                        activeViewer={activeViewer}
                        disabled={!viewerB.isMoleculeAlignedLoaded}
                    />
                </div>
                <div className="grid-container">
                    <div className="viewer-wrapper">
                        <div className="load-data-row">
                            <div className="viewer-title">
                                {viewerA.moleculeAlignedTo
                                    ? `${viewerA.moleculeAlignedTo.name || viewerA.moleculeAlignedTo.filename}`
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
                                        onChange={handleFileChangeA}
                                    />
                                </>
                            )}
                        </div>
                        <div>
                            <>
                                <button
                                    onClick={colorsAlignedToFile.handleButtonClick}
                                    disabled={!viewerA.isMoleculeAlignedToLoaded}
                                >
                                    Load Aligned To Colours
                                </button>
                                <input
                                    type="file"
                                    accept=".csv,.tsv,.txt,.json"
                                    style={{ display: 'none' }}
                                    ref={colorsAlignedToFile.inputRef}
                                    onChange={colorsAlignedToFile.handleFileChange}
                                />
                            </>
                        </div>
                        <MolstarContainer
                            viewerKey={viewerA.viewerKey}
                            setViewer={setViewerAWrapper}
                            onMouseDown={() => setActiveViewer(viewerA.viewerKey)}
                            onReady={() => setViewerAReady(true)}
                        />
                    </div>
                    <div className="viewer-wrapper">
                        <div className="load-data-row">
                            <div className="viewer-title">
                                {viewerB.moleculeAligned
                                    ? `${viewerB.moleculeAligned.name || viewerB.moleculeAligned.filename}`
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
                                        onChange={handleFileChangeB}
                                    />
                                </>
                            )}
                        </div>
                        <div>
                            <>
                                <button
                                    onClick={colorsAlignedFile.handleButtonClick}
                                    disabled={!viewerB.isMoleculeAlignedLoaded}
                                >
                                    Load Aligned Colours
                                </button>
                                <input
                                    type="file"
                                    accept=".csv,.tsv,.txt,.json"
                                    style={{ display: 'none' }}
                                    ref={colorsAlignedFile.inputRef}
                                    onChange={colorsAlignedFile.handleFileChange}
                                />
                            </>
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