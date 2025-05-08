import React from 'react';
import MolstarContainer from './MolstarContainer';
import './App.css';

const App: React.FC = () => {
    return (
        <div className="app-container">
            <header>
                <h1>Mol* Viewer PWA</h1>
            </header>
            <main className="grid-container">
                {/* Add multiple Molstar containers */}
                {/*<MolstarContainer key="1CRN" moleculeUrl="https://files.rcsb.org/download/1CRN.cif" />
                <MolstarContainer key="1BNA" moleculeUrl="https://files.rcsb.org/download/1BNA.cif" />*/}
                <MolstarContainer key="4UG0" moleculeUrl="https://files.rcsb.org/download/4UG0.cif" />
                <MolstarContainer key="6XU8" moleculeUrl="https://files.rcsb.org/download/6XU8.cif" />
                {/**/}
            </main>
        </div>
    );
};

/*
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
*/

export default App;