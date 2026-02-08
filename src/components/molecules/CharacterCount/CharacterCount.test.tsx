import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CharacterCount } from './CharacterCount';

describe('CharacterCount', () => {
  it('shows current and max length', () => {
    render(<CharacterCount content="hello" maxLength={10000} />);

    expect(screen.getByText('文字数: 5 / 10,000')).toBeInTheDocument();
  });

  it('shows warning state near limit', () => {
    render(<CharacterCount content={'a'.repeat(9900)} maxLength={10000} warningThreshold={0.99} />);

    expect(screen.getByText('文字数: 9,900 / 10,000')).toHaveClass('text-yellow-700');
  });

  it('shows error state when limit exceeded', () => {
    render(<CharacterCount content={'a'.repeat(10001)} maxLength={10000} />);

    expect(screen.getByText('文字数: 10,001 / 10,000')).toHaveClass('text-red-600');
    expect(screen.getByText('上限超過')).toBeInTheDocument();
  });
});
