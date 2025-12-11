import React, { useState, useRef, useCallback } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
//import { loadMoleculeToViewer } from './utils/data';
import { loadMoleculeFileToViewer } from 'molstar/lib/extensions/ribocode/structure';
import './App.css';
import { Asset } from 'molstar/lib/mol-util/assets';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { readFile, readJSONFile } from 'molstar/lib/extensions/ribocode/colors';

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
    key: ViewerKey;
};
    
function parseDelimitedData(text: string): Array<Record<string, string>> {
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

const App: React.FC = () => {
    console.log('App rendered');

    // Viewer state management
    const [activeViewer, setActiveViewer] = useState<ViewerKey>('A');
    function useViewerState(key: ViewerKey): ViewerState {
        const [data, setData] = useState<{ name?: string; filename?: string } | null>(null);
        const [isLoaded, setIsLoaded] = useState(false);
        const ref = useRef<PluginUIContext>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const handleFileInputButtonClick = useCallback(() => fileInputRef.current?.click(), []);
        const setViewerRef = useCallback((viewer: PluginUIContext) => {
            ref.current = viewer;
        }, []);
        return { data, setData, isLoaded, setIsLoaded, ref, fileInputRef, handleFileInputButtonClick, setViewerRef, key };
    }
    const viewerA = useViewerState('A');
    const viewerB = useViewerState('B');
    const setViewerAWrapper = (viewer: PluginUIContext) => {
        viewerA.ref.current = viewer;
    };
    const setViewerBWrapper = (viewer: PluginUIContext) => {
        viewerB.ref.current = viewer;
    };
    const [viewerAReady, setViewerAReady] = useState(false);
    const [viewerBReady, setViewerBReady] = useState(false);
    
    // Generic file input hook.
    function useFileInput<T>(
        parseFn: (text: string) => T,
        initial: T
    ) {
        const [data, setData] = useState<T>(initial);
        const inputRef = useRef<HTMLInputElement>(null);
    
        const handleButtonClick = () => {
            inputRef.current?.click();
        };
    
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                file.text().then(text => {
                    const parsed = parseFn(text);
                    setData(parsed);
                    console.log('data:', parsed);
                });
            }
        };
        return { data, setData, inputRef, handleButtonClick, handleFileChange };
    }
    const dictionaryFile = useFileInput<Array<Record<string, string>>>(parseDelimitedData, []);
    const colorsAFile = useFileInput<Array<Record<string, string>>>(parseDelimitedData, []);
    const colorsBFile = useFileInput<Array<Record<string, string>>>(parseDelimitedData, []);
    const handleFileChangeA = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    const handleFileChangeB = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    const [alignment, setAlignment] = useState<any>(null);

    async function toggleViewerVisibility(viewerRef: React.RefObject<any>) {
        const models = viewerRef.current.managers.structure.hierarchy.current?.models ?? [];
        const state = viewerRef.current.state.data;
        for (const model of models) {
            const ref = model.cell.transform.ref;
            await PluginCommands.State.ToggleVisibility.apply(
                viewerRef.current,
                [viewerRef.current, { state, ref }]
            );
        }
    }

    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.3.9</h1>
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
                            key={viewerA.key}
                            setViewer={setViewerAWrapper}
                            onMouseDown={() => setActiveViewer(viewerA.key)}
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
                            key={viewerB.key}
                            setViewer={setViewerBWrapper}
                            onMouseDown={() => setActiveViewer(viewerB.key)}
                            onReady={() => setViewerBReady(true)}
                        />
                    </div>
                </div>
            </div>
        </SyncProvider>
    );
};

export default App;