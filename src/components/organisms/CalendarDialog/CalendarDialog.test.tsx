import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarDialog } from './CalendarDialog';

describe('CalendarDialog', () => {
  it('renders when open', () => {
    render(
      <CalendarDialog
        open
        selectedDate={new Date('2026-02-08T00:00:00.000Z')}
        maxDate={new Date('2026-02-08T00:00:00.000Z')}
        onClose={() => {}}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByRole('dialog', { name: '日付を選択' })).toBeInTheDocument();
    expect(screen.getByLabelText('日付')).toHaveAttribute('max', '2026-02-08');
  });

  it('calls onSelect when selecting date', () => {
    const handleSelect = vi.fn();

    render(
      <CalendarDialog
        open
        selectedDate={new Date('2026-02-08T00:00:00.000Z')}
        maxDate={new Date('2026-02-08T00:00:00.000Z')}
        onClose={() => {}}
        onSelect={handleSelect}
      />,
    );

    fireEvent.change(screen.getByLabelText('日付'), { target: { value: '2026-02-07' } });
    fireEvent.click(screen.getByRole('button', { name: '適用' }));

    expect(handleSelect).toHaveBeenCalledWith(new Date('2026-02-07T00:00:00.000Z'));
  });
});
