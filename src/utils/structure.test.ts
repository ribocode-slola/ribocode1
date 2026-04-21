/**
 * Test suite for getStructureRepresentations utility.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */

import { describe, it, expect, vi } from 'vitest';
import { getStructureRepresentations } from './structure';

describe('getStructureRepresentations', () => {
  it('returns an empty array if no children', () => {
    const plugin = {
      state: {
        data: {
          tree: { children: new Map([["ref1", { toArray: () => [] }]]) },
          cells: new Map(),
        },
      },
    };
    const result = getStructureRepresentations(plugin, 'ref1');
    expect(result).toEqual([]);
  });

  it('returns Representation3D info for structure', () => {
    const repRef = 'rep1';
    const compRef = 'comp1';
    const structureRef = 'struct1';
    const repCell = {
      obj: { type: { name: 'Representation3D' }, props: { colorTheme: 'theme' } },
      params: { values: { type: { name: 'cartoon' } } },
    };
    const compCell = { obj: { type: { name: 'Structure Component' } } };
    const plugin = {
      state: {
        data: {
          tree: {
            children: new Map([
              [structureRef, { toArray: () => [compRef] }],
              [compRef, { toArray: () => [repRef] }],
            ]),
          },
          cells: new Map([
            [compRef, compCell],
            [repRef, repCell],
          ]),
        },
      },
    };
    const result = getStructureRepresentations(plugin, structureRef);
    expect(result).toEqual([
      {
        type: 'Representation3D',
        params: repCell.params,
        colorTheme: 'theme',
        repRef: repRef,
      },
    ]);
  });
});
