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
import TwoColumnsContainer from './TwoColumnsContainer';


describe('TwoColumnsContainer', () => {
  it('renders left and right children in the container', () => {
    const { getByText, container } = render(
      <TwoColumnsContainer
        left={<div>Left Side</div>}
        right={<div>Right Side</div>}
      />
    );
    expect(getByText('Left Side')).toBeInTheDocument();
    expect(getByText('Right Side')).toBeInTheDocument();
    expect(container.querySelector('.Two-Columns-Container')).toBeTruthy();
  });
});
