import { Data, readFile, readJSONFile } from 'molstar/lib/extensions/ribocode/colors';
import { Color } from 'molstar/lib/mol-util/color';
import { Unit, StructureElement } from 'molstar/lib/mol-model/structure';
import { ThemeDataContext } from 'molstar/lib/mol-theme/theme';
//import { ColorType } from 'molstar/lib/mol-geo/geometry/color-data';
import { ColorTheme } from 'molstar/lib/mol-theme/color';

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