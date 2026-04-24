/**
 * Types for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { AlignmentData } from 'molstar/lib/extensions/ribocode/types';

export type ViewerKey = "A" | "B";
export type MoleculeMode = 'AlignedTo' | 'Aligned' | 'ReAligned';
export interface LoadedMolecule {
	alignmentData?: AlignmentData;
}
