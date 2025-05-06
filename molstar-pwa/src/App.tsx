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
                <MolstarContainer moleculeUrl="https://files.rcsb.org/download/1CRN.cif" />
                <MolstarContainer moleculeUrl="https://files.rcsb.org/download/1BNA.cif" />
                {/*<MolstarContainer moleculeUrl="https://files.rcsb.org/download/4HHB.pdb" />
                <MolstarContainer moleculeUrl="https://files.rcsb.org/download/1CRN.pdb" />*/}
            </main>
        </div>
    );
};

const styles = {
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', // Two columns
        //gridTemplateRows: '1fr 1fr', // Two rows
        gap: '10px', // Space between containers
        width: '100vw',
        height: '100vh',
    },
};

export default App;