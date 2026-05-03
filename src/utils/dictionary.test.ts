/**
 * Test suite for parseDictionaryFileContent utility.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { parseDictionaryFileContent } from './dictionary';

describe('parseDictionaryFileContent', () => {
    it('parses a simple CSV string into records', async () => {
        const csv = 'name,age\nAlice,30\nBob,25';
        const result = await parseDictionaryFileContent(csv);
        expect(result).toEqual([
            { name: 'Alice', age: '30' },
            { name: 'Bob', age: '25' }
        ]);
    });

    it('handles extra whitespace and empty lines', async () => {
        const csv = 'id,value\n1,foo\n2,bar\n\n';
        const result = await parseDictionaryFileContent(csv);
        expect(result).toEqual([
            { id: '1', value: 'foo' },
            { id: '2', value: 'bar' }
        ]);
    });

    it('returns empty array for header only', async () => {
        const csv = 'col1,col2';
        const result = await parseDictionaryFileContent(csv);
        expect(result).toEqual([]);
    });

    it('handles missing values as undefined', async () => {
        const csv = 'a,b,c\n1,2';
        const result = await parseDictionaryFileContent(csv);
        expect(result).toEqual([
            { a: '1', b: '2', c: undefined } // c is missing
        ]);
    });
});
