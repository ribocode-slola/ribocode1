import React, { useMemo, useState } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { SyncProvider } from './SyncContext';
import SyncButton from './SyncButton';
import MolstarContainer from './MolstarContainer';
import './App.css';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra';

const App: React.FC = () => {
    console.log('App rendered');
    const [activeViewer, setActiveViewer] = useState<'A' | 'B'>('A');
    const [viewerA, setViewerA] = useState<PluginUIContext | null>(null);
    const [viewerB, setViewerB] = useState<PluginUIContext | null>(null);
    const [molecule, setMolecule] = useState({
        id: "6XU8",
        url: "https://files.rcsb.org/download/6XU8.cif"
      });

    function handleLoadMolecule(molecule: { id: string; url: string }) {
        setMolecule(molecule);
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
    const viewerKeyA = 'A';
    const viewerKeyB = 'B';

    return (
        <SyncProvider>
            <div className="App">
                <h1>RiboCode Mol* Viewer</h1>
                <SyncButton
                    viewerA={viewerA}
                    viewerB={viewerB}
                    axisAlignmentMatrix={axisAlignmentMatrix}
                    activeViewer={activeViewer}
                />
                <div className="grid-container">
                    <MolstarContainer
                        moleculeId="6XU8"
                        moleculeUrl='https://files.rcsb.org/download/6XU8.cif'
                        viewerKey={viewerKeyA}
                        onSelectionChange={setSelection}
                        externalSelection={selection}
                        setViewer={setViewerA}
                        onMouseDown={() => setActiveViewer(viewerKeyA)}
                        onLoadMolecule={handleLoadMolecule}
                    />
                    <MolstarContainer
                        moleculeId="4UG0"
                        moleculeUrl='https://files.rcsb.org/download/4UG0.cif'
                        viewerKey={viewerKeyB}
                        onSelectionChange={setSelection}
                        externalSelection={selection}
                        setViewer={setViewerB}
                        onMouseDown={() => setActiveViewer(viewerKeyB)}
                        onLoadMolecule={handleLoadMolecule}
                    />
                </div>
            </div>
        </SyncProvider>
    );
};

export default App;