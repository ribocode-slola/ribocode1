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
