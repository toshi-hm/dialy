import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays function execution by the specified time', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('hello');

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(499);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledWith('hello');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on subsequent calls', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('first');
    vi.advanceTimersByTime(300);

    debounced('second');
    vi.advanceTimersByTime(300);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(callback).toHaveBeenCalledWith('second');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancel prevents execution', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('hello');
    debounced.cancel();

    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('flush executes immediately with last arguments', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('hello');
    debounced.flush();

    expect(callback).toHaveBeenCalledWith('hello');
    expect(callback).toHaveBeenCalledTimes(1);

    // Should not fire again after timer expires
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('flush does nothing when there are no pending arguments', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced.flush();

    expect(callback).not.toHaveBeenCalled();
  });

  it('cancel after cancel is safe (no-op)', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('hello');
    debounced.cancel();
    debounced.cancel();

    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('can be called again after cancel', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced('first');
    debounced.cancel();

    debounced('second');
    vi.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledWith('second');
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
