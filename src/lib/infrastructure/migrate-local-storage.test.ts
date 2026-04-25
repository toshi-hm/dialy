import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionResult, SerializedDiaryEntry } from '@/app/actions/types';
import { parseISODate } from '@/lib/utils/date';
import { STORAGE_KEY } from './local-storage-diary-repository';
import {
  hasMigrated,
  MIGRATION_FLAG_KEY,
  markAsMigrated,
  migrateFromLocalStorage,
  readLocalStorageEntries,
} from './migrate-local-storage';

const VALID_ENTRY = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  date: '2026-02-08',
  content: '今日の日記',
  createdAt: '2026-02-08T00:00:00.000Z',
  updatedAt: '2026-02-08T00:00:00.000Z',
  tags: ['日常'],
};

const ANOTHER_VALID_ENTRY = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  date: '2026-02-09',
  content: '翌日の日記',
  createdAt: '2026-02-09T00:00:00.000Z',
  updatedAt: '2026-02-09T00:00:00.000Z',
};

const makeStorage = (entries: unknown[]) => JSON.stringify({ version: '1.0.0', entries });

const makeSuccessResult = (): ActionResult<SerializedDiaryEntry> => ({
  success: true,
  data: {
    id: VALID_ENTRY.id,
    date: new Date(VALID_ENTRY.date).toISOString(),
    content: VALID_ENTRY.content,
    createdAt: VALID_ENTRY.createdAt,
    updatedAt: VALID_ENTRY.updatedAt,
    tags: VALID_ENTRY.tags,
    userId: null,
  },
});

const makeDuplicateResult = (): ActionResult<SerializedDiaryEntry> => ({
  success: false,
  error: { code: 'DUPLICATE_DATE_ENTRY', message: 'An entry for this date already exists' },
});

const makeErrorResult = (): ActionResult<SerializedDiaryEntry> => ({
  success: false,
  error: { code: 'SAVE_FAILED', message: 'Failed to save' },
});

describe('readLocalStorageEntries', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when LocalStorage has no data', () => {
    expect(readLocalStorageEntries()).toEqual([]);
  });

  it('returns entries from valid LocalStorage data', () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY]));
    const entries = readLocalStorageEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].content).toBe('今日の日記');
  });

  it('returns empty array when LocalStorage data is malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    expect(readLocalStorageEntries()).toEqual([]);
  });

  it('returns empty array when entries field is missing', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: '1.0.0' }));
    expect(readLocalStorageEntries()).toEqual([]);
  });

  it('filters out invalid entries', () => {
    const invalid = { id: 'x', content: 'no date field' };
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY, invalid]));
    const entries = readLocalStorageEntries();
    expect(entries).toHaveLength(1);
  });

  it('returns entries without tags field', () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([ANOTHER_VALID_ENTRY]));
    const entries = readLocalStorageEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].tags).toBeUndefined();
  });
});

describe('hasMigrated / markAsMigrated', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when migration flag is not set', () => {
    expect(hasMigrated()).toBe(false);
  });

  it('returns true after markAsMigrated is called', () => {
    markAsMigrated();
    expect(hasMigrated()).toBe(true);
  });

  it('persists migration flag in localStorage', () => {
    markAsMigrated();
    expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');
  });
});

describe('migrateFromLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns zero counts and marks migrated when no LocalStorage data', async () => {
    const createEntry = vi.fn();
    const result = await migrateFromLocalStorage(createEntry);

    expect(result).toEqual({ migrated: 0, skipped: 0, errors: 0 });
    expect(createEntry).not.toHaveBeenCalled();
    expect(hasMigrated()).toBe(true);
  });

  it('migrates a single entry successfully', async () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY]));
    const createEntry = vi.fn().mockResolvedValue(makeSuccessResult());

    const result = await migrateFromLocalStorage(createEntry);

    expect(result).toEqual({ migrated: 1, skipped: 0, errors: 0 });
    expect(createEntry).toHaveBeenCalledOnce();
    expect(hasMigrated()).toBe(true);
  });

  it('migrates multiple entries and sums counts correctly', async () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY, ANOTHER_VALID_ENTRY]));
    const createEntry = vi.fn().mockResolvedValue(makeSuccessResult());

    const result = await migrateFromLocalStorage(createEntry);

    expect(result).toEqual({ migrated: 2, skipped: 0, errors: 0 });
    expect(createEntry).toHaveBeenCalledTimes(2);
  });

  it('counts DUPLICATE_DATE_ENTRY as skipped', async () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY]));
    const createEntry = vi.fn().mockResolvedValue(makeDuplicateResult());

    const result = await migrateFromLocalStorage(createEntry);

    expect(result).toEqual({ migrated: 0, skipped: 1, errors: 0 });
    expect(hasMigrated()).toBe(true);
  });

  it('counts other server errors as errors', async () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY]));
    const createEntry = vi.fn().mockResolvedValue(makeErrorResult());

    const result = await migrateFromLocalStorage(createEntry);

    expect(result).toEqual({ migrated: 0, skipped: 0, errors: 1 });
    expect(hasMigrated()).toBe(true);
  });

  it('counts thrown exceptions as errors', async () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY]));
    const createEntry = vi.fn().mockRejectedValue(new Error('network error'));

    const result = await migrateFromLocalStorage(createEntry);

    expect(result).toEqual({ migrated: 0, skipped: 0, errors: 1 });
    expect(hasMigrated()).toBe(true);
  });

  it('passes correct arguments to createEntry', async () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY]));
    const createEntry = vi.fn().mockResolvedValue(makeSuccessResult());

    await migrateFromLocalStorage(createEntry);

    // parseISODate でローカルタイムゾーン（JST +09:00）基準の日付に変換されることを確認
    expect(createEntry).toHaveBeenCalledWith(
      parseISODate(VALID_ENTRY.date).toISOString(),
      VALID_ENTRY.content,
      VALID_ENTRY.tags,
    );
  });

  it('passes empty tags array when entry has no tags field', async () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([ANOTHER_VALID_ENTRY]));
    const createEntry = vi.fn().mockResolvedValue(makeSuccessResult());

    await migrateFromLocalStorage(createEntry);

    expect(createEntry).toHaveBeenCalledWith(expect.any(String), ANOTHER_VALID_ENTRY.content, []);
  });

  it('marks migrated even when some entries have errors', async () => {
    localStorage.setItem(STORAGE_KEY, makeStorage([VALID_ENTRY, ANOTHER_VALID_ENTRY]));
    const createEntry = vi
      .fn()
      .mockResolvedValueOnce(makeSuccessResult())
      .mockResolvedValueOnce(makeErrorResult());

    const result = await migrateFromLocalStorage(createEntry);

    expect(result).toEqual({ migrated: 1, skipped: 0, errors: 1 });
    expect(hasMigrated()).toBe(true);
  });
});
