import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CalendarDialog } from './CalendarDialog';

describe('CalendarDialog', () => {
  it('renders when open', () => {
    render(
      <CalendarDialog
        open
        selectedDate={new Date(2026, 1, 8)}
        maxDate={new Date(2026, 1, 8)}
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
        selectedDate={new Date(2026, 1, 8)}
        maxDate={new Date(2026, 1, 8)}
        onClose={() => {}}
        onSelect={handleSelect}
      />,
    );

    fireEvent.change(screen.getByLabelText('日付'), { target: { value: '2026-02-07' } });
    fireEvent.click(screen.getByRole('button', { name: '適用' }));

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const selected = handleSelect.mock.calls[0][0] as Date;
    expect(selected.getTime()).toBe(new Date(2026, 1, 7).getTime());
  });

  it('disables apply button when date is empty', () => {
    const handleSelect = vi.fn();

    render(
      <CalendarDialog
        open
        selectedDate={new Date(2026, 1, 8)}
        maxDate={new Date(2026, 1, 8)}
        onClose={() => {}}
        onSelect={handleSelect}
      />,
    );

    fireEvent.change(screen.getByLabelText('日付'), { target: { value: '' } });
    const applyButton = screen.getByRole('button', { name: '適用' });

    expect(applyButton).toBeDisabled();
    fireEvent.click(applyButton);
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
