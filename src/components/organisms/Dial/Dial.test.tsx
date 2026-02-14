import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dial } from './Dial';

describe('Dial', () => {
  it('changes date by keyboard arrow', () => {
    const handleDateChange = vi.fn();
    render(
      <Dial
        selectedDate={new Date(2026, 1, 8)}
        onDateChange={handleDateChange}
        maxDate={new Date(2026, 1, 10)}
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
        selectedDate={new Date(2026, 1, 8)}
        onDateChange={handleDateChange}
        maxDate={new Date(2026, 1, 8)}
        onFutureDateAttempt={handleFutureAttempt}
      />,
    );

    fireEvent.keyDown(screen.getByRole('slider', { name: '日付選択' }), { key: 'ArrowRight' });

    expect(handleDateChange).not.toHaveBeenCalled();
    expect(handleFutureAttempt).toHaveBeenCalledTimes(1);
  });

  it('moves multiple days when drag delta crosses multiple steps', () => {
    const handleDateChange = vi.fn();

    render(
      <Dial
        selectedDate={new Date(2026, 1, 8)}
        onDateChange={handleDateChange}
        maxDate={new Date(2026, 1, 20)}
      />,
    );

    const slider = screen.getByRole('slider', { name: '日付選択' });
    Object.defineProperty(slider, 'setPointerCapture', {
      value: vi.fn(),
      configurable: true,
    });
    vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(slider, {
      pointerId: 1,
      clientX: 100,
      clientY: 50,
    });
    fireEvent.pointerMove(slider, {
      pointerId: 1,
      clientX: 82,
      clientY: 88,
    });

    expect(handleDateChange).toHaveBeenCalledTimes(1);
    const changedDate = handleDateChange.mock.calls[0][0] as Date;
    expect(changedDate.getTime()).toBe(new Date(2026, 1, 10).getTime());
  });
});
