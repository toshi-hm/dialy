import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from './Text';

describe('Text', () => {
  it('renders paragraph by default', () => {
    render(<Text>body</Text>);

    const element = screen.getByText('body');
    expect(element.tagName).toBe('P');
  });

  it('renders custom element via as prop', () => {
    render(<Text as="span">label</Text>);

    const element = screen.getByText('label');
    expect(element.tagName).toBe('SPAN');
  });

  it('applies tone and size classes', () => {
    render(
      <Text tone="muted" size="sm">
        muted
      </Text>,
    );

    const element = screen.getByText('muted');
    expect(element).toHaveClass('text-gray-600');
    expect(element).toHaveClass('text-sm');
  });
});
