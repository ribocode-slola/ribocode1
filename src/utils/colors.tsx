import { Data, readFile, readJSONFile } from 'molstar/lib/extensions/ribocode/colors';

export async function parseColorFileContent(text: string, file: File): Promise<Data[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') {
        return await readJSONFile(file);
    } else {
        return await readFile(file);
    }
}