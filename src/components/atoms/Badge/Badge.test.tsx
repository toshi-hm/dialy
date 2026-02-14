import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders badge content', () => {
    render(<Badge>100文字</Badge>);

    expect(screen.getByText('100文字')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Badge variant="success">保存済み</Badge>);

    expect(screen.getByText('保存済み')).toHaveClass('bg-green-100');
  });

  it('applies custom className', () => {
    render(<Badge className="uppercase">draft</Badge>);

    expect(screen.getByText('draft')).toHaveClass('uppercase');
  });
});
