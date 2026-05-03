/**
 * Test suite for addRepresentationFromSession utility.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { describe, it, expect, vi } from 'vitest';
import { addRepresentationFromSession } from './addRepresentationFromSession';


// Mock the builder method before importing the function under test
const addRepresentationMock = vi.fn();
const mockPlugin = {
  state: {
    data: {
      tree: {
        children: new Map(),
      },
      cells: new Map(),
    },
  },
  builders: {
    structure: {
      representation: {
        addRepresentation: addRepresentationMock,
      },
    },
  },
};


function createMockPlugin() {
  const repRef = 'rep1';
  const compRef = 'comp1';
  const structureRef = 'struct1';
  const repCell = {
    obj: { type: { name: 'Representation3D' }, props: { colorTheme: 'theme' } },
    params: { values: { type: { name: 'cartoon' }, colorTheme: 'theme' } },
  };
  const compCell = { obj: { type: { name: 'Structure Component' } } };
  // Setup the mock plugin's state
  mockPlugin.state.data.tree.children = new Map([
    [structureRef, { toArray: () => [compRef] }],
    [compRef, { toArray: () => [repRef] }],
  ]);
  mockPlugin.state.data.cells = new Map([
    [structureRef, compCell],
    [compRef, compCell],
    [repRef, repCell],
  ]);
  return { plugin: mockPlugin, structureRef, repRef, repCell };
}

describe('addRepresentationFromSession', () => {
  it('calls addRepresentation with correct arguments', async () => {
    const { plugin, structureRef, repCell } = createMockPlugin();
    const rep = {
      type: repCell.obj.type.name,
      params: repCell.params,
      colorTheme: repCell.obj.props.colorTheme,
      repRef: 'rep1',
    };
    await addRepresentationFromSession(plugin, structureRef, rep);
    expect(addRepresentationMock).toHaveBeenCalledWith(
      structureRef,
      expect.objectContaining({
        type: 'cartoon',
        colorTheme: 'theme',
      })
    );
  });
});
