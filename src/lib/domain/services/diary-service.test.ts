import { describe, expect, it } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { DiaryService } from './diary-service';

function createEntry(id: string, date: string): DiaryEntry {
  return DiaryEntry.reconstruct(
    id,
    new Date(date),
    `entry-${id}`,
    new Date('2026-02-08T00:00:00.000Z'),
    new Date('2026-02-08T00:00:00.000Z'),
  );
}

describe('DiaryService', () => {
  it('filters entries by same month/day in past years and sorts desc', () => {
    const service = new DiaryService();
    const entries = [
      createEntry('1', '2025-02-08T00:00:00.000Z'),
      createEntry('2', '2024-02-08T00:00:00.000Z'),
      createEntry('3', '2023-02-07T00:00:00.000Z'),
      createEntry('4', '2021-02-08T00:00:00.000Z'),
      createEntry('5', '2019-02-08T00:00:00.000Z'),
      createEntry('6', '2026-02-08T00:00:00.000Z'),
    ];

    const result = service.getEntriesBySameDate(entries, new Date('2026-02-08T00:00:00.000Z'), 5);

    expect(result.map((entry) => entry.id)).toEqual(['1', '2', '4']);
  });

  it('sorts entries by date desc', () => {
    const service = new DiaryService();
    const entries = [
      createEntry('a', '2024-01-01T00:00:00.000Z'),
      createEntry('b', '2026-01-01T00:00:00.000Z'),
      createEntry('c', '2025-01-01T00:00:00.000Z'),
    ];

    const result = service.sortByDateDesc(entries);

    expect(result.map((entry) => entry.id)).toEqual(['b', 'c', 'a']);
  });
});
