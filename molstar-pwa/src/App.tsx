import React from 'react';
import MolstarContainer from './MolstarContainer';
import './App.css'; // Add custom styles here

const App: React.FC = () => {
    return (
        <div className="app-container">
            <header>
                <h1>Mol* Viewer PWA</h1>
            </header>
            <main className="grid-container">
                {/* Add multiple Molstar containers */}
                <MolstarContainer moleculeUrl="https://files.rcsb.org/download/1CRN.pdb" />
                <MolstarContainer moleculeUrl="https://files.rcsb.org/download/1BNA.pdb" />
                <MolstarContainer moleculeUrl="https://files.rcsb.org/download/4HHB.pdb" />
                <MolstarContainer moleculeUrl="https://files.rcsb.org/download/2PTC.pdb" />
            </main>
        </div>
    );
};

export default App;