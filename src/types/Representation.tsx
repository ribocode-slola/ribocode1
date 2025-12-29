/**
 * Representation types used in the Ribocode application.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */

// List of allowed representation types.
// export const allowedRepresentationTypes = [
//     "spacefill", "cartoon", "ball-and-stick", "gaussian-surface",
//     "molecular-surface", "putty", "point", "ellipsoid", "carbohydrate",
//     "backbone", "label", "plane", "gaussian-volume", "line", "orientation"
// ] as const;
export const allowedRepresentationTypes = [
    "spacefill", "cartoon", "gaussian-surface", "gaussian-volume", "line"
] as const;

// Type representing allowed representation types.
export type AllowedRepresentationType = typeof allowedRepresentationTypes[number];