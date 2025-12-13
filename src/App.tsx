import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import { parseColorFileContent } from './utils/colors';
import { parseDictionaryFileContent } from './utils/dictionary';
import { toggleViewerVisibility, ViewerKey, ViewerState } from './RibocodeViewer';
//import { loadMoleculeToViewer } from './utils/data';
import './App.css';
import { loadMoleculeFileToViewer } from 'molstar/lib/extensions/ribocode/structure';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
//import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
//import { ObjectListControl } from 'molstar/lib/mol-plugin-ui/controls/parameters';

const App: React.FC = () => {
    console.log('App rendered');

    // Viewer state management
    // -----------------------
    
    const [activeViewer, setActiveViewer] = useState<ViewerKey>('A');

    // Custom hook to manage viewer state.
    function useViewerState(viewerKey: ViewerKey): ViewerState {
        const [dataToAlignTo, setDataToAlignTo] = useState<{ name?: string; filename?: string } | null>(null);
        const [dataAligned, setDataAligned] = useState<{ name?: string; filename?: string } | null>(null);
        const [isDataToAlignToLoaded, setIsDataToAlignToLoaded] = useState(false);
        const [isDataAlignedLoaded, setIsDataAlignedLoaded] = useState(false);
        const ref = useRef<PluginUIContext>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const handleFileInputButtonClick = useCallback(() => fileInputRef.current?.click(), []);
        const setViewerRef = useCallback((viewer: PluginUIContext) => {
            ref.current = viewer;
        }, []);
        return { dataToAlignTo, setDataToAlignTo, dataAligned, setDataAligned, isDataToAlignToLoaded, setIsDataToAlignToLoaded, isDataAlignedLoaded, setIsDataAlignedLoaded, ref, fileInputRef, handleFileInputButtonClick, setViewerRef, viewerKey };
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
    const colorsAFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    const colorsBFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    
    // File change handler for viewerA.
    const handleFileChangeA = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!viewerA.ref.current || !viewerB.ref.current) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            const file = e.target.files?.[0];
            if (file) {
                const assetFile = Asset.File(new File([file], file.name));
                const viewerADataToAlignTo = await loadMoleculeFileToViewer(viewerA.ref.current, assetFile, true, true);
                if (viewerADataToAlignTo?.alignmentData) {
                    setAlignment(viewerADataToAlignTo.alignmentData); // Store alignment for later use
                }
                viewerA.setDataToAlignTo(prev => ({ ...prev, name: viewerADataToAlignTo?.name, presetResult: viewerADataToAlignTo || "Unknown" }));
                viewerA.setIsDataToAlignToLoaded(true);
                //await loadMoleculeFileToViewer(viewerA.ref.current, selectedFile, false);
                const viewerBDataToAlignTo = await loadMoleculeFileToViewer(viewerB.ref.current, assetFile, false, true);
                viewerB.setDataToAlignTo(prev => ({ ...prev, name: viewerBDataToAlignTo?.name, presetResult: viewerBDataToAlignTo || "Unknown" }));
                //await loadMoleculeFileToViewer(viewerB.ref.current, selectedFile, false);
                // After loading, hide all representations in viewerB
                await toggleViewerVisibility(viewerB.ref);
            }
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    }, [viewerA, viewerB]);

    // Alignment state.
    const [alignment, setAlignment] = useState<any>(null);

    // File change handler for viewerB.
    const handleFileChangeB = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!viewerA.ref.current || !viewerB.ref.current) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            const file = e.target.files?.[0];
            if (file) {
                const assetFile = Asset.File(new File([file], file.name));
                await toggleViewerVisibility(viewerA.ref);
                const viewerAMoleculeAligned = await loadMoleculeFileToViewer(viewerA.ref.current, assetFile, false, true, alignment);
                viewerA.setDataAligned(prev => ({ ...prev, name: viewerAMoleculeAligned?.name || "Unknown" }));
                viewerA.setIsDataAlignedLoaded(true);
                await toggleViewerVisibility(viewerA.ref);
                const viewerBMoleculeAligned = await loadMoleculeFileToViewer(viewerB.ref.current, assetFile, false, true, alignment);
                viewerB.setDataAligned(prev => ({ ...prev, name: viewerBMoleculeAligned?.name || "Unknown" }));
                viewerB.setIsDataAlignedLoaded(true);
            }                
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    }, [viewerA, viewerB, alignment]);

    // Update viewer colors based on loaded color data.
    async function updateViewerColors(colors: Array<Record<string, string>>) {
        console.log('Updating viewer colors with data:', colors);
        const plugin = viewerA.ref.current;
        if (!plugin) return;
    
        const managersStructure = plugin.managers.structure;
        const buildersData = plugin.builders.data;
        const buildersStructure = plugin.builders.structure;
        const representation = buildersStructure.representation;
        const stateData = plugin.state.data;
        const buildersHierarchy = buildersStructure.hierarchy;
        const models = managersStructure.hierarchy.current?.models || [];
        for (const model of models) {
            console.log('Processing model for color update:', model);
            const ref = model.cell.transform.ref;
            // Build a state update tree for the representation
            const update = plugin.state.data.build();
            update.to(ref).update(StateTransforms.Representation.StructureRepresentation3D, old => ({
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
    }

    // Effect to update colors in viewerA when colorsAFile changes.
    useEffect(() => {
        if (colorsAFile.data && colorsAFile.data.length > 0) {
            updateViewerColors(colorsAFile.data);
        }
    }, [colorsAFile.data]);

    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.3.11</h1>
                <div>
                    <button
                        onClick={dictionaryFile.handleButtonClick}
                        disabled={!viewerB.isDataAlignedLoaded}
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
                        disabled={!viewerB.isDataAlignedLoaded}
                    />
                </div>
                <div className="grid-container">
                    <div className="viewer-wrapper">
                        <div className="load-data-row">
                            <div className="viewer-title">
                                {viewerA.dataToAlignTo
                                    ? `${viewerA.dataToAlignTo.name || viewerA.dataToAlignTo.filename}`
                                    : ""}
                            </div>
                            {!viewerA.isDataToAlignToLoaded && (
                                <>
                                    <button
                                        onClick={viewerA.handleFileInputButtonClick}
                                        disabled={!viewerAReady || !viewerBReady}
                                    >
                                        Load molecule to align with
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
                                    onClick={colorsAFile.handleButtonClick}
                                    disabled={!viewerA.isDataToAlignToLoaded}
                                >
                                    Load Colours
                                </button>
                                <input
                                    type="file"
                                    accept=".csv,.tsv,.txt,.json"
                                    style={{ display: 'none' }}
                                    ref={colorsAFile.inputRef}
                                    onChange={colorsAFile.handleFileChange}
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
                                {viewerB.dataAligned
                                    ? `${viewerB.dataAligned.name || viewerB.dataAligned.filename}`
                                    : ""}
                            </div>
                            {!viewerB.isDataAlignedLoaded && (
                                <>
                                    <button
                                        onClick={viewerB.handleFileInputButtonClick}
                                        disabled={!viewerA.isDataToAlignToLoaded || !viewerAReady || !viewerBReady}
                                    >
                                        Load molecule to align
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
                                    onClick={colorsBFile.handleButtonClick}
                                    disabled={!viewerB.isDataAlignedLoaded}
                                >
                                    Load Colours
                                </button>
                                <input
                                    type="file"
                                    accept=".csv,.tsv,.txt,.json"
                                    style={{ display: 'none' }}
                                    ref={colorsBFile.inputRef}
                                    onChange={colorsBFile.handleFileChange}
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