import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dial } from './Dial';

describe('Dial', () => {
  it('changes date by keyboard arrow', () => {
    const handleDateChange = vi.fn();
    render(
      <Dial
        selectedDate={new Date('2026-02-08T00:00:00.000Z')}
        onDateChange={handleDateChange}
        maxDate={new Date('2026-02-10T00:00:00.000Z')}
      />,
    );

    fireEvent.keyDown(screen.getByRole('slider', { name: '日付選択' }), { key: 'ArrowLeft' });

    expect(handleDateChange).toHaveBeenCalledTimes(1);
    const changedDate = handleDateChange.mock.calls[0][0] as Date;
    expect(changedDate.getFullYear()).toBe(2026);
    expect(changedDate.getMonth()).toBe(1);
    expect(changedDate.getDate()).toBe(7);
  });

  it('does not move to future date beyond maxDate', () => {
    const handleDateChange = vi.fn();
    const handleFutureAttempt = vi.fn();

    render(
      <Dial
        selectedDate={new Date('2026-02-08T00:00:00.000Z')}
        onDateChange={handleDateChange}
        maxDate={new Date('2026-02-08T00:00:00.000Z')}
        onFutureDateAttempt={handleFutureAttempt}
      />,
    );

    fireEvent.keyDown(screen.getByRole('slider', { name: '日付選択' }), { key: 'ArrowRight' });

    expect(handleDateChange).not.toHaveBeenCalled();
    expect(handleFutureAttempt).toHaveBeenCalledTimes(1);
  });
});
