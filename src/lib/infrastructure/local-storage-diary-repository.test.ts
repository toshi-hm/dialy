import { beforeEach, describe, expect, it } from 'vitest';
import { DiaryEntry } from '@/lib/domain/diary-entry';
import { parseISODate } from '@/lib/utils/date';
import { DuplicateDateEntryError } from '@/types/errors';
import {
  LocalStorageDiaryRepository,
  STORAGE_KEY,
  STORAGE_VERSION,
} from './local-storage-diary-repository';

function reconstructEntry(id: string, date: string, content: string): DiaryEntry {
  return DiaryEntry.reconstruct(
    id,
    parseISODate(date),
    content,
    parseISODate('2026-02-08'),
    parseISODate('2026-02-08'),
  );
}

describe('LocalStorageDiaryRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and retrieves entries', async () => {
    const repository = new LocalStorageDiaryRepository();
    const entry = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'entry');

    await repository.save(entry);

    const byId = await repository.findById(entry.id);
    const byDate = await repository.findByDate(parseISODate('2026-02-08'));

    expect(byId?.content).toBe('entry');
    expect(byDate?.id).toBe(entry.id);
    expect(localStorage.getItem(STORAGE_KEY)).toContain(STORAGE_VERSION);
  });

  it('deserializes stored ISO date as local date', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        entries: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            date: '2026-02-08',
            content: 'entry',
            createdAt: '2026-02-08T00:00:00.000Z',
            updatedAt: '2026-02-08T00:00:00.000Z',
          },
        ],
      }),
    );

    const repository = new LocalStorageDiaryRepository();
    const entry = await repository.findById('550e8400-e29b-41d4-a716-446655440000');

    expect(entry).not.toBeNull();
    expect(entry?.date.getTime()).toBe(parseISODate('2026-02-08').getTime());
  });

  it('throws DuplicateDateEntryError when duplicate date entry is saved', async () => {
    const repository = new LocalStorageDiaryRepository();
    const first = reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'first');
    const second = reconstructEntry('550e8400-e29b-41d4-a716-446655440001', '2026-02-08', 'second');

    await repository.save(first);

    await expect(repository.save(second)).rejects.toThrow(DuplicateDateEntryError);
  });

  it('finds entries by same date in past years sorted desc', async () => {
    const repository = new LocalStorageDiaryRepository();
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2025-02-08', '2025'),
    );
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440001', '2024-02-08', '2024'),
    );
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440002', '2023-02-08', '2023'),
    );
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440003', '2025-02-07', 'other'),
    );

    const result = await repository.findBySameDate(parseISODate('2026-02-08'), 3);

    expect(result.map((entry) => entry.content)).toEqual(['2025', '2024', '2023']);
  });

  it('deletes entry by id', async () => {
    const repository = new LocalStorageDiaryRepository();
    const entry = reconstructEntry(
      '550e8400-e29b-41d4-a716-446655440000',
      '2026-02-08',
      'to-delete',
    );
    await repository.save(entry);

    await repository.delete(entry.id);

    expect(await repository.findById(entry.id)).toBeNull();
  });

  it('recovers safely from corrupted localStorage data', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken json');
    const repository = new LocalStorageDiaryRepository();

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('keeps memory cache until invalidated', async () => {
    const repository = new LocalStorageDiaryRepository();
    await repository.save(
      reconstructEntry('550e8400-e29b-41d4-a716-446655440000', '2026-02-08', 'cached'),
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        entries: [],
      }),
    );

    const stillCached = await repository.findAll();
    expect(stillCached).toHaveLength(1);

    repository.invalidateCache();
    const reloaded = await repository.findAll();
    expect(reloaded).toHaveLength(0);
  });

  it('migrates older storage version using extension point', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: '0.9.0',
        entries: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            date: '2025-02-08',
            content: 'legacy',
            createdAt: '2025-02-08T00:00:00.000Z',
            updatedAt: '2025-02-08T00:00:00.000Z',
          },
        ],
      }),
    );

    const repository = new LocalStorageDiaryRepository();
    const result = await repository.findAll();
    const raw = localStorage.getItem(STORAGE_KEY);

    expect(result).toHaveLength(1);
    expect(raw).toContain(`"version":"${STORAGE_VERSION}"`);
  });
});
