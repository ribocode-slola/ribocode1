/**
 * Two columns container component for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React from 'react';

interface TwoColumnsContainerProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

const TwoColumnsContainer: React.FC<TwoColumnsContainerProps> = ({ left, right }) => (
  <div className="Two-Columns-Container">
    {left}
    {right}
  </div>
);

export default TwoColumnsContainer;
