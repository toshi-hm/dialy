import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders selected icon with accessible label', () => {
    render(<Icon name="calendar" label="カレンダー" />);

    expect(screen.getByRole('img', { name: 'カレンダー' })).toBeInTheDocument();
  });

  it('applies custom size', () => {
    render(<Icon name="check" label="保存完了" size={20} />);

    const icon = screen.getByRole('img', { name: '保存完了' });
    expect(icon).toHaveAttribute('width', '20');
    expect(icon).toHaveAttribute('height', '20');
  });

  it('supports color className', () => {
    render(<Icon name="alert" label="エラー" className="text-red-600" />);

    expect(screen.getByRole('img', { name: 'エラー' })).toHaveClass('text-red-600');
  });
});
