/**
 * Test for ReactDOM rendering, to verify that the testing environment is set up correctly.
 * This is a very basic test just to confirm that React components can be rendered without errors.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { render, screen } from '@testing-library/react';

it('renders a button', () => {
  render(<button>Test</button>);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
