import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateDisplay } from './DateDisplay';

describe('DateDisplay', () => {
  it('formats date with weekday in japanese', () => {
    render(<DateDisplay date={new Date('2026-02-08T00:00:00.000Z')} />);

    expect(screen.getByText('2月8日（日）')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<DateDisplay date={new Date('2026-02-08T00:00:00.000Z')} className="text-red-600" />);

    expect(screen.getByText('2月8日（日）')).toHaveClass('text-red-600');
  });
});
