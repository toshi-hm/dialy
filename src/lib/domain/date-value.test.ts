import { describe, expect, it } from 'vitest';
import { DateValue } from './date-value';

describe('DateValue', () => {
  it('checks same month and day while ignoring year', () => {
    const base = DateValue.create(new Date('2026-02-08T00:00:00.000Z'));
    const same = DateValue.create(new Date('2024-02-08T00:00:00.000Z'));
    const different = DateValue.create(new Date('2024-02-07T00:00:00.000Z'));

    expect(base.isSameMonthAndDay(same)).toBe(true);
    expect(base.isSameMonthAndDay(different)).toBe(false);
  });

  it('returns same dates in past years', () => {
    const base = DateValue.create(new Date('2026-02-08T00:00:00.000Z'));

    const result = base.getSameDatesInPastYears(3);

    expect(result).toHaveLength(3);
    expect(result.map((value) => value.formatISO())).toEqual([
      '2025-02-08',
      '2024-02-08',
      '2023-02-08',
    ]);
  });

  it('formats date with weekday and iso', () => {
    const value = DateValue.create(new Date('2026-02-08T00:00:00.000Z'));

    expect(value.formatWithWeekday()).toBe('2月8日（日）');
    expect(value.formatISO()).toBe('2026-02-08');
  });
});
