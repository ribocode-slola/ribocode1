/**
 * Test for minimal DOM manipulation, to verify that the testing environment allows basic DOM operations without errors.
 * This is a very basic test just to confirm that the testing environment is set up correctly for DOM manipulation.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Minimal DOM test', () => {
  it('renders a button with data-testid', () => {
    render(<button data-testid="test-btn">Test</button>);
    expect(screen.getByTestId('test-btn')).toBeInTheDocument();
  });
});
