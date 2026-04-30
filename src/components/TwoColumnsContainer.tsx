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

/**
 * Suffix for the TwoColumnsContainer root id, used for consistent id construction in code and tests.
 */
export const idSuffix = 'container';

/**
 * Props for the TwoColumnsContainer component.
 */
interface TwoColumnsContainerProps {
  left: React.ReactNode;
  right: React.ReactNode;
  idPrefix?: string;
}

/**
 * A container component that displays two columns side by side.
 * @param left The content to display in the left column.
 * @param right The content to display in the right column.
 * @param idPrefix An optional prefix for the id of the root div.
 * @returns The TwoColumnsContainer component.
 */
const TwoColumnsContainer: React.FC<TwoColumnsContainerProps> = ({ left, right, idPrefix }) => (
  <div className="Two-Columns-Container" id={idPrefix ? `${idPrefix}-${idSuffix}` : idSuffix}>
    {left}
    {right}
  </div>
);

export default TwoColumnsContainer;
