/**
 * AppHeader component for Ribocode Mol* Viewer.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import React from 'react';
import './AppHeader.css';

const AppHeader: React.FC = () => (
  <header className="app-header">
    <h1 className="app-title">RiboCode Mol* Viewer 0.7.1 (<a href="https://github.com/ribocode-slola/ribocode1/?tab=readme-ov-file#ribocode" target="_blank">README</a>)</h1>
  </header>
);

export default AppHeader;
