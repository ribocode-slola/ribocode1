import React, { useState, useRef, useCallback } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import { toggleViewerVisibility } from './RibocodeViewer';
//import { loadMoleculeToViewer } from './utils/data';
import { loadMoleculeFileToViewer } from 'molstar/lib/extensions/ribocode/structure';
import './App.css';
import { Asset } from 'molstar/lib/mol-util/assets';
import { readFile, readJSONFile } from 'molstar/lib/extensions/ribocode/colors';
import { Data } from 'molstar/lib/extensions/ribocode/colors';
import { Color } from 'molstar/lib/mol-util/color';

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

function parseFileContent(content: string): Data[] {
    const lines = content.split('\n');
    const colorMap = new Map<string, string>();
    const data: Data[] = [];
    if (lines.length > 0) {
        const header = lines[0];
        console.log('Header:', header);
    }
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        const [pdb_name, RP_name, , colorStr] = line.split(' ');
        const [pdb_id, pdb_chain] = pdb_name.split('_');
        data.push({
            pdb_name,
            RP_name,
            //class: parseInt(classStr, 10),
            color: colorStr, // Can later be parsed using mol-util.color.color.Color.fromHexStyle(colorStr),
            pdb_id,
            pdb_chain
        });
    }
    data.forEach(x => {
        colorMap.set(x.pdb_chain, x.color);
    });
    const colorMapArray = Array.from(colorMap.entries()).map(([asym_id, color]) => ({
        asym_id,
        color: Color.fromHexStyle(color)
    }));
    console.log('colorMapArray:', colorMapArray);
    // Update the state with the new colors

    //this.props.onChange({ name: this.props.name, param: this.props.param, value: colorList });


    return data;
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
    const colorsAFile = useFileInput<Array<Record<string, string>>>(parseFileContent, []);
    const colorsBFile = useFileInput<Array<Record<string, string>>>(parseFileContent, []);
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