/**
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */

/**
 * Parses the content of a dictionary file in CSV format.
 * @param text The content of the dictionary file as a string.
 * @return A promise that resolves to an array of records, where each record represents a row in the CSV file.
 * Each record is an object with keys corresponding to the column headers.
 */
export async function parseDictionaryFileContent(text: string): Promise<Array<Record<string, string>>> {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
            row[header] = values[i];
        });
        return row;
    });
}