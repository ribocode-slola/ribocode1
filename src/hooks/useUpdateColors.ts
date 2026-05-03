/**
 * Custom hook to update colors and register a color theme for a Mol* structure.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { useEffect } from 'react';
import { registerThemeIfNeeded } from '../utils/colors';

/**
 * Custom hook to update colors and register a color theme for a Mol* structure.
 *
 * @param colorFileData - The color file data to process.
 * @param setIsColorsLoaded - Setter for the colors loaded state.
 * @param themeName - The name of the theme to register.
 * @param deps - Additional dependencies for the effect.
 */
export function useUpdateColors(
  plugin: any,
  colorFileData: Array<Record<string, string>>,
  setIsColorsLoaded: React.Dispatch<React.SetStateAction<boolean>>,
  themeName: string,
  chainColorMaps: Map<string, Map<string, any>>,
  deps: any[]
) {
  useEffect(() => {
    if (!colorFileData || colorFileData.length === 0 || !plugin) {
      setIsColorsLoaded(false);
      return;
    }
    try {
      // Build and set the chain color map before registering the theme
      const themeChainColorMap = new Map<string, any>();
      colorFileData.forEach(row => {
        if (row.pdb_chain && row.color) {
          try {
            themeChainColorMap.set(row.pdb_chain, row.color);
          } catch {
            console.warn(`Invalid color: ${row.color}`);
          }
        }
      });
      chainColorMaps.set(themeName, themeChainColorMap);
      registerThemeIfNeeded(plugin, themeName, chainColorMaps);
      setIsColorsLoaded(true);
      // eslint-disable-next-line no-console
      console.log(`[useUpdateColors] Registered theme: ${themeName}`);
    } catch (err) {
      setIsColorsLoaded(false);
      // eslint-disable-next-line no-console
      console.warn(`[useUpdateColors] Failed to register theme: ${themeName}`, err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugin, colorFileData, themeName, chainColorMaps, ...deps]);
}
