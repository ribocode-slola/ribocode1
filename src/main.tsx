/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css'; // Ensure your CSS is imported here

// Render the main App component into the root element.
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);