
/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { Color } from 'molstar/lib/mol-util/color';
import { Unit, StructureElement } from 'molstar/lib/mol-model/structure';
import { ThemeDataContext } from 'molstar/lib/mol-theme/theme';
//import { ColorType } from 'molstar/lib/mol-geo/geometry/color-data';
import { ColorTheme } from 'molstar/lib/mol-theme/color';
import { ChainIdColorThemeParams } from 'molstar/lib/mol-theme/color/chain-id';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

// Define a type for the data structure
export type Data = Record<string, string>;

/**
 * Read a JSON file and return a promise that resolves to a Map object.
 * @param file A JSON file with the following format:
 * {pdb_chain: color} where:
 * pdb_chain is the name of the PDB chain (e.g. 4ug0_LY)
 * color is a hex color code (e.g. #FF0000)
 */
export async function readJSONFile(file: File): Promise<Data[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const data = JSON.parse(text);
                //let transformedData: SimpleData[];
                let transformedData: Data[];
                if (Array.isArray(data)) {
                    transformedData = data.map((item: any) => ({
                        pdb_chain: item.pdb_chain,
                        color: item.color
                    }));
                } else {
                    // Handle object format: { "4ug0_LY": "#FF0000", ... }
                    transformedData = Object.entries(data).map(
                        ([pdb_chain, color]) => ({
                            pdb_chain,
                            color: color as string
                        }));
                }
                resolve(transformedData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

/**
 * Reads a text file and return a promise that resolves to an array of Data objects.
 * @param file A space or tab separated text file with a header line and lines of 
 * data in the following format:
 * pdb_name RP_name class color
 * pdb_name contains the label of a molecule and identifier for a PDB chain separated
 * by "_" (e.g. 4ug0_LY)
 * RP_name is the name of the ribosomal protein (e.g. RPL26)
 * class is an integer representing the color class (e.g. 1) - this is ignored for now
 * color is a hex color code (e.g. #FF0000)
 */
export async function readFile(file: File): Promise<Data[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            console.log('Started parsing file:', file.name);
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const data: Data[] = [];
            if (lines.length > 0) {
                const header = lines[0];
                console.log('Filename:', file.name);
                console.log('Header:', header);
            }
            const numLines = lines.length;
            console.log('Total lines in file:', numLines);
            const nprint = Math.max(1, Math.floor(numLines / 4));
            for (let i = 1; i < numLines; i++) {
                const line = lines[i].trim();
                // if (i % nprint === 0) {
                //     console.log(`Parsing line ${i}: ${line}`);
                // }
                if (!line) continue;
                const parts = line.split(/\s+/);
                if (parts.length < 4) continue; // skip malformed lines
                const [pdb_name, RP_name, , colorStr] = parts;
                const [pdb_id, pdb_chain] = pdb_name.split('_');
                if (!pdb_id || !pdb_chain) continue; // skip malformed pdb_name
                data.push({
                    pdb_name,
                    RP_name,
                    color: colorStr,
                    pdb_id,
                    pdb_chain
                });
                if (i % nprint === 0) {
                    console.log(`Parsed line ${i}: pdb_name=${pdb_name}, RP_name=${RP_name}, color=${colorStr}, pdb_id=${pdb_id}, pdb_chain=${pdb_chain}`);
                }
            }
            console.log('Finished parsing file. Total entries:', data.length);
            resolve(data);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

/**
 * Save the given ChainIdColorThemeParams as a JSON file.
 * @param themeParams The ChainIdColorThemeParams to save.
 */
export function saveColorTheme(themeParams: ChainIdColorThemeParams) {
    const output = {
        params: themeParams
    };
    const jsonString = JSON.stringify(output, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color_theme.json';
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Load ChainIdColorThemeParams from a JSON file.
 * @param file The JSON file to load.
 * @return A promise that resolves to the ChainIdColorThemeParams.
 */
export function loadColorTheme(file: File): Promise<ChainIdColorThemeParams> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const json = JSON.parse(text);
            resolve(json.params);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

/**
 * Parses the content of a color file based on its extension.
 * @param text The content of the file as text.
 * @param file The file to be parsed.
 * @returns Promise resolving to an array of Data objects.
 */
export async function parseColorFileContent(text: string, file: File): Promise<Data[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') {
        return await readJSONFile(file);
    } else {
        return await readFile(file);
    }
}

// Module-level cache for named color themes
const colorThemeCache = new Map<string, any>();

/**
 * Creates or retrieves a named colorTheme from colors.
 * @param themeName Unique name for the color theme.
 * @param colors Array of objects with 'pdb_chain' and 'color' properties.
 * @returns A colorTheme object.
 */
export function getColourTheme(
    themeName: string,
    colors: Array<Record<string, string>>
) {
    if (colorThemeCache.has(themeName)) {
        return colorThemeCache.get(themeName);
    }

    const colorMap = new Map<string, string>();
    let data: Data[] = colors.map(row => ({
        pdb_chain: row['pdb_chain'],
        color: row['color']
    }));
    data.forEach(x => colorMap.set(x.pdb_chain, x.color));
    const colorList = Array.from(colorMap.entries())
        .map(([asym_id, color]) => {
            const colorObj = Color.fromHexStyle(color);
            if (!colorObj) {
                console.warn(`Invalid color for asym_id ${asym_id}: ${color}`);
                return null;
            }
            return { asym_id, color: colorObj };
        })
        .filter((item): item is { asym_id: string, color: Color } => item !== null);

    const colorsArray = colorList.map(item => item.color);
    const ct = {
        name: themeName,
        params: {
            asymId: 'auth',
            palette: {
                name: 'colors',
                params: {
                    colors: colorsArray,
                }
            }
        }
    };
    colorThemeCache.set(themeName, ct);
    return ct;
}

/**
 * Creates a custom chain color theme based on a provided color map.
 * @param chainColorMap A map where keys are chain identifiers and values are Color objects.
 * @returns A ColorTheme object that colors chains according to the provided map.
 */
export function createChainColorTheme(
    themeName: string,
    chainColorMap: Map<string, Color>) {
    const theme = (ctx: ThemeDataContext, props: {}) => ({
        granularity: 'group',
        color: (location: StructureElement.Location) => {
            //console.log('Color function called for:', location);
            const { unit, element } = location;
            if (Unit.isAtomic(unit)) {
                const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[element];
                const asym_id: string = String(unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex));
                return chainColorMap.get(asym_id) ?? Color(0xCCCCCC);
            }
            return Color(0xCCCCCC);
        },
        props: {},
        description: 'Colors chains according to a custom map.'
    });
    // Return the ColorTheme object
    return {
        name: themeName,
        label: themeName,
        category: ColorTheme.Category.Chain,
        factory: theme,
        getParams: () => ({}),
        defaultValues: {},
        isApplicable: () => true,
    };
}

/**
 * Registers a custom chain color theme if it is not already registered.
 * @param plugin The Mol* plugin instance.
 * @param themeName The name of the theme to register.
 * @param chainColorMaps A map of theme names to their corresponding chain color maps.
 * @returns A promise that resolves when the theme is registered.
 */
export function registerThemeIfNeeded(
    plugin: PluginUIContext,
    themeName: string,
    chainColorMaps: Map<string, Map<string, Color>>
) {
    if (!plugin) return;
    // Get color theme registry.
    const colorThemeRegistry = plugin.representation.structure.themes.colorThemeRegistry;
    if (!colorThemeRegistry) {
        console.warn('No colorThemeRegistry found in representation structure themes.');
        return;
    }
    console.log('ColorThemeRegistry:', colorThemeRegistry);
    // Remove the old theme if it exists.
    const existingTheme = colorThemeRegistry.get(themeName);
    if (existingTheme) {
        colorThemeRegistry.remove(existingTheme);
        console.log(`Removed old ${themeName} theme.`);
    }
    // Add the new theme.
    colorThemeRegistry.add(
        createChainColorTheme(themeName, chainColorMaps.get(themeName)!) as any
    );
    console.log(`Registered ${themeName} theme.`);
}