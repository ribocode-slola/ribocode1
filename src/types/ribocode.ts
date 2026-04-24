/**
 * Types for Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { AlignmentData } from 'molstar/lib/extensions/ribocode/types';

export type ViewerKey = "A" | "B";
export type MoleculeMode = 'AlignedTo' | 'Aligned' | 'ReAligned';
export interface LoadedMolecule {
	alignmentData?: AlignmentData;
}
