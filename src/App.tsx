import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { ObjectListControl } from 'molstar/lib/mol-plugin-ui/controls/parameters';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import { toggleViewerVisibility } from './RibocodeViewer';
//import { loadMoleculeToViewer } from './utils/data';
import { loadMoleculeFileToViewer } from 'molstar/lib/extensions/ribocode/structure';
import './App.css';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Data, readFile, readJSONFile } from 'molstar/lib/extensions/ribocode/colors';
import { Color } from 'molstar/lib/mol-util/color';
import { StateTransforms } from 'packages/molstar/src/mol-plugin-state/transforms';

export type ViewerKey = "A" | "B";

type ViewerState = {
    data: { name?: string; filename?: string } | null;
    setData: React.Dispatch<React.SetStateAction<{ name?: string; filename?: string } | null>>;
    isLoaded: boolean;
    setIsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    ref: React.RefObject<PluginUIContext | null>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileInputButtonClick: () => void;
    setViewerRef: (viewer: PluginUIContext) => void;
    viewerKey: ViewerKey;
};

async function parseDictionaryFileContent(text: string): Promise<Array<Record<string, string>>> {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
            row[header] = values[i];
        });
        return row;
    });
}

async function parseColorFileContent(text: string, file: File): Promise<Data[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') {
        return await readJSONFile(file);
    } else {
        return await readFile(file);
    }
}

const App: React.FC = () => {
    console.log('App rendered');

    // Viewer state management
    const [activeViewer, setActiveViewer] = useState<ViewerKey>('A');
    function useViewerState(viewerKey: ViewerKey): ViewerState {
        const [data, setData] = useState<{ name?: string; filename?: string } | null>(null);
        const [isLoaded, setIsLoaded] = useState(false);
        const ref = useRef<PluginUIContext>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const handleFileInputButtonClick = useCallback(() => fileInputRef.current?.click(), []);
        const setViewerRef = useCallback((viewer: PluginUIContext) => {
            ref.current = viewer;
        }, []);
        return { data, setData, isLoaded, setIsLoaded, ref, fileInputRef, handleFileInputButtonClick, setViewerRef, viewerKey };
    }
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
        const [data, setData] = useState<T>(initialValue);
        const inputRef = useRef<HTMLInputElement>(null);

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
    const dictionaryFile = useFileInput<Array<Record<string, string>>>(parseDictionaryFileContent, []);
    const colorsAFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    const colorsBFile = useFileInput<Array<Record<string, string>>>(parseColorFileContent, []);
    //const colorsAFile = useFileInput<Array<Record<string, string>>>(parseDelimitedData, []);
    //const colorsBFile = useFileInput<Array<Record<string, string>>>(parseDelimitedData, []);
    const handleFileChangeA = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!viewerA.ref.current || !viewerB.ref.current) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            const file = e.target.files?.[0];
            if (file) {
                const assetFile = Asset.File(new File([file], file.name));
                const result = await loadMoleculeFileToViewer(viewerA.ref.current, assetFile, true, true);
                if (result?.alignmentData) {
                    setAlignment(result.alignmentData); // Store alignment for later use
                }
                //await loadMoleculeFileToViewer(viewerA.ref.current, selectedFile, false);
                await loadMoleculeFileToViewer(viewerB.ref.current, assetFile, false, true);
                //await loadMoleculeFileToViewer(viewerB.ref.current, selectedFile, false);
                // After loading, hide all representations in viewerB
                await toggleViewerVisibility(viewerB.ref);
                viewerA.setData(prev => ({ ...prev, name: result?.name || "Unknown" }));
                viewerA.setIsLoaded(true);
            }
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    }, [viewerA, viewerB]);

    const [alignment, setAlignment] = useState<any>(null);

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
                await loadMoleculeFileToViewer(viewerA.ref.current, assetFile, false, true, alignment);
                await toggleViewerVisibility(viewerA.ref);
                const result = await loadMoleculeFileToViewer(viewerB.ref.current, assetFile, false, true, alignment);
                viewerB.setData(prev => ({ ...prev, name: result?.name || "Unknown" }));
                viewerB.setIsLoaded(true);
            }
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    }, [viewerA, viewerB, alignment]);

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
            const ref = model.cell.transform.ref;
            // Build a state update tree for the representation
            const update = plugin.state.data.build();
            // update.to(ref).update(StateTransforms.Representation.StructureRepresentation3D, {
            //     colorTheme: {
            //         name: 'custom',
            //         params: {
            //             data: colors.map(colorEntry => ({
            //                 chainId: colorEntry['chain'] || '',
            //                 residueNumber: parseInt(colorEntry['residue_number'] || '0', 10),
            //                 color: Color.fromHexString(colorEntry['color'] || '#FFFFFF')
            //             }))
            //         }
            //     }
            // });

            // Apply the update
            await plugin.state.data.updateTree(update).run();
        }
    }

    useEffect(() => {
        if (colorsAFile.data && colorsAFile.data.length > 0) {
            updateViewerColors(colorsAFile.data);
        }
    }, [colorsAFile.data]);

    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.3.10</h1>
                <div>
                    <button
                        onClick={dictionaryFile.handleButtonClick}
                        disabled={!viewerB.isLoaded}
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
                        disabled={!viewerB.isLoaded}
                    />
                </div>
                <div className="grid-container">
                    <div className="viewer-wrapper">
                        <div className="load-data-row">
                            <div className="viewer-title">
                                {viewerA.data
                                    ? `${viewerA.data.name || viewerA.data.filename}`
                                    : ""}
                            </div>
                            {!viewerA.isLoaded && (
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
                                    disabled={!viewerA.isLoaded}
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
                                {viewerB.data
                                    ? `${viewerB.data.name || viewerB.data.filename}`
                                    : ""}
                            </div>
                            {!viewerB.isLoaded && (
                                <>
                                    <button
                                        onClick={viewerB.handleFileInputButtonClick}
                                        disabled={!viewerA.isLoaded || !viewerAReady || !viewerBReady}
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
                                    disabled={!viewerB.isLoaded}
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