import { describe, expect, it, vi } from 'vitest';
import {
  addDays,
  formatDateWithWeekday,
  isFutureDate,
  isSameDate,
  parseISODate,
  startOfDay,
  toISODate,
} from './date';

describe('startOfDay', () => {
  it('returns a date with time set to midnight', () => {
    const date = new Date(2026, 1, 8, 15, 30, 45);
    const result = startOfDay(date);

    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('preserves the date portion', () => {
    const date = new Date(2026, 1, 8, 23, 59, 59);
    const result = startOfDay(date);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(8);
  });
});

describe('isSameDate', () => {
  it('returns true for the same date with different times', () => {
    const left = new Date(2026, 1, 8, 10, 0, 0);
    const right = new Date(2026, 1, 8, 23, 59, 59);

    expect(isSameDate(left, right)).toBe(true);
  });

  it('returns false for different dates', () => {
    const left = new Date(2026, 1, 8);
    const right = new Date(2026, 1, 9);

    expect(isSameDate(left, right)).toBe(false);
  });

  it('returns false for same day different month', () => {
    const left = new Date(2026, 0, 8);
    const right = new Date(2026, 1, 8);

    expect(isSameDate(left, right)).toBe(false);
  });
});

describe('isFutureDate', () => {
  it('returns true when date is in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 8));

    expect(isFutureDate(new Date(2026, 1, 9))).toBe(true);

    vi.useRealTimers();
  });

  it('returns false when date is today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 8, 15, 0, 0));

    expect(isFutureDate(new Date(2026, 1, 8, 23, 59, 59))).toBe(false);

    vi.useRealTimers();
  });

  it('returns false when date is in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 8));

    expect(isFutureDate(new Date(2026, 1, 7))).toBe(false);

    vi.useRealTimers();
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    const date = new Date(2026, 1, 8);
    const result = addDays(date, 3);

    expect(result.getDate()).toBe(11);
  });

  it('subtracts with negative days', () => {
    const date = new Date(2026, 1, 8);
    const result = addDays(date, -3);

    expect(result.getDate()).toBe(5);
  });

  it('handles month boundary crossing', () => {
    const date = new Date(2026, 0, 30);
    const result = addDays(date, 3);

    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(2);
  });
});

describe('toISODate', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    const date = new Date(2026, 1, 8);

    expect(toISODate(date)).toBe('2026-02-08');
  });

  it('pads single-digit month and day with leading zeros', () => {
    const date = new Date(2026, 0, 5);

    expect(toISODate(date)).toBe('2026-01-05');
  });

  it('uses local date parts, not UTC (timezone safety)', () => {
    // Create a local midnight date — in JST this is 15:00 UTC previous day
    const localMidnight = new Date(2026, 1, 8, 0, 0, 0);

    // Regardless of timezone, toISODate should return the LOCAL date
    expect(toISODate(localMidnight)).toBe('2026-02-08');
  });

  it('handles December correctly', () => {
    const date = new Date(2026, 11, 31);

    expect(toISODate(date)).toBe('2026-12-31');
  });
});

describe('parseISODate', () => {
  it('parses a valid ISO date string to local midnight', () => {
    const result = parseISODate('2026-02-08');

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(8);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('throws for invalid format', () => {
    expect(() => parseISODate('2026/02/08')).toThrow('Invalid ISO date format');
    expect(() => parseISODate('02-08-2026')).toThrow('Invalid ISO date format');
    expect(() => parseISODate('not-a-date')).toThrow('Invalid ISO date format');
    expect(() => parseISODate('')).toThrow('Invalid ISO date format');
  });

  it('throws for date string with time component', () => {
    expect(() => parseISODate('2026-02-08T00:00:00')).toThrow('Invalid ISO date format');
  });

  it('roundtrips with toISODate', () => {
    const original = new Date(2026, 1, 8);
    const isoString = toISODate(original);
    const parsed = parseISODate(isoString);

    expect(parsed.getFullYear()).toBe(original.getFullYear());
    expect(parsed.getMonth()).toBe(original.getMonth());
    expect(parsed.getDate()).toBe(original.getDate());
  });
});

describe('formatDateWithWeekday', () => {
  it('formats date with Japanese weekday', () => {
    // 2026-02-08 is a Sunday
    const date = new Date(2026, 1, 8);

    expect(formatDateWithWeekday(date)).toBe('2月8日（日）');
  });

  it('formats a Monday date correctly', () => {
    // 2026-02-09 is a Monday
    const date = new Date(2026, 1, 9);

    expect(formatDateWithWeekday(date)).toBe('2月9日（月）');
  });
});
