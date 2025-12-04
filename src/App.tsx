import React, { useMemo, useState, useRef } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import { loadMoleculeToViewer } from './utils/data';
import { loadMoleculeFileToViewer } from 'molstar/lib/extensions/ribocode/utils/structure';
import './App.css';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra';
import { Asset } from 'molstar/lib/mol-util/assets';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
//import { Viewer } from 'molstar/lib/apps/viewer';

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

    // Memoize axis alignment matrix
    const axisAlignmentMatrix = useMemo(() => {
        const m = Mat4.identity();
        Mat4.setValue(m, 0, 0, 1);
        Mat4.setValue(m, 0, 1, 0);
        Mat4.setValue(m, 0, 2, 0);
        Mat4.setValue(m, 0, 3, 0);
        Mat4.setValue(m, 1, 0, 0);
        Mat4.setValue(m, 1, 1, 0);
        Mat4.setValue(m, 1, 2, -1);
        Mat4.setValue(m, 1, 3, 0);
        Mat4.setValue(m, 2, 0, 0);
        Mat4.setValue(m, 2, 1, 1);
        Mat4.setValue(m, 2, 2, 0);
        Mat4.setValue(m, 2, 3, 0);
        Mat4.setValue(m, 3, 0, 0);
        Mat4.setValue(m, 3, 1, 0);
        Mat4.setValue(m, 3, 2, 0);
        Mat4.setValue(m, 3, 3, 1);
        return m;
    }, []);

    const [selection, setSelection] = useState(null);

    // Stable keys
    const viewerAKey = 'A';
    const viewerBKey = 'B';

    const viewerARef = useRef<PluginUIContext>(null);
    const viewerBRef = useRef<PluginUIContext>(null);
    const [selectedFile, setSelectedFile] = useState<Asset.File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const assetFile = Asset.File(new File([file], file.name));
            setSelectedFile(assetFile);
        } else {
            setSelectedFile(null);
        }
    };

    const [alignment, setAlignment] = useState<any>(null);

    const handleLoadDataA = async () => {
        if (!selectedFile) {
            console.error('No file selected.');
            return;
        }
        if (!viewerARef.current || !viewerBRef.current) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            const result = await loadMoleculeFileToViewer(viewerARef.current, selectedFile, true);
            if (result?.alignmentData) {
                setAlignment(result.alignmentData); // Store alignment for later use
            }
            //await loadMoleculeFileToViewer(viewerARef.current, selectedFile, false);
            await loadMoleculeFileToViewer(viewerBRef.current, selectedFile, true);
            //await loadMoleculeFileToViewer(viewerBRef.current, selectedFile, false);
            // After loading, hide all representations in viewer B
            await toggleViewerVisibility(viewerBRef);
        } catch (err) {
            console.error('Error loading molecule:', err);
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
        if (!selectedFile) {
            console.error('No file selected.');
            return;
        }
        if (!viewerARef.current || !viewerBRef.current) {
            console.error('One or both viewers are not initialized.');
            return;
        }
        try {
            await toggleViewerVisibility(viewerARef);
            await loadMoleculeFileToViewer(viewerARef.current, selectedFile, true, alignment);
            await toggleViewerVisibility(viewerARef);
            await loadMoleculeFileToViewer(viewerBRef.current, selectedFile, true, alignment);
        } catch (err) {
            console.error('Error loading molecule:', err);
        }
    };

    return (
        <SyncProvider>
            <div className="App">
                <h1>RiboCode Mol* Viewer 0.3.1</h1>
                <div className="load-data-row">
                    <input type="file" accept=".cif,.mmcif" onChange={handleFileChange} />
                    <button onClick={handleLoadDataA} disabled={!selectedFile || !viewerAReady || !viewerBReady}>
                        Load Data A
                    </button>
                </div>
                <div className="load-data-row">
                    <input type="file" accept=".cif,.mmcif" onChange={handleFileChange} />
                    <button onClick={handleLoadDataB} disabled={!selectedFile || !viewerAReady || !viewerBReady}>
                        Load Data B
                    </button>
                </div>
                <SyncButton
                    viewerA={viewerA}
                    viewerB={viewerB}
                    axisAlignmentMatrix={axisAlignmentMatrix}
                    activeViewer={activeViewer}
                />
                <div className="grid-container">
                    <MolstarContainer
                        //moleculeId="6XU8"
                        //moleculeUrl='https://files.rcsb.org/download/6XU8.cif'
                        viewerKey={viewerAKey}
                        onSelectionChange={setSelection}
                        externalSelection={selection}
                        setViewer={setViewerAWrapper}
                        onMouseDown={() => setActiveViewer(viewerAKey)}
                        onLoadMolecule={(molecule) => handleLoadMolecule(molecule, viewerAKey)}
                        onReady={() => setViewerAReady(true)}
                    />
                    <MolstarContainer
                        //moleculeId="4UG0"
                        //moleculeUrl='https://files.rcsb.org/download/4UG0.cif'
                        viewerKey={viewerBKey}
                        onSelectionChange={setSelection}
                        externalSelection={selection}
                        setViewer={setViewerBWrapper}
                        onMouseDown={() => setActiveViewer(viewerBKey)}
                        onLoadMolecule={(molecule) => handleLoadMolecule(molecule, viewerBKey)}
                        onReady={() => setViewerBReady(true)}
                    />
                </div>
            </div>
        </SyncProvider>
    );
};

export default App;