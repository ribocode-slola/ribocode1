import React, { useState, useRef } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import { loadMoleculeToViewer } from './utils/data';
import { loadMoleculeFileToViewer } from 'molstar/lib/extensions/ribocode/structure';
import './App.css';
import { Asset } from 'molstar/lib/mol-util/assets';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';

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
    const [activeViewer, setActiveViewer] = useState<'A' | 'B'>('A');
    const [viewerA, setViewerA] = useState<PluginUIContext | null>(null);
    const [viewerB, setViewerB] = useState<PluginUIContext | null>(null);
    const setViewerAWrapper = (viewer: PluginUIContext | null) => {
        setViewerA(viewer); viewerARef.current = viewer;
    };
    const setViewerBWrapper = (viewer: PluginUIContext | null) => {
        setViewerB(viewer); viewerBRef.current = viewer;
    };
    const [viewerAReady, setViewerAReady] = useState(false);
    const [viewerBReady, setViewerBReady] = useState(false);

    const dictionaryFileInputRef = useRef<HTMLInputElement>(null);
    const [dictionary, setDictionary] = useState<Array<Record<string, string>>>([]);

    const handleLoadDictonaryButtonClick = () => {
        dictionaryFileInputRef.current?.click();
    };

    const handleDictionaryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            file.text().then(text => {
                const parsed = parseDelimitedData(text);
                setDictionary(parsed);
            });
        }
    };

    function handleLoadMolecule(
        molecule: { id: string; url: string },
        sourceViewerKey: 'A' | 'B'
    ) {
        if (sourceViewerKey === 'A' && viewerA) {
            loadMoleculeToViewer(viewerA, molecule);
        } else if (sourceViewerKey === 'B' && viewerB) {
            loadMoleculeToViewer(viewerB, molecule);
        }
    }

    const [selection, setSelection] = useState(null);

    // Stable keys
    const viewerAKey = 'A';
    const viewerBKey = 'B';

    const [viewerAData, setViewerAData] = useState<{ name?: string; filename?: string } | null>(null);
    const [viewerBData, setViewerBData] = useState<{ name?: string; filename?: string } | null>(null);

    const viewerARef = useRef<PluginUIContext>(null);
    const viewerBRef = useRef<PluginUIContext>(null);
    const [selectedFileA, setSelectedFileA] = useState<Asset.File | null>(null);
    const [selectedFileB, setSelectedFileB] = useState<Asset.File | null>(null);
    const [isLoadAButtonDisabled, setIsLoadAButtonDisabled] = useState(false);
    const [isLoadBButtonDisabled, setIsLoadBButtonDisabled] = useState(false);

    const handleFileChangeA = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsLoadAButtonDisabled(false);
        try {
            const file = e.target.files?.[0];
            if (file) {
                const assetFile = Asset.File(new File([file], file.name));
                setSelectedFileA(assetFile);
                setViewerAData({
                    ...viewerAData,
                    filename: file.name,
                    name: file.name
                });
            } else {
                setSelectedFileA(null);
            }
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    };

    const handleFileChangeB = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsLoadBButtonDisabled(false);
        try {
            const file = e.target.files?.[0];
            if (file) {
                const assetFile = Asset.File(new File([file], file.name));
                setSelectedFileB(assetFile);
                setViewerBData({
                    ...viewerBData,
                    filename: file.name,
                    name: file.name
                });
            } else {
                setSelectedFileB(null);
            }
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    };

    const [alignment, setAlignment] = useState<any>(null);

    const handleLoadDataA = async () => {
        if (!selectedFileA) {
            console.error('No file selected.');
            return;
        }
        if (!viewerARef.current || !viewerBRef.current) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            const result = await loadMoleculeFileToViewer(viewerARef.current, selectedFileA, true, true);
            if (result?.alignmentData) {
                setAlignment(result.alignmentData); // Store alignment for later use
            }
            //await loadMoleculeFileToViewer(viewerARef.current, selectedFile, false);
            await loadMoleculeFileToViewer(viewerBRef.current, selectedFileA, false, true);
            //await loadMoleculeFileToViewer(viewerBRef.current, selectedFile, false);
            // After loading, hide all representations in viewer B
            await toggleViewerVisibility(viewerBRef);
            setIsLoadAButtonDisabled(true);
            setViewerAData(prev => ({
                ...prev,
                name: result?.name || "Unknown"
            }));
        } catch (err) {
            console.error('Error loading molecule:', err);
            setIsLoadAButtonDisabled(false);
        }
    };

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

    const handleLoadDataB = async () => {
        if (!selectedFileB) {
            console.error('No file selected.');
            return;
        }
        if (!viewerARef.current || !viewerBRef.current) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            await toggleViewerVisibility(viewerARef);
            await loadMoleculeFileToViewer(viewerARef.current, selectedFileB, false, true, alignment);
            await toggleViewerVisibility(viewerARef);
            const result = await loadMoleculeFileToViewer(viewerBRef.current, selectedFileB, false, true, alignment);
            setIsLoadBButtonDisabled(true);
            setViewerBData(prev => ({
                ...prev,
                name: result?.name || "Unknown"
            }));
        } catch (err) {
            console.error('Error loading molecule:', err);
            setIsLoadBButtonDisabled(false);
        }
    };

    return (
        <SyncProvider>
            <div className="App">
                <h1 className="app-title">RiboCode Mol* Viewer 0.3.9</h1>
                <SyncButton
                    viewerA={viewerA}
                    viewerB={viewerB}
                    activeViewer={activeViewer}
                />
                <div className="grid-container">
                    <div className="viewer-wrapper">
                        <div className="load-data-row">
                            <input
                                type="file"
                                accept=".cif,.mmcif"
                                onChange={handleFileChangeA}
                                disabled={isLoadAButtonDisabled}
                            />
                            <button onClick={handleLoadDataA}
                                disabled={!selectedFileA || !viewerAReady || !viewerBReady || isLoadAButtonDisabled}>
                                Load Ribosome to align to
                            </button>
                        </div>
                        <div className="viewer-title">
                            {viewerAData
                                ? `${viewerAData.name || viewerAData.filename || "Loaded"}`
                                : "Molecule to align with"}
                        </div>
                        <div>
                            <button onClick={handleLoadDictonaryButtonClick}>Load Dictionary</button>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                style={{ display: 'none' }}
                                ref={dictionaryFileInputRef}
                                onChange={handleDictionaryFileChange}
                            />
                            {/* Render dictionary for demonstration */}
                            {/* <pre>{JSON.stringify(dictionary, null, 2)}</pre> */}
                        </div>
                        <MolstarContainer
                            viewerKey={viewerAKey}
                            onSelectionChange={setSelection}
                            externalSelection={selection}
                            setViewer={setViewerAWrapper}
                            onMouseDown={() => setActiveViewer(viewerAKey)}
                            onReady={() => setViewerAReady(true)}
                        />
                    </div>
                    <div className="viewer-wrapper">
                        <div className="load-data-row">
                            <input
                                type="file"
                                accept=".cif,.mmcif"
                                onChange={handleFileChangeB}
                                disabled={isLoadBButtonDisabled || !isLoadAButtonDisabled}
                            />
                            <button onClick={handleLoadDataB}
                                disabled={!selectedFileB || !viewerAReady || !viewerBReady || isLoadBButtonDisabled}>
                                Load Ribosome to align
                            </button>
                        </div>
                        <div className="viewer-title">
                            {viewerBData
                                ? `${viewerBData.name || viewerBData.filename || "Loaded"}`
                                : "Molecule aligned"}
                        </div>
                        <MolstarContainer
                            viewerKey={viewerBKey}
                            onSelectionChange={setSelection}
                            externalSelection={selection}
                            setViewer={setViewerBWrapper}
                            onMouseDown={() => setActiveViewer(viewerBKey)}
                            onReady={() => setViewerBReady(true)}
                        />
                    </div>
                </div>
            </div>
        </SyncProvider>
    );
};

export default App;