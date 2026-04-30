/**
 * Test suite for TwoColumnsContainer component.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TwoColumnsContainer, { idSuffix as twoColumnsContainerIdSuffix } from './TwoColumnsContainer';


describe('TwoColumnsContainer', () => {
  it('renders left and right children in the container', () => {
    const { container } = render(
      <TwoColumnsContainer
        left={<div id="left-side">Left Side</div>}
        right={<div id="right-side">Right Side</div>}
      />
    );
    expect(document.getElementById('left-side')).toBeInTheDocument();
    expect(document.getElementById('right-side')).toBeInTheDocument();
    expect(container.querySelector('.Two-Columns-Container')).toBeTruthy();
  });

  it('applies idPrefix as id on the root div', () => {
    const { container } = render(
      <TwoColumnsContainer
        left={<div>Left</div>}
        right={<div>Right</div>}
        idPrefix="test-columns"
      />
    );
    const rootDiv = container.querySelector('.Two-Columns-Container');
    expect(rootDiv).toHaveAttribute('id', `test-columns-${twoColumnsContainerIdSuffix}`);
  });
});
