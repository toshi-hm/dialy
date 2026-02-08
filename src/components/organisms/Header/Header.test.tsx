import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('renders app title', () => {
    render(<Header />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Dialy')).toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(<Header actions={<button type="button">設定</button>} />);

    expect(screen.getByRole('button', { name: '設定' })).toBeInTheDocument();
  });
});
