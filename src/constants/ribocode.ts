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

export const A: ViewerKey = 'A';
export const B: ViewerKey = 'B';
export const AlignedTo: MoleculeMode = 'AlignedTo';
export const Aligned: MoleculeMode = 'Aligned';
export const ReAligned: MoleculeMode = 'ReAligned';
/**
 * Alignment target atom types.
 */
//export const selectedAtomTypes: { [key: string]: boolean } = { 'P': true };
export const selectedAtomTypes: { [key: string]: boolean } = { 'P': true, 'C': true };