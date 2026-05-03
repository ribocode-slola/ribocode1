/**
 * Ribocode constants used across the application, including viewer keys and alignment states.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import type { ViewerKey, MoleculeMode } from '../types/ribocode';

/**
 * Viewer keys for the two molecule viewers.
 */
export const A: ViewerKey = 'A';
export const B: ViewerKey = 'B';

/**
 * Molecule loading modes.
 */
export const AlignedTo: MoleculeMode = 'AlignedTo';
export const Aligned: MoleculeMode = 'Aligned';
export const ReAligned: MoleculeMode = 'ReAligned';

/**
 * Alignment target atom types.
 * Currently includes Phosphorus (P) and Carbon (C) atoms, which are commonly used for nucleic acid and protein structures, respectively.
 * This allows for more comprehensive alignment of molecular structures in the viewer.
 */
export const selectedAtomTypes: { [key: string]: boolean } = { 'P': true, 'C': true };